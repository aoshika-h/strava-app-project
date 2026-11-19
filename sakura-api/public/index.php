<?php
declare(strict_types=1);

/**
 * intervals.icu API プロキシ（さくらのレンタルサーバ設置用）
 *
 * GET /activities?days=7
 * GET /wellness?days=14
 * GET /activity/{activity_id}        （?raw=1 で intervals.icu の応答をそのまま返す）
 * GET /activity/{activity_id}/power-vs-hr
 * GET /activity/{activity_id}/streams?types=&resolution=&start_sec=&end_sec=（間引き済みの列形式）
 * GET /streams/{activity_id}?types=time,watts,heartrate,cadence（intervals.icu の応答をそのまま返す）
 * POST /mcp                          （MCP サーバー。claude.ai のカスタムコネクタ用）
 * POST /mcp/{MCP_URL_SECRET}         （ヘッダーを設定できないクライアント用。URL 自体を鍵にする）
 *
 * クライアント認証: Authorization: Bearer {PROXY_TOKEN}
 * 計算は intervals.icu に任せ、ここでは認証を隠してフィールドを抜き出すだけ。
 */

const ICU_BASE_URL = 'https://intervals.icu/api/v1';
const MAX_DAYS = 365;
const DEFAULT_STREAM_TYPES = 'time,watts,heartrate,cadence';
/** 分析用ストリームの既定（intervals.icu のストリーム名） */
const ANALYSIS_STREAM_TYPES = ['time', 'watts', 'heartrate', 'cadence', 'velocity_smooth', 'altitude', 'distance'];
/** 間引くときに平均ではなく区間の最後の値を使うストリーム */
const LAST_VALUE_STREAM_TYPES = ['time', 'distance'];
const MAX_STREAM_RESOLUTION = 3600;
const MAX_STREAM_START_SEC = 7 * 24 * 3600;
const STREAM_RESPONSE_BYTES_LIMIT = 100000;
const CONNECT_TIMEOUT_SEC = 5;
const REQUEST_TIMEOUT_SEC = 20;
const STREAM_TIMEOUT_SEC = 40;
const MAX_RETRIES = 2;
const MCP_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

/** クライアントに返すエラー（HTTP ステータスを code に持つ） */
final class ApiError extends RuntimeException
{
}

/** intervals.icu の J（ジュール）を kJ に変換する */
function joules_to_kj($joules): ?float
{
    return is_numeric($joules) ? round($joules / 1000, 1) : null;
}

// ---------------------------------------------------------------------------
// 設定読み込み
// ---------------------------------------------------------------------------

/**
 * 環境変数 → .env ファイルの順で設定を読む。
 * .env は公開ディレクトリの外（既定: ドキュメントルートの親 = ~/icu-proxy.env）に置く。
 */
function load_config(): array
{
    $keys = ['ICU_API_KEY', 'ICU_ATHLETE_ID', 'PROXY_TOKEN', 'MCP_URL_SECRET', 'CORS_ALLOWED_ORIGINS', 'ICU_TIMEZONE'];
    $config = [];
    foreach ($keys as $key) {
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            $config[$key] = $value;
        }
    }

    $envFile = getenv('ICU_PROXY_ENV_FILE');
    if ($envFile === false || $envFile === '') {
        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
        $envFile = $docRoot !== '' ? dirname(rtrim($docRoot, '/')) . '/icu-proxy.env' : '';
    }
    if ($envFile !== '' && is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = array_map('trim', explode('=', $line, 2));
            $value = trim($value, "\"'");
            if (in_array($key, $keys, true) && !isset($config[$key])) {
                $config[$key] = $value;
            }
        }
    }

    return $config;
}

// ---------------------------------------------------------------------------
// レスポンス
// ---------------------------------------------------------------------------

function send_json(int $status, $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function send_error(int $status, string $message): void
{
    send_json($status, ['error' => ['status' => $status, 'message' => $message]]);
}

/** CORS_ALLOWED_ORIGINS（カンマ区切り）に含まれるオリジンのみ許可。未設定なら CORS ヘッダーを付けない。 */
function apply_cors(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = array_filter(array_map('trim', explode(',', $config['CORS_ALLOWED_ORIGINS'] ?? '')));
    if ($origin === '' || !in_array($origin, $allowed, true)) {
        return;
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization');
    header('Access-Control-Max-Age: 600');
    header('Vary: Origin');
}

// ---------------------------------------------------------------------------
// クライアント認証
// ---------------------------------------------------------------------------

function request_authorization_header(): string
{
    // CGI/FastCGI 環境では Authorization が落ちるため、.htaccess で環境変数に詰め替えている
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
        if (!empty($_SERVER[$key])) {
            return $_SERVER[$key];
        }
    }
    if (function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                return $value;
            }
        }
    }
    return '';
}

function require_client_auth(array $config): void
{
    $header = request_authorization_header();
    $token = preg_match('/^Bearer\s+(\S+)$/i', $header, $m) ? $m[1] : '';
    if ($token === '' || !hash_equals($config['PROXY_TOKEN'], $token)) {
        send_error(403, 'forbidden');
    }
}

// ---------------------------------------------------------------------------
// intervals.icu 呼び出し
// ---------------------------------------------------------------------------

/** エラーメッセージから API キー（および Basic 認証文字列）を除去する */
function scrub_secrets(string $text, array $config): string
{
    $key = $config['ICU_API_KEY'];
    return str_replace([$key, base64_encode('API_KEY:' . $key)], '[REDACTED]', $text);
}

/**
 * intervals.icu に GET する。接続失敗・429・5xx は指数バックオフでリトライ。
 * 成功時は生のレスポンスボディを返し、失敗時は ApiError を投げる。
 */
function icu_get(array $config, string $path, array $query, int $timeoutSec): string
{
    $url = ICU_BASE_URL . $path . ($query ? '?' . http_build_query($query) : '');

    for ($attempt = 0; ; $attempt++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
            CURLOPT_USERPWD => 'API_KEY:' . $config['ICU_API_KEY'],
            CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT_SEC,
            CURLOPT_TIMEOUT => $timeoutSec,
            CURLOPT_ENCODING => '',
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_USERAGENT => 'icu-proxy/1.0',
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($ch);
        curl_close($ch);

        $retryable = $body === false || $status === 429 || $status >= 500;
        if ($retryable && $attempt < MAX_RETRIES) {
            usleep((int) (500000 * (2 ** $attempt)));
            continue;
        }
        break;
    }

    if ($body === false) {
        error_log('icu-proxy: upstream request failed (curl errno ' . $errno . ') ' . $path);
        if ($errno === CURLE_OPERATION_TIMEDOUT) {
            throw new ApiError('upstream timeout', 504);
        }
        throw new ApiError('upstream request failed', 502);
    }

    if ($status >= 400) {
        throw new ApiError(scrub_secrets(upstream_error_message($body, $status), $config), $status);
    }

    return $body;
}

function upstream_error_message(string $body, int $status): string
{
    $decoded = json_decode($body, true);
    if (is_array($decoded)) {
        foreach (['error', 'message', 'status'] as $field) {
            if (isset($decoded[$field]) && is_string($decoded[$field])) {
                return $decoded[$field];
            }
        }
    }
    $text = trim(strip_tags($body));
    return $text !== '' ? mb_substr($text, 0, 500) : 'upstream returned HTTP ' . $status;
}

function decode_upstream_list(string $body): array
{
    $decoded = json_decode($body, true);
    if (!is_array($decoded) || !array_is_list($decoded)) {
        throw new ApiError('unexpected upstream response', 502);
    }
    return $decoded;
}

function decode_upstream_object(string $body): array
{
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        throw new ApiError('unexpected upstream response', 502);
    }
    return $decoded;
}

// ---------------------------------------------------------------------------
// パラメータ
// ---------------------------------------------------------------------------

/** days パラメータ（クエリ文字列の文字列、または MCP の整数）を検証する */
function parse_days($raw, int $default): int
{
    if ($raw === null || $raw === '') {
        return $default;
    }
    if (is_string($raw) && ctype_digit($raw)) {
        $raw = (int) $raw;
    }
    if (!is_int($raw) || $raw < 1 || $raw > MAX_DAYS) {
        throw new ApiError('days must be an integer between 1 and ' . MAX_DAYS, 400);
    }
    return $raw;
}

/** intervals.icu に渡す oldest / newest（今日 - n日 〜 今日） */
function date_range(array $config, int $days): array
{
    $tz = new DateTimeZone($config['ICU_TIMEZONE'] ?? 'Asia/Tokyo');
    $today = new DateTimeImmutable('today', $tz);
    return [
        'oldest' => $today->modify("-{$days} days")->format('Y-m-d'),
        'newest' => $today->format('Y-m-d'),
    ];
}

// ---------------------------------------------------------------------------
// エンドポイント
// ---------------------------------------------------------------------------

function fetch_activities(array $config, int $days): array
{
    $path = '/athlete/' . rawurlencode($config['ICU_ATHLETE_ID']) . '/activities';
    $activities = decode_upstream_list(icu_get($config, $path, date_range($config, $days), REQUEST_TIMEOUT_SEC));

    $result = array_map(static function (array $a): array {
        $start = $a['start_date_local'] ?? null;
        return [
            'id' => $a['id'] ?? null,
            'date' => is_string($start) ? substr($start, 0, 10) : null,
            'name' => $a['name'] ?? null,
            'type' => $a['type'] ?? null,
            'moving_time' => $a['moving_time'] ?? null,
            'distance' => $a['distance'] ?? null,
            'elevation' => $a['total_elevation_gain'] ?? null,
            'ftp' => $a['icu_ftp'] ?? null,
            'avg_power' => $a['icu_average_watts'] ?? null,
            'np' => $a['icu_weighted_avg_watts'] ?? null,
            'intensity' => $a['icu_intensity'] ?? null,
            'tss' => $a['icu_training_load'] ?? null,
            'avg_hr' => $a['average_heartrate'] ?? null,
            'max_hr' => $a['max_heartrate'] ?? null,
            'cadence' => $a['average_cadence'] ?? null,
            'decoupling' => $a['decoupling'] ?? null,
            'pw_hr' => $a['icu_power_hr'] ?? null,
            'eftp' => $a['icu_rolling_ftp'] ?? null,
            'kj' => joules_to_kj($a['icu_joules'] ?? null),
            'zone_times' => $a['icu_zone_times'] ?? null,
            'description' => $a['description'] ?? null,
        ];
    }, array_filter($activities, 'is_array'));

    return array_values($result);
}

function fetch_wellness(array $config, int $days): array
{
    $path = '/athlete/' . rawurlencode($config['ICU_ATHLETE_ID']) . '/wellness';
    $records = decode_upstream_list(icu_get($config, $path, date_range($config, $days), REQUEST_TIMEOUT_SEC));

    $result = array_map(static function (array $w): array {
        $ctl = $w['ctl'] ?? null;
        $atl = $w['atl'] ?? null;
        $form = $w['form'] ?? (is_numeric($ctl) && is_numeric($atl) ? $ctl - $atl : null);
        return [
            'date' => $w['id'] ?? $w['date'] ?? null,
            'ctl' => $ctl,
            'atl' => $atl,
            'form' => $form,
            'weight' => $w['weight'] ?? null,
            'resting_hr' => $w['restingHR'] ?? null,
            'hrv' => $w['hrv'] ?? null,
            'sleep_secs' => $w['sleepSecs'] ?? null,
        ];
    }, array_filter($records, 'is_array'));

    return array_values($result);
}

function require_activity_id(string $activityId): void
{
    if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $activityId)) {
        throw new ApiError('invalid activity id', 400);
    }
}

function fetch_activity_raw(array $config, string $activityId): string
{
    require_activity_id($activityId);
    return icu_get($config, '/activity/' . $activityId, ['intervals' => 'true'], REQUEST_TIMEOUT_SEC);
}

/** アクティビティ詳細（intervals.icu のアクティビティ画面のサマリー・ゾーン・インターバル表に相当） */
function fetch_activity(array $config, string $activityId): array
{
    $a = decode_upstream_object(fetch_activity_raw($config, $activityId));

    $start = $a['start_date_local'] ?? null;
    $ctl = $a['icu_ctl'] ?? null;
    $atl = $a['icu_atl'] ?? null;

    $intervals = array_map(static fn(array $i): array => [
        'type' => $i['type'] ?? null,
        'label' => $i['label'] ?? null,
        'start_index' => $i['start_index'] ?? null,
        'end_index' => $i['end_index'] ?? null,
        'elapsed_time' => $i['elapsed_time'] ?? null,
        'moving_time' => $i['moving_time'] ?? null,
        'distance' => $i['distance'] ?? null,
        'avg_power' => $i['average_watts'] ?? null,
        'np' => $i['weighted_average_watts'] ?? null,
        'cadence' => $i['average_cadence'] ?? null,
        'torque' => $i['average_torque'] ?? null,
        'avg_hr' => $i['average_heartrate'] ?? null,
        'max_hr' => $i['max_heartrate'] ?? null,
        'gradient' => $i['average_gradient'] ?? null,
        'intensity' => $i['intensity'] ?? null,
        'zone' => $i['zone'] ?? null,
    ], array_values(array_filter($a['icu_intervals'] ?? [], 'is_array')));

    return [
        'id' => $a['id'] ?? null,
        'date' => is_string($start) ? substr($start, 0, 10) : null,
        'start_time' => $start,
        'name' => $a['name'] ?? null,
        'type' => $a['type'] ?? null,
        'source' => $a['source'] ?? null,

        // 概要
        'distance' => $a['distance'] ?? null,
        'moving_time' => $a['moving_time'] ?? null,
        'elapsed_time' => $a['elapsed_time'] ?? null,
        'coasting_time' => $a['coasting_time'] ?? null,
        'avg_speed' => $a['average_speed'] ?? null,
        'elevation' => $a['total_elevation_gain'] ?? null,
        'cadence' => $a['average_cadence'] ?? null,

        // 負荷
        'intensity' => $a['icu_intensity'] ?? null,
        'tss' => $a['icu_training_load'] ?? null,
        'rpe' => $a['icu_rpe'] ?? null,
        'feel' => $a['feel'] ?? null,
        'session_rpe' => $a['session_rpe'] ?? null,
        'strain_score' => $a['strain_score'] ?? null,
        'strain_score_cp' => $a['ss_cp'] ?? null,
        'strain_score_w_prime' => $a['ss_w_prime'] ?? null,
        'strain_score_p_max' => $a['ss_p_max'] ?? null,
        'trimp' => $a['trimp'] ?? null,
        'polarization_index' => $a['polarization_index'] ?? null,

        // 心拍
        'avg_hr' => $a['average_heartrate'] ?? null,
        'max_hr' => $a['max_heartrate'] ?? null,
        'hrrc' => $a['icu_hrr']['hrr'] ?? null,

        // パワー
        'np' => $a['icu_weighted_avg_watts'] ?? null,
        'avg_power' => $a['icu_average_watts'] ?? null,
        'variability_index' => $a['icu_variability_index'] ?? null,
        'pw_hr' => $a['icu_power_hr'] ?? null,
        'efficiency_factor' => $a['icu_efficiency_factor'] ?? null,
        'decoupling' => $a['decoupling'] ?? null,
        'pw_hr_z2' => $a['icu_power_hr_z2'] ?? null,
        'pw_hr_z2_mins' => $a['icu_power_hr_z2_mins'] ?? null,

        // フィットネス・閾値
        'ctl' => $ctl,
        'atl' => $atl,
        'form' => is_numeric($ctl) && is_numeric($atl) ? $ctl - $atl : null,
        'ftp' => $a['icu_ftp'] ?? null,
        'eftp' => $a['icu_rolling_ftp'] ?? null,
        'activity_eftp' => $a['icu_pm_ftp'] ?? null,
        'w_prime' => $a['icu_w_prime'] ?? null,
        'p_max' => $a['p_max'] ?? null,
        'max_wbal_depletion_kj' => joules_to_kj($a['icu_max_wbal_depletion'] ?? null),

        // エネルギー
        'weight' => $a['icu_weight'] ?? null,
        'kj' => joules_to_kj($a['icu_joules'] ?? null),
        'kj_above_ftp' => joules_to_kj($a['icu_joules_above_ftp'] ?? null),
        'calories' => $a['calories'] ?? null,
        'carbs_used' => $a['carbs_used'] ?? null,
        'carbs_ingested' => $a['carbs_ingested'] ?? null,

        // ゾーン・インターバル
        'interval_summary' => $a['interval_summary'] ?? null,
        'power_zones' => $a['icu_power_zones'] ?? null,
        'sweet_spot_min' => $a['icu_sweet_spot_min'] ?? null,
        'sweet_spot_max' => $a['icu_sweet_spot_max'] ?? null,
        'zone_times' => $a['icu_zone_times'] ?? null,
        'intervals' => $intervals,

        'description' => $a['description'] ?? null,
    ];
}

/** パワー/心拍数の分析値（デカップリング・HR lag など）。グラフ用の series / curves は除く。 */
function fetch_power_vs_hr(array $config, string $activityId): array
{
    require_activity_id($activityId);
    $p = decode_upstream_object(icu_get($config, '/activity/' . $activityId . '/power-vs-hr.json', [], REQUEST_TIMEOUT_SEC));

    return [
        'pw_hr' => $p['powerHr'] ?? null,
        'pw_hr_first_half' => $p['powerHrFirst'] ?? null,
        'pw_hr_second_half' => $p['powerHrSecond'] ?? null,
        'decoupling' => $p['decoupling'] ?? null,
        'hr_lag' => $p['hrLag'] ?? null,
        'pw_hr_z2' => $p['powerHrZ2'] ?? null,
        'cadence_z2_median' => $p['medianCadenceZ2'] ?? null,
        'cadence_z2_avg' => $p['avgCadenceZ2'] ?? null,
        'warmup' => $p['warmup'] ?? null,
        'cooldown' => $p['cooldown'] ?? null,
        'ratio_coefficients' => $p['ratioCoefficients'] ?? null,
    ];
}

/** 整数パラメータ（クエリ文字列の文字列、または MCP の整数）を検証する。未指定なら null */
function parse_int_param($raw, string $name, int $min, int $max): ?int
{
    if ($raw === null || $raw === '') {
        return null;
    }
    if (is_string($raw) && ctype_digit($raw)) {
        $raw = (int) $raw;
    }
    if (!is_int($raw) || $raw < $min || $raw > $max) {
        throw new ApiError("{$name} must be an integer between {$min} and {$max}", 400);
    }
    return $raw;
}

/** types（カンマ区切り文字列または配列）を検証する。time は間引きの基準なので必ず含める */
function parse_stream_types($raw): array
{
    if ($raw === null || $raw === '' || $raw === []) {
        return ANALYSIS_STREAM_TYPES;
    }
    $types = is_string($raw) ? explode(',', $raw) : $raw;
    if (!is_array($types)) {
        throw new ApiError('types must be a list of stream names', 400);
    }
    foreach ($types as $type) {
        if (!is_string($type) || !preg_match('/^[A-Za-z0-9_]{1,40}$/', $type)) {
            throw new ApiError('types must be a list of stream names', 400);
        }
    }
    if (in_array('latlng', $types, true)) {
        throw new ApiError('latlng (location) is not available', 400);
    }
    $types = array_values(array_unique($types));
    if (!in_array('time', $types, true)) {
        array_unshift($types, 'time');
    }
    return $types;
}

/**
 * 時刻（time ストリームの経過秒）で resolution 秒ごとの区間に分け、区間内の平均をとる。
 * time と distance は区間の最後の値。null は平均から除き、区間内がすべて null なら null。
 */
function downsample_streams(array $columns, array $indices, int $origin, int $resolution): array
{
    $groups = [];
    foreach ($indices as $i) {
        $groups[intdiv((int) $columns['time'][$i] - $origin, $resolution)][] = $i;
    }

    $out = array_fill_keys(array_keys($columns), []);
    foreach ($groups as $members) {
        foreach ($columns as $type => $data) {
            if (in_array($type, LAST_VALUE_STREAM_TYPES, true)) {
                $out[$type][] = $data[end($members)] ?? null;
                continue;
            }
            $sum = 0;
            $count = 0;
            foreach ($members as $i) {
                if (is_int($data[$i] ?? null) || is_float($data[$i] ?? null)) {
                    $sum += $data[$i];
                    $count++;
                }
            }
            if ($count === 0) {
                $out[$type][] = null;
                continue;
            }
            $avg = round($sum / $count, 2);
            $out[$type][] = $avg == floor($avg) ? (int) $avg : $avg;
        }
    }
    return $out;
}

/**
 * 分析用のストリーム（列形式）。resolution 秒ごとに間引き、start_sec〜end_sec（end は含まない）で区間を切り出す。
 * 応答が STREAM_RESPONSE_BYTES_LIMIT を超えるときは resolution を自動で上げる。
 */
function fetch_activity_streams(array $config, string $activityId, array $types, ?int $resolution, ?int $startSec, ?int $endSec): array
{
    require_activity_id($activityId);
    if ($startSec !== null && $endSec !== null && $endSec <= $startSec) {
        throw new ApiError('end_sec must be greater than start_sec', 400);
    }

    $raw = decode_upstream_list(icu_get(
        $config,
        '/activity/' . $activityId . '/streams.json',
        ['types' => implode(',', $types)],
        STREAM_TIMEOUT_SEC
    ));
    $available = [];
    foreach ($raw as $stream) {
        if (is_array($stream) && is_string($stream['type'] ?? null) && is_array($stream['data'] ?? null)) {
            $available[$stream['type']] = $stream['data'];
        }
    }
    if (!isset($available['time'])) {
        throw new ApiError('this activity has no time stream', 404);
    }

    $columns = [];
    foreach ($types as $type) {
        if (isset($available[$type])) {
            $columns[$type] = $available[$type];
        }
    }

    $origin = $startSec ?? 0;
    $indices = [];
    foreach ($columns['time'] as $i => $t) {
        if (is_numeric($t) && $t >= $origin && ($endSec === null || $t < $endSec)) {
            $indices[] = $i;
        }
    }

    $requested = $resolution ?? ($startSec !== null || $endSec !== null ? 1 : 5);
    $used = $requested;
    while (true) {
        $streams = downsample_streams($columns, $indices, $origin, $used);
        $bytes = strlen(json_encode($streams));
        if ($bytes <= STREAM_RESPONSE_BYTES_LIMIT || $used >= MAX_STREAM_RESOLUTION) {
            break;
        }
        $used = min(MAX_STREAM_RESOLUTION, max($used + 1, (int) ceil($used * $bytes / STREAM_RESPONSE_BYTES_LIMIT * 1.05)));
    }

    $times = $streams['time'];
    return [
        'activity_id' => $activityId,
        'resolution' => $used,
        'requested_resolution' => $requested,
        'start_sec' => $indices ? (int) $columns['time'][$indices[0]] : null,
        'end_sec' => $times ? end($times) : null,
        'n' => count($times),
        'missing_types' => array_values(array_diff($types, array_keys($columns))),
        'streams' => $streams,
    ];
}

function handle_streams(array $config, string $activityId): void
{
    require_activity_id($activityId);
    $types = $_GET['types'] ?? DEFAULT_STREAM_TYPES;
    if (!is_string($types) || !preg_match('/^[A-Za-z0-9_]+(,[A-Za-z0-9_]+)*$/', $types)) {
        throw new ApiError('types must be a comma separated list of stream names', 400);
    }

    $body = icu_get($config, '/activity/' . $activityId . '/streams', ['types' => $types], STREAM_TIMEOUT_SEC);
    http_response_code(200);
    echo $body;
    exit;
}

// ---------------------------------------------------------------------------
// MCP サーバー（Streamable HTTP。SSE は使わず JSON で応答する）
// ---------------------------------------------------------------------------

function mcp_tools(): array
{
    $days = static fn(int $default): array => [
        'type' => 'integer',
        'minimum' => 1,
        'maximum' => MAX_DAYS,
        'default' => $default,
        'description' => "今日から遡る日数（既定 {$default}）",
    ];
    $activityId = [
        'type' => 'string',
        'description' => 'アクティビティ ID（list_activities の id。例 i204425268）',
    ];
    $readOnly = ['readOnlyHint' => true, 'openWorldHint' => false];

    return [
        [
            'name' => 'list_activities',
            'title' => 'アクティビティ一覧',
            'description' => '直近 n 日のアクティビティ一覧（NP・TSS・IF・デカップリング・心拍・kJ 等）。新しい順。'
                . 'Strava 経由で取り込まれたアクティビティは id と date 以外が null。',
            'inputSchema' => ['type' => 'object', 'properties' => ['days' => $days(7)]],
            'annotations' => $readOnly,
        ],
        [
            'name' => 'get_activity',
            'title' => 'アクティビティ詳細',
            'description' => '1件のアクティビティ詳細（負荷・SS・パワー・心拍・CTL/ATL・FTP/eFTP・W\'・エネルギー・ゾーン時間・インターバル表）。'
                . '距離は m、時間は秒、速度は m/s、勾配は比率（0.05 = 5%）。',
            'inputSchema' => [
                'type' => 'object',
                'properties' => ['activity_id' => $activityId],
                'required' => ['activity_id'],
            ],
            'annotations' => $readOnly,
        ],
        [
            'name' => 'get_power_vs_hr',
            'title' => 'パワー/心拍数の分析',
            'description' => 'パワー/心拍数（全体・前半・後半）、有酸素デカップリング（%）、HR lag（秒）、Z2 効率。',
            'inputSchema' => [
                'type' => 'object',
                'properties' => ['activity_id' => $activityId],
                'required' => ['activity_id'],
            ],
            'annotations' => $readOnly,
        ],
        [
            'name' => 'get_activity_streams',
            'title' => 'ストリーム（秒ごとのデータ）',
            'description' => 'ライドの時系列データを列形式で返す（深掘り用）。区間ごとの心拍の上がり方、高強度区間の特定、同じパワーでの心拍比較などに使う。'
                . 'time は経過秒（停止中は記録されない）。resolution 秒ごとに区間の平均（time・distance は区間の最後の値）。null は欠損。'
                . 'watts=W、heartrate=bpm、cadence=rpm、velocity_smooth=m/s、altitude=m、distance=m。'
                . '応答が約 100KB を超えると resolution を自動で上げ、実際の値を resolution に返す。',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'activity_id' => $activityId,
                    'types' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                        'description' => '取得するストリーム（既定 ' . implode(', ', ANALYSIS_STREAM_TYPES) . '）。time は常に含まれる',
                    ],
                    'resolution' => [
                        'type' => 'integer',
                        'minimum' => 1,
                        'maximum' => MAX_STREAM_RESOLUTION,
                        'description' => '何秒ごとに間引くか（既定 5。start_sec / end_sec を指定したときは既定 1）',
                    ],
                    'start_sec' => [
                        'type' => 'integer',
                        'minimum' => 0,
                        'description' => '区間の開始（経過秒、この値を含む）',
                    ],
                    'end_sec' => [
                        'type' => 'integer',
                        'minimum' => 1,
                        'description' => '区間の終了（経過秒、この値を含まない）',
                    ],
                ],
                'required' => ['activity_id'],
            ],
            'annotations' => $readOnly,
        ],
        [
            'name' => 'list_wellness',
            'title' => 'コンディション',
            'description' => '直近 n 日の日別 CTL（フィットネス）・ATL（ファティーグ）・フォーム・体重・安静時心拍・HRV・睡眠秒。古い順。',
            'inputSchema' => ['type' => 'object', 'properties' => ['days' => $days(14)]],
            'annotations' => $readOnly,
        ],
    ];
}

function mcp_call_tool(array $config, string $name, array $args): array
{
    switch ($name) {
        case 'list_activities':
            return fetch_activities($config, parse_days($args['days'] ?? null, 7));
        case 'get_activity':
            return fetch_activity($config, (string) ($args['activity_id'] ?? ''));
        case 'get_power_vs_hr':
            return fetch_power_vs_hr($config, (string) ($args['activity_id'] ?? ''));
        case 'get_activity_streams':
            return fetch_activity_streams(
                $config,
                (string) ($args['activity_id'] ?? ''),
                parse_stream_types($args['types'] ?? null),
                parse_int_param($args['resolution'] ?? null, 'resolution', 1, MAX_STREAM_RESOLUTION),
                parse_int_param($args['start_sec'] ?? null, 'start_sec', 0, MAX_STREAM_START_SEC),
                parse_int_param($args['end_sec'] ?? null, 'end_sec', 1, MAX_STREAM_START_SEC)
            );
        case 'list_wellness':
            return fetch_wellness($config, parse_days($args['days'] ?? null, 14));
    }
    throw new ApiError('unknown tool: ' . $name, 404);
}

function mcp_respond($id, array $payload): void
{
    send_json(200, ['jsonrpc' => '2.0', 'id' => $id] + $payload);
}

function handle_mcp(array $config): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        // サーバーからのイベントストリーム（GET）は提供しない
        header('Allow: POST');
        send_error(405, 'method not allowed');
    }

    $req = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($req) || array_is_list($req)) {
        send_json(400, ['jsonrpc' => '2.0', 'id' => null, 'error' => ['code' => -32700, 'message' => 'parse error']]);
    }

    // 通知（id なし）には応答本文を返さない
    if (!array_key_exists('id', $req)) {
        http_response_code(202);
        exit;
    }

    $params = is_array($req['params'] ?? null) ? $req['params'] : [];
    mcp_respond($req['id'], mcp_dispatch($config, (string) ($req['method'] ?? ''), $params));
}

/** JSON-RPC のメソッドを処理し、result または error を返す */
function mcp_dispatch(array $config, string $method, array $params): array
{
    switch ($method) {
        case 'initialize':
            $requested = $params['protocolVersion'] ?? '';
            return ['result' => [
                'protocolVersion' => in_array($requested, MCP_PROTOCOL_VERSIONS, true) ? $requested : MCP_PROTOCOL_VERSIONS[0],
                'capabilities' => ['tools' => ['listChanged' => false]],
                'serverInfo' => ['name' => 'icu-proxy', 'version' => '1.0.0'],
                'instructions' => 'intervals.icu のサイクリングトレーニングデータ（読み取り専用）。'
                    . '数値は intervals.icu が計算した値で、null は未計算・未入力を表すので推測で埋めないこと。',
            ]];
        case 'ping':
            return ['result' => new stdClass()];
        case 'tools/list':
            return ['result' => ['tools' => mcp_tools()]];
        case 'tools/call':
            $args = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];
            try {
                $data = mcp_call_tool($config, (string) ($params['name'] ?? ''), $args);
                $text = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                return ['result' => ['content' => [['type' => 'text', 'text' => $text]]]];
            } catch (ApiError $e) {
                return ['result' => [
                    'content' => [['type' => 'text', 'text' => 'エラー（HTTP ' . $e->getCode() . '）: ' . $e->getMessage()]],
                    'isError' => true,
                ]];
            }
    }
    return ['error' => ['code' => -32601, 'message' => 'method not found']];
}

// ---------------------------------------------------------------------------
// ルーティング
// ---------------------------------------------------------------------------

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (extension_loaded('zlib') && !ini_get('zlib.output_compression')) {
    ob_start('ob_gzhandler');
}

$config = load_config();
apply_cors($config);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

foreach (['ICU_API_KEY', 'ICU_ATHLETE_ID', 'PROXY_TOKEN'] as $required) {
    if (empty($config[$required])) {
        error_log('icu-proxy: missing config ' . $required);
        send_error(500, 'server is not configured');
    }
}

// 設置ディレクトリ（例: /icu-proxy）からの相対パスを取り出す
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$baseDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
if ($baseDir !== '' && str_starts_with($requestPath, $baseDir . '/')) {
    $requestPath = substr($requestPath, strlen($baseDir));
}
$requestPath = '/' . trim($requestPath, '/');

// MCP: Bearer トークン、または URL に埋め込んだ秘密の文字列（32 文字以上のときだけ有効）で認証する
if ($requestPath === '/mcp') {
    require_client_auth($config);
    handle_mcp($config);
}
if (preg_match('#^/mcp/([^/]+)$#', $requestPath, $m)) {
    $secret = $config['MCP_URL_SECRET'] ?? '';
    if (strlen($secret) < 32 || !hash_equals($secret, rawurldecode($m[1]))) {
        send_error(404, 'not found');
    }
    handle_mcp($config);
}

if ($method !== 'GET') {
    header('Allow: GET, OPTIONS');
    send_error(405, 'method not allowed');
}

require_client_auth($config);

try {
    $days = $_GET['days'] ?? null;
    if ($requestPath === '/activities') {
        send_json(200, fetch_activities($config, parse_days($days, 7)));
    } elseif ($requestPath === '/wellness') {
        send_json(200, fetch_wellness($config, parse_days($days, 14)));
    } elseif (preg_match('#^/activity/([^/]+)/streams$#', $requestPath, $m)) {
        send_json(200, fetch_activity_streams(
            $config,
            rawurldecode($m[1]),
            parse_stream_types($_GET['types'] ?? null),
            parse_int_param($_GET['resolution'] ?? null, 'resolution', 1, MAX_STREAM_RESOLUTION),
            parse_int_param($_GET['start_sec'] ?? null, 'start_sec', 0, MAX_STREAM_START_SEC),
            parse_int_param($_GET['end_sec'] ?? null, 'end_sec', 1, MAX_STREAM_START_SEC)
        ));
    } elseif (preg_match('#^/activity/([^/]+)/power-vs-hr$#', $requestPath, $m)) {
        send_json(200, fetch_power_vs_hr($config, rawurldecode($m[1])));
    } elseif (preg_match('#^/activity/([^/]+)$#', $requestPath, $m)) {
        $activityId = rawurldecode($m[1]);
        if (($_GET['raw'] ?? '') === '1') {
            // フィールド名の確認用に intervals.icu の応答をそのまま返す
            http_response_code(200);
            echo fetch_activity_raw($config, $activityId);
            exit;
        }
        send_json(200, fetch_activity($config, $activityId));
    } elseif (preg_match('#^/streams/([^/]+)$#', $requestPath, $m)) {
        handle_streams($config, rawurldecode($m[1]));
    }
} catch (ApiError $e) {
    send_error($e->getCode(), $e->getMessage());
}

send_error(404, 'not found');
