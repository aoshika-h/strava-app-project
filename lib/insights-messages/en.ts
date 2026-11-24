// 一言コメントの英語の文章。英語圏は国がばらばらなので、どの国のサイクリストにも通じる「自転車の聖地・名所」で例える
// 山: モン・ヴァントゥ（1,910m。ツール・ド・フランスの名物の峠）、建物: エッフェル塔（330m）
// 長い区間: ツール・ド・フランス1大会ぶん（約3,400km）、都市間: パリ〜ルーベ（約260km。片道で数える）
import type { InsightMessages } from './types'

export const en: InsightMessages = {
  numberLocale: 'en-US',
  analogs: {
    hugeMountainM: 8849, // Everest
    mountainM: 1910, // Mont Ventoux
    towerM: 330, // Eiffel Tower
    longRouteKm: 3400, // a full Tour de France
    shortRouteKm: 260, // Paris–Roubaix
    shortRouteRoundTrip: false,
  },
  elevationHuge: (t, m) => `You climbed Everest ${t} times over (${m} m). Basically a mountaineer now`,
  elevationMountain: (t, m) => `${t} Mont Ventoux climbs (${m} m), all under your own power`,
  elevationTower: (t, m) => `Elevation gain: ${t} Eiffel Towers stacked up (${m} m)`,
  distanceLong: (km, t) => `${km} km total. That's ${t} full Tours de France`,
  distanceShort: (km, t) => `${km} km total. Paris–Roubaix ${t} times — minus the cobbles`,
  distanceStart: (km) => `${km} km total. The kilometers start stacking up from here`,
  frequencyHigh: (d) => `${d} days a week. Riding almost daily — a consistency machine`,
  frequencyMid: (d) => `${d} days a week. Riding is a solid habit for you`,
  frequencyLow: (d) => `${d} days a week. You ride when you feel like it — your own pace`,
  avgDistanceLong: (km) => `${km} km per ride. Every ride is a long ride`,
  avgDistanceMid: (km) => `${km} km per ride. You like to put in real distance`,
  avgDistanceShort: (km) => `${km} km per ride. Short, sharp and to the point`,
  speedHigh: (v) => `${v} km/h average. Fast enough to pull the front of the group`,
  speedMid: (v) => `${v} km/h average. Seriously strong cruising speed`,
  terrainSteep: (r) => `${r} m of climbing per km. You go looking for hills, don't you?`,
  terrainHilly: (r) => `${r} m of climbing per km. Hills don't scare you off`,
  terrainFlat: (r) => `${r} m of climbing per km. Happiest cruising on the flats`,
  powerHigh: (w) => `${w} W average. Those legs can push`,
  powerMid: (w) => `${w} W average. You ride by the numbers`,
  powerMeter: 'Add a power meter and your "Power" score gets a lot more accurate',
  indoorWithOutdoor: (n) => `${n} trainer rides a week, outside now and then. Legs forged indoors, unleashed on sunny days`,
  indoorOnly: (n) => `${n} trainer rides a week. No weather, no traffic lights — just quiet, relentless work`,
  indoorShare: (p) => `${p}% of your rides are on the trainer. Indoors is your home turf`,
  powerSprint: (t) => `Peak power is ${t}× your average. Cruise easy, then go all-out when it counts`,
  powerSteady: (vi) => `NP ÷ avg power: ${vi}. Smooth, steady power — you can hold a pace forever`,
  powerInterval: (vi) => `NP ÷ avg power: ${vi}. Punchy, on-off riding (lots of intervals)`,
  ridesMany: (d, n) => `${n} rides in ${d} days. All those rides add up to strength`,
  ridesNone: 'No rides in this period yet. The story starts with your next one',
  strength: (a, s) => `Your biggest weapon: ${a} (${s})`,
  growth: (a, s) => `Room to grow: ${a} (${s}). Level it up and a new character might appear`,
  changeUp: (daysAgo, a, d) => `${a} +${d} ${daysAgo > 0 ? `since ${daysAgo} days ago` : 'since last time'}. The training is paying off`,
  changeFlat: 'Almost unchanged since last time. Proof of steady riding',
  changeDown: (a, d) => `${a} ${d}. Maybe your riding has shifted lately`,
}
