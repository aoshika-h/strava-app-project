<?php
declare(strict_types=1);

/**
 * intervals.icu API プロキシ（さくらのレンタルサーバ設置用）
 *
 * GET /activities?days=7
 * GET /wellness?days=14
 * GET /streams/{activity_id}?types=time,watts,heart_rate,cadence
 *
 * クライアント認証: Authorization: Bearer {PROXY_TOKEN}
 * 計算は intervals.icu に任せ、ここでは認証を隠してフィールドを抜き出すだけ。
 */

const ICU_BASE_URL = 'https://intervals.icu/api/v1';
const MAX_DAYS = 365;
const DEFAULT_STREAM_TYPES = 'time,watts,heart_rate,cadence';
const CONNECT_TIMEOUT_SEC = 5;
const REQUEST_TIMEOUT_SEC = 20;
const STREAM_TIMEOUT_SEC = 40;
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// 設定読み込み
// ---------------------------------------------------------------------------

/**
 * 環境変数 → .env ファイルの順で設定を読む。
 * .env は公開ディレクトリの外（既定: ドキュメントルートの親 = ~/icu-proxy.env）に置く。
 */
function load_config(): array
{
    $keys = ['ICU_API_KEY', 'ICU_ATHLETE_ID', 'PROXY_TOKEN', 'CORS_ALLOWED_ORIGINS', 'ICU_TIMEZONE'];
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
 * 成功時は生のレスポンスボディを返し、失敗時はエラーレスポンスを返して終了する。
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
            send_error(504, 'upstream timeout');
        }
        send_error(502, 'upstream request failed');
    }

    if ($status >= 400) {
        send_error($status, scrub_secrets(upstream_error_message($body, $status), $config));
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
        send_error(502, 'unexpected upstream response');
    }
    return $decoded;
}

// ---------------------------------------------------------------------------
// パラメータ
// ---------------------------------------------------------------------------

function days_param(int $default): int
{
    $raw = $_GET['days'] ?? null;
    if ($raw === null || $raw === '') {
        return $default;
    }
    if (!is_string($raw) || !ctype_digit($raw) || (int) $raw < 1 || (int) $raw > MAX_DAYS) {
        send_error(400, 'days must be an integer between 1 and ' . MAX_DAYS);
    }
    return (int) $raw;
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

function handle_activities(array $config): void
{
    $days = days_param(7);
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
            'eftp' => $a['icu_eftp'] ?? null,
            'kj' => $a['icu_joules'] ?? null,
            'zone_times' => $a['icu_zone_times'] ?? null,
            'description' => $a['description'] ?? null,
        ];
    }, array_filter($activities, 'is_array'));

    send_json(200, array_values($result));
}

function handle_wellness(array $config): void
{
    $days = days_param(14);
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

    send_json(200, array_values($result));
}

function handle_streams(array $config, string $activityId): void
{
    if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $activityId)) {
        send_error(400, 'invalid activity id');
    }
    $types = $_GET['types'] ?? DEFAULT_STREAM_TYPES;
    if (!is_string($types) || !preg_match('/^[A-Za-z0-9_]+(,[A-Za-z0-9_]+)*$/', $types)) {
        send_error(400, 'types must be a comma separated list of stream names');
    }

    $body = icu_get($config, '/activity/' . $activityId . '/streams', ['types' => $types], STREAM_TIMEOUT_SEC);
    http_response_code(200);
    echo $body;
    exit;
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
if ($method !== 'GET') {
    header('Allow: GET, OPTIONS');
    send_error(405, 'method not allowed');
}

foreach (['ICU_API_KEY', 'ICU_ATHLETE_ID', 'PROXY_TOKEN'] as $required) {
    if (empty($config[$required])) {
        error_log('icu-proxy: missing config ' . $required);
        send_error(500, 'server is not configured');
    }
}

require_client_auth($config);

// 設置ディレクトリ（例: /icu-proxy）からの相対パスを取り出す
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$baseDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
if ($baseDir !== '' && str_starts_with($requestPath, $baseDir . '/')) {
    $requestPath = substr($requestPath, strlen($baseDir));
}
$requestPath = '/' . trim($requestPath, '/');

if ($requestPath === '/activities') {
    handle_activities($config);
} elseif ($requestPath === '/wellness') {
    handle_wellness($config);
} elseif (preg_match('#^/streams/([^/]+)$#', $requestPath, $m)) {
    handle_streams($config, rawurldecode($m[1]));
}

send_error(404, 'not found');
