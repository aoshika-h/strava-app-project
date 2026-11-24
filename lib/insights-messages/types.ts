// 一言コメントの言語ごとの文章と「身近な例え」の型
// 判定ルール（どの数値で、どのコメントを、どの重みで出すか）は lib/insights.ts で全言語共通。
// ここで言語ごとに変えるのは、文章と、獲得標高・距離を例える身近な山や区間（日本なら富士山・東京〜大阪、ブラジルならコルコバード・リオ〜サンパウロ）
// 数値は呼び出し側でその言語の書式（桁区切りなど）に整えた文字列で渡す

export interface InsightMessages {
  // 数値の書式（Intl の言語タグ。例: 'ja-JP'）
  numberLocale: string
  // 例えに使う山・建物・区間（メートル・キロ）。名前は下の文章関数の中に書く
  analogs: {
    hugeMountainM: number // 世界一の山（エベレスト 8849m）。これの3倍以上登った人に出す
    mountainM: number // その国で一番身近な山
    towerM: number // その国で身近な高い建物・丘
    longRouteKm: number // 国を縦断するような長い区間
    shortRouteKm: number // 有名な都市間（片道）
    shortRouteRoundTrip: boolean // true なら「往復」で数える
  }
  elevationHuge: (times: string, meters: string) => string
  elevationMountain: (times: string, meters: string) => string
  elevationTower: (times: string, meters: string) => string
  distanceLong: (km: string, times: string) => string
  distanceShort: (km: string, times: string) => string
  distanceStart: (km: string) => string
  frequencyHigh: (days: string) => string
  frequencyMid: (days: string) => string
  frequencyLow: (days: string) => string
  avgDistanceLong: (km: string) => string
  avgDistanceMid: (km: string) => string
  avgDistanceShort: (km: string) => string
  speedHigh: (kmh: string) => string
  speedMid: (kmh: string) => string
  terrainSteep: (mPerKm: string) => string
  terrainHilly: (mPerKm: string) => string
  terrainFlat: (mPerKm: string) => string
  powerHigh: (watts: string) => string
  powerMid: (watts: string) => string
  powerMeter: string
  indoorWithOutdoor: (perWeek: string) => string
  indoorOnly: (perWeek: string) => string
  indoorShare: (percent: string) => string
  powerSprint: (times: string) => string
  powerSteady: (vi: string) => string
  powerInterval: (vi: string) => string
  ridesMany: (days: string, rides: string) => string
  ridesNone: string
  strength: (axis: string, score: string) => string
  growth: (axis: string, score: string) => string
  // 前回との比較。daysAgo が 0 のときは「前回から」
  changeUp: (daysAgo: number, axis: string, diff: string) => string
  changeFlat: string
  changeDown: (axis: string, diff: string) => string
}
