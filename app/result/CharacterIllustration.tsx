'use client'
// キャラクターSVGイラストコンポーネント
// 各サイクリストタイプに固有のメカ/ロボット風ポートレートを描画する

import type { CharacterId } from '@/lib/character'

// ---- クライマー: 山岳型メカ、山頂をかたどった尖ったヘルメット ----
function ClimberSVG({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="clg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="260" fill="url(#clg)" />

      {/* 胴体アーマー */}
      <rect x="66" y="163" width="68" height="70" rx="10" fill="#052e16" />
      <rect x="74" y="171" width="52" height="54" rx="8" fill="#065f46" />
      {/* 胸エンブレム: 山型 */}
      <polygon points="100,177 122,205 78,205" fill={c} opacity="0.9" />
      <polygon points="88,205 100,188 112,205" fill={c} />

      {/* 肩アーマー（鋭角） */}
      <polygon points="46,158 66,152 66,178 48,174" fill="#065f46" />
      <polygon points="154,158 134,152 134,178 152,174" fill="#065f46" />
      <polygon points="40,153 52,146 56,162 44,166" fill={c} opacity="0.7" />
      <polygon points="160,153 148,146 144,162 156,166" fill={c} opacity="0.7" />

      {/* 首 */}
      <rect x="87" y="150" width="26" height="17" rx="5" fill="#033d2a" />

      {/* ヘルメット本体 */}
      <ellipse cx="100" cy="113" rx="40" ry="43" fill="#047857" />
      {/* 山頂スパイク */}
      <polygon points="82,78 100,52 118,78" fill={c} />
      <polygon points="89,78 100,62 111,78" fill="#34d399" opacity="0.9" />
      {/* サイドパネル */}
      <rect x="60" y="98" width="10" height="30" rx="4" fill="#034f3a" />
      <rect x="130" y="98" width="10" height="30" rx="4" fill="#034f3a" />
      {/* バイザー（細目型） */}
      <rect x="70" y="110" width="60" height="16" rx="8" fill="#000" opacity="0.92" />
      <rect x="72" y="111" width="56" height="14" rx="7" fill={c} opacity="0.45" />
      <rect x="76" y="113" width="48" height="10" rx="5" fill={c} opacity="0.85" />
      {/* ベント */}
      <rect x="84" y="130" width="32" height="5" rx="2.5" fill="#034f3a" />

      {/* 上昇ライン */}
      <line x1="28" y1="88" x2="54" y2="76" stroke={c} strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="22" y1="100" x2="50" y2="92" stroke={c} strokeWidth="1" strokeOpacity="0.35" />
      <line x1="172" y1="88" x2="146" y2="76" stroke={c} strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  )
}

// ---- スプリンター: 空力メカ、後方に流れる稲妻ヘルメット ----
function SprinterSVG({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="spg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="260" fill="url(#spg)" />

      {/* スピードライン */}
      <line x1="0" y1="128" x2="62" y2="128" stroke={c} strokeWidth="2.5" strokeOpacity="0.45" />
      <line x1="0" y1="138" x2="48" y2="138" stroke={c} strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="0" y1="118" x2="52" y2="118" stroke={c} strokeWidth="1" strokeOpacity="0.25" />
      <line x1="138" y1="128" x2="200" y2="128" stroke={c} strokeWidth="2.5" strokeOpacity="0.45" />
      <line x1="152" y1="138" x2="200" y2="138" stroke={c} strokeWidth="1.5" strokeOpacity="0.3" />

      {/* 胴体（前傾シルエット） */}
      <rect x="68" y="162" width="64" height="70" rx="12" fill="#451a03" />
      <rect x="76" y="170" width="48" height="54" rx="8" fill="#92400e" />
      {/* 胸エンブレム: 稲妻 */}
      <polygon points="108,175 95,198 104,198 91,222 116,195 107,195 120,175" fill={c} />

      {/* 肩アーマー（流線型） */}
      <ellipse cx="57" cy="167" rx="17" ry="13" fill="#92400e" transform="rotate(-10 57 167)" />
      <ellipse cx="143" cy="167" rx="17" ry="13" fill="#92400e" transform="rotate(10 143 167)" />

      {/* 首 */}
      <rect x="87" y="150" width="26" height="16" rx="5" fill="#5b2100" />

      {/* ヘルメット（後方テール型） */}
      <ellipse cx="100" cy="112" rx="36" ry="38" fill="#b45309" />
      <polygon points="116,88 158,118 138,146 116,140" fill="#92400e" />
      <polygon points="119,94 152,120 136,142 120,137" fill="#b45309" />
      {/* バイザー（斜め鋭角） */}
      <polygon points="67,107 133,107 129,126 71,126" fill="#000" opacity="0.92" />
      <polygon points="69,108 131,108 127,124 73,124" fill={c} opacity="0.4" />
      <polygon points="73,110 127,110 123,122 77,122" fill={c} opacity="0.85" />
      {/* サイドライン */}
      <line x1="63" y1="103" x2="63" y2="130" stroke={c} strokeWidth="2.5" strokeOpacity="0.65" />
      <line x1="137" y1="103" x2="137" y2="130" stroke={c} strokeWidth="2.5" strokeOpacity="0.65" />
      {/* エアインテーク */}
      <rect x="70" y="128" width="60" height="6" rx="3" fill="#5b2100" />
    </svg>
  )
}

// ---- タイムトライアリスト: 重装甲メカ、ティアドロップTTヘルメット ----
function TTSVG({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ttg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="260" fill="url(#ttg)" />

      {/* 機械的なグリッドライン */}
      <line x1="20" y1="232" x2="180" y2="232" stroke={c} strokeWidth="0.6" strokeOpacity="0.3" />
      <line x1="20" y1="240" x2="180" y2="240" stroke={c} strokeWidth="0.4" strokeOpacity="0.2" />

      {/* 胴体（重厚アーマー） */}
      <rect x="60" y="160" width="80" height="74" rx="8" fill="#1e3a5f" />
      <rect x="68" y="168" width="64" height="58" rx="6" fill="#1e40af" opacity="0.5" />
      {/* 胸エンブレム: 歯車 */}
      <circle cx="100" cy="196" r="22" fill="#1e3a5f" stroke={c} strokeWidth="2" />
      <circle cx="100" cy="196" r="14" fill="#1e40af" />
      <circle cx="100" cy="196" r="7" fill={c} opacity="0.9" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <rect
          key={i}
          x="98.5" y="172"
          width="3" height="9"
          rx="1.5"
          fill={c}
          opacity="0.8"
          transform={`rotate(${deg} 100 196)`}
        />
      ))}

      {/* 肩（角張った重装甲） */}
      <rect x="40" y="154" width="24" height="26" rx="4" fill="#1e3a5f" />
      <rect x="136" y="154" width="24" height="26" rx="4" fill="#1e3a5f" />
      <rect x="42" y="156" width="20" height="22" rx="3" fill="#1e40af" opacity="0.6" />
      <rect x="138" y="156" width="20" height="22" rx="3" fill="#1e40af" opacity="0.6" />

      {/* 首 */}
      <rect x="85" y="147" width="30" height="17" rx="5" fill="#1e3a5f" />

      {/* ヘルメット（TTティアドロップ型） */}
      <ellipse cx="100" cy="99" rx="38" ry="46" fill="#1d4ed8" />
      <ellipse cx="116" cy="110" rx="20" ry="32" fill="#1e40af" transform="rotate(22 116 110)" />
      {/* フルフェイスバイザー */}
      <ellipse cx="97" cy="117" rx="32" ry="22" fill="#000" opacity="0.9" />
      <ellipse cx="97" cy="116" rx="27" ry="17" fill={c} opacity="0.3" />
      <ellipse cx="97" cy="114" rx="20" ry="11" fill={c} opacity="0.65" />
      {/* ヘルメット上部ライン */}
      <line x1="68" y1="78" x2="132" y2="78" stroke={c} strokeWidth="1.5" strokeOpacity="0.5" />
      {/* サイドパネル */}
      <rect x="62" y="93" width="8" height="32" rx="3" fill="#1e3a5f" />
      <rect x="130" y="93" width="8" height="32" rx="3" fill="#1e3a5f" />
    </svg>
  )
}

// ---- グランフォンド: 探検家メカ、広ブリム付き冒険家ヘルメット ----
function GranFondoSVG({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gfg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="260" fill="url(#gfg)" />

      {/* 地平線ライン */}
      <line x1="0" y1="242" x2="200" y2="242" stroke={c} strokeWidth="1" strokeOpacity="0.35" />
      <line x1="0" y1="248" x2="200" y2="248" stroke={c} strokeWidth="0.5" strokeOpacity="0.2" />

      {/* 胴体（探検家装備） */}
      <rect x="64" y="162" width="72" height="70" rx="10" fill="#2e1065" />
      <rect x="72" y="170" width="56" height="54" rx="8" fill="#4c1d95" />
      {/* 胸エンブレム: コンパス */}
      <circle cx="100" cy="196" r="20" fill="#2e1065" stroke={c} strokeWidth="2" />
      <circle cx="100" cy="196" r="12" fill="#4c1d95" />
      <polygon points="100,182 104,196 100,210 96,196" fill={c} opacity="0.9" />
      <polygon points="100,182 104,196 100,196 96,196" fill="white" opacity="0.7" />
      <line x1="86" y1="196" x2="114" y2="196" stroke={c} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="100" cy="196" r="3.5" fill={c} />

      {/* 肩 */}
      <rect x="43" y="155" width="25" height="22" rx="6" fill="#4c1d95" />
      <rect x="132" y="155" width="25" height="22" rx="6" fill="#4c1d95" />

      {/* 首 */}
      <rect x="86" y="149" width="28" height="17" rx="5" fill="#2e1065" />

      {/* ヘルメット（探検家ブリム付き） */}
      <ellipse cx="100" cy="112" rx="42" ry="40" fill="#6d28d9" />
      {/* ブリム（前つば） */}
      <ellipse cx="100" cy="135" rx="52" ry="10" fill="#5b21b6" />
      <rect x="55" y="130" width="90" height="9" fill="#5b21b6" />
      <ellipse cx="100" cy="139" rx="46" ry="7" fill="#4c1d95" />
      {/* バイザー */}
      <rect x="68" y="109" width="64" height="16" rx="8" fill="#000" opacity="0.87" />
      <rect x="70" y="110" width="60" height="14" rx="7" fill={c} opacity="0.38" />
      <rect x="74" y="112" width="52" height="10" rx="5" fill={c} opacity="0.75" />
      {/* 頂部アンテナ */}
      <line x1="100" y1="72" x2="100" y2="58" stroke={c} strokeWidth="2" />
      <circle cx="100" cy="55" r="5" fill={c} opacity="0.85" />
      {/* 遠望ライン */}
      <line x1="22" y1="157" x2="50" y2="151" stroke={c} strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="178" y1="157" x2="150" y2="151" stroke={c} strokeWidth="1.5" strokeOpacity="0.4" />
    </svg>
  )
}

// ---- オールラウンダー: バランスメカ、ベント付き標準ロードヘルメット ----
function AllRounderSVG({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="arg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="260" fill="url(#arg)" />

      {/* 胴体 */}
      <rect x="66" y="162" width="68" height="70" rx="10" fill="#431407" />
      <rect x="74" y="170" width="52" height="54" rx="8" fill="#7c2d12" />
      {/* 胸エンブレム: ターゲット */}
      <circle cx="100" cy="196" r="22" fill="#431407" stroke={c} strokeWidth="2" />
      <circle cx="100" cy="196" r="15" fill="#7c2d12" />
      <circle cx="100" cy="196" r="8" fill={c} opacity="0.85" />
      <circle cx="100" cy="196" r="3.5" fill="white" opacity="0.9" />

      {/* 肩（バランス型） */}
      <ellipse cx="55" cy="167" rx="17" ry="13" fill="#7c2d12" />
      <ellipse cx="145" cy="167" rx="17" ry="13" fill="#7c2d12" />
      <circle cx="55" cy="161" r="5.5" fill={c} opacity="0.7" />
      <circle cx="145" cy="161" r="5.5" fill={c} opacity="0.7" />

      {/* 首 */}
      <rect x="87" y="150" width="26" height="16" rx="5" fill="#431407" />

      {/* ヘルメット（ロードヘルメット型・ベント付き） */}
      <ellipse cx="100" cy="111" rx="39" ry="42" fill="#c2410c" />
      {/* ベンチレーション溝 */}
      <rect x="80" y="78" width="9" height="28" rx="4.5" fill="#7c2d12" />
      <rect x="95.5" y="74" width="9" height="32" rx="4.5" fill="#7c2d12" />
      <rect x="111" y="78" width="9" height="28" rx="4.5" fill="#7c2d12" />
      {/* バイザー */}
      <rect x="70" y="117" width="60" height="15" rx="7.5" fill="#000" opacity="0.92" />
      <rect x="72" y="118" width="56" height="13" rx="6.5" fill={c} opacity="0.4" />
      <rect x="76" y="120" width="48" height="9" rx="4.5" fill={c} opacity="0.88" />
      {/* ヘルメット後部のカーブ */}
      <ellipse cx="100" cy="142" rx="30" ry="12" fill="#ea580c" opacity="0.5" />
      {/* サイドストライプ */}
      <line x1="61" y1="100" x2="61" y2="140" stroke={c} strokeWidth="3" strokeOpacity="0.65" />
      <line x1="139" y1="100" x2="139" y2="140" stroke={c} strokeWidth="3" strokeOpacity="0.65" />
    </svg>
  )
}

// ---- サンデーライダー: カジュアルメカ、太陽バイザー付きヘルメット ----
function WeekendSVG({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wkg" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="260" fill="url(#wkg)" />

      {/* 太陽の光線 */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180)
        return (
          <line
            key={i}
            x1="100" y1="28"
            x2={100 + 24 * Math.cos(angle)}
            y2={28 + 24 * Math.sin(angle)}
            stroke={c}
            strokeWidth="2"
            strokeOpacity="0.4"
          />
        )
      })}
      <circle cx="100" cy="28" r="11" fill={c} opacity="0.55" />
      <circle cx="100" cy="28" r="6" fill={c} opacity="0.9" />

      {/* 胴体（カジュアルジャージ） */}
      <rect x="67" y="162" width="66" height="70" rx="12" fill="#500724" />
      <rect x="75" y="170" width="50" height="54" rx="10" fill="#9d174d" />
      {/* 胸エンブレム: 太陽 */}
      <circle cx="100" cy="196" r="18" fill={c} opacity="0.85" />
      <circle cx="100" cy="196" r="11" fill="#fdf2f8" />
      <circle cx="100" cy="196" r="5.5" fill={c} />

      {/* 肩（丸みのあるカジュアル） */}
      <ellipse cx="56" cy="167" rx="15" ry="12" fill="#9d174d" />
      <ellipse cx="144" cy="167" rx="15" ry="12" fill="#9d174d" />

      {/* 首 */}
      <rect x="87" y="150" width="26" height="16" rx="6" fill="#500724" />

      {/* ヘルメット（丸みのあるカジュアルスタイル） */}
      <ellipse cx="100" cy="113" rx="40" ry="43" fill="#be185d" />
      {/* つば */}
      <ellipse cx="100" cy="138" rx="48" ry="9" fill="#9d174d" />
      <rect x="54" y="132" width="92" height="9" fill="#9d174d" />
      <ellipse cx="100" cy="141" rx="42" ry="7" fill="#be185d" opacity="0.5" />
      {/* バイザー（丸くて親しみやすい） */}
      <ellipse cx="100" cy="121" rx="31" ry="14" fill="#000" opacity="0.82" />
      <ellipse cx="100" cy="120" rx="27" ry="11" fill={c} opacity="0.35" />
      <ellipse cx="100" cy="119" rx="20" ry="7.5" fill={c} opacity="0.75" />
      {/* ヘルメットのカラーライン */}
      <ellipse cx="100" cy="82" rx="28" ry="7" fill="#ec4899" opacity="0.45" />
      {/* キラキラ装飾 */}
      <circle cx="43" cy="96" r="3.5" fill={c} opacity="0.55" />
      <circle cx="157" cy="96" r="3.5" fill={c} opacity="0.55" />
      <circle cx="38" cy="112" r="2.5" fill={c} opacity="0.4" />
      <circle cx="162" cy="112" r="2.5" fill={c} opacity="0.4" />
    </svg>
  )
}

// ---- エクスポート: characterIdに対応するSVGを返す ----
export default function CharacterIllustration({
  characterId,
  accentColor,
}: {
  characterId: CharacterId
  accentColor: string
}) {
  const c = accentColor
  const map: Record<CharacterId, React.ReactElement> = {
    climber: <ClimberSVG c={c} />,
    sprinter: <SprinterSVG c={c} />,
    tt: <TTSVG c={c} />,
    granfondo: <GranFondoSVG c={c} />,
    allrounder: <AllRounderSVG c={c} />,
    weekend: <WeekendSVG c={c} />,
  }
  return map[characterId]
}
