// 一言コメントの日本語の文章。例えは富士山・スカイツリー・東京〜大阪・日本列島縦断
import type { InsightMessages } from './types'

export const ja: InsightMessages = {
  numberLocale: 'ja-JP',
  analogs: {
    hugeMountainM: 8849,
    mountainM: 3776, // 富士山
    towerM: 634, // 東京スカイツリー
    longRouteKm: 3000, // 日本列島縦断
    shortRouteKm: 500, // 東京〜大阪
    shortRouteRoundTrip: true,
  },
  elevationHuge: (t, m) => `この期間で登った高さはエベレスト${t}回分（${m}m）。もはや登山家`,
  elevationMountain: (t, m) => `この期間で富士山${t}個分（${m}m）を自力で登った`,
  elevationTower: (t, m) => `獲得標高はスカイツリー${t}本分（${m}m）`,
  distanceLong: (km, t) => `合計${km}km。日本列島を${t}回縦断できる距離`,
  distanceShort: (km, t) => `合計${km}km。東京〜大阪を${t}往復した計算`,
  distanceStart: (km) => `合計${km}km。ここから距離は積み上がっていく`,
  frequencyHigh: (d) => `週${d}日。ほぼ毎日乗っている、継続の鬼`,
  frequencyMid: (d) => `週${d}日。乗ることがしっかり習慣になっている`,
  frequencyLow: (d) => `週${d}日。乗りたい日に乗る、マイペースな楽しみ方`,
  avgDistanceLong: (km) => `1回平均${km}km。毎回がロングライド級`,
  avgDistanceMid: (km) => `1回平均${km}km。しっかり距離を乗るタイプ`,
  avgDistanceShort: (km) => `1回平均${km}km。短く濃く、サクッと乗るスタイル`,
  speedHigh: (v) => `平均${v}km/h。集団の先頭を引ける速さ`,
  speedMid: (v) => `平均${v}km/h。巡航力はかなり高い`,
  terrainSteep: (r) => `1kmあたり${r}m登っている。坂を探して走っているはず`,
  terrainHilly: (r) => `1kmあたり${r}m。坂を避けずに走っている`,
  terrainFlat: (r) => `1kmあたり${r}m。平坦路で気持ちよく巡航するのが好き`,
  powerHigh: (w) => `平均${w}W。踏める脚を持っている`,
  powerMid: (w) => `平均${w}W。パワーで走りを管理できている`,
  powerMeter: 'パワーメーターを付けると、診断の「出力」がもっと正確になる',
  indoorWithOutdoor: (n) => `ローラー週${n}本、外はたまに。部屋で鍛え上げた脚を、晴れた日に解き放つタイプ`,
  indoorOnly: (n) => `ローラー週${n}本。天気も信号も関係なく、部屋で黙々と積み上げる求道者`,
  indoorShare: (p) => `ライドの${p}%がローラー。室内トレが主戦場`,
  powerSprint: (t) => `最大パワーは平均の${t}倍。ゆったり走りつつ、ここぞで一気にもがくタイプ`,
  powerSteady: (vi) => `NP÷平均パワーが${vi}。パワーのブレが小さく、一定ペースで踏み続けられる`,
  powerInterval: (vi) => `NP÷平均パワーが${vi}。強弱をつけたメリハリのある走り（インターバル多め）`,
  ridesMany: (d, n) => `${d}日で${n}回のライド。積み上げた回数が強さになる`,
  ridesNone: 'この期間のライドはまだなし。次の1本から物語が始まる',
  strength: (a, s) => `いちばんの武器は${a}（${s}）`,
  growth: (a, s) => `伸びしろは${a}（${s}）。ここが伸びると別のキャラも見えてくる`,
  changeUp: (daysAgo, a, d) => `${daysAgo > 0 ? `${daysAgo}日前` : '前回'}から${a}が+${d}。走り込みの成果が出ている`,
  changeFlat: '前回からほぼ横ばい。安定して走れている証拠',
  changeDown: (a, d) => `${a}は${d}。最近のライドの傾向が変わったのかも`,
}
