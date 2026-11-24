// 一言コメントのポルトガル語（ブラジル）の文章。ブラジルの人に身近な山・名所・区間で例える
// 山: ピコ・ダ・バンデイラ（2,892m。ブラジル南東部の有名な高峰）、名所: ポン・ジ・アスーカル（396m。リオの奇岩）
// 長い区間: 「オイアポッキからシュイまで」（ブラジルの最北端〜最南端の慣用句。南北の幅は約4,394km）
// 都市間: リオ〜サンパウロ（道路で約430km。日本の東京〜大阪と同じく往復で数える）
import type { InsightMessages } from './types'

export const pt: InsightMessages = {
  numberLocale: 'pt-BR',
  analogs: {
    hugeMountainM: 8849, // Everest
    mountainM: 2892, // Pico da Bandeira
    towerM: 396, // Pão de Açúcar
    longRouteKm: 4394, // do Oiapoque ao Chuí（ブラジルの南北の幅として一般に知られる値）
    shortRouteKm: 430, // Rio–São Paulo（片道）
    shortRouteRoundTrip: true,
  },
  elevationHuge: (t, m) => `Você subiu o equivalente a ${t} Everests (${m} m). Já é alpinista`,
  elevationMountain: (t, m) => `Você subiu ${t} Picos da Bandeira (${m} m) só na força das pernas`,
  elevationTower: (t, m) => `Altimetria acumulada: ${t} Pães de Açúcar (${m} m)`,
  distanceLong: (km, t) => `${km} km no total. Dá pra ir do Oiapoque ao Chuí ${t} vezes`,
  distanceShort: (km, t) => `${km} km no total. Equivale a ${t} idas e voltas Rio–São Paulo`,
  distanceStart: (km) => `${km} km no total. Daqui pra frente é só acumular`,
  frequencyHigh: (d) => `${d} dias por semana. Pedala quase todo dia — máquina de constância`,
  frequencyMid: (d) => `${d} dias por semana. Pedalar já virou hábito`,
  frequencyLow: (d) => `${d} dias por semana. Pedala quando dá vontade, no seu ritmo`,
  avgDistanceLong: (km) => `Média de ${km} km por pedal. Todo pedal é um longão`,
  avgDistanceMid: (km) => `Média de ${km} km por pedal. Você gosta de rodar bastante`,
  avgDistanceShort: (km) => `Média de ${km} km por pedal. Curto, intenso e direto ao ponto`,
  speedHigh: (v) => `Média de ${v} km/h. Rápido o bastante pra puxar o pelotão`,
  speedMid: (v) => `Média de ${v} km/h. Ritmo de cruzeiro de respeito`,
  terrainSteep: (r) => `${r} m de subida por km. Você sai procurando ladeira, né?`,
  terrainHilly: (r) => `${r} m de subida por km. Subida não te assusta`,
  terrainFlat: (r) => `${r} m de subida por km. Seu negócio é rodar forte no plano`,
  powerHigh: (w) => `Média de ${w} W. Essas pernas empurram`,
  powerMid: (w) => `Média de ${w} W. Você pedala guiado pelos números`,
  powerMeter: 'Com um medidor de potência, a nota de "Potência" fica bem mais precisa',
  indoorWithOutdoor: (n) => `${n} treinos no rolo por semana e rua de vez em quando. Pernas forjadas em casa, soltas nos dias de sol`,
  indoorOnly: (n) => `${n} treinos no rolo por semana. Sem chuva, sem semáforo — só trabalho silencioso e constante`,
  indoorShare: (p) => `${p}% dos seus pedais são no rolo. O treino indoor é o seu território`,
  powerSprint: (t) => `Potência máxima ${t}× a média. Pedala tranquilo e explode na hora certa`,
  powerSteady: (vi) => `NP ÷ potência média: ${vi}. Potência estável — segura o ritmo por horas`,
  powerInterval: (vi) => `NP ÷ potência média: ${vi}. Pedal cheio de variações (muitos intervalados)`,
  ridesMany: (d, n) => `${n} pedais em ${d} dias. Cada pedal somado vira força`,
  ridesNone: 'Nenhum pedal neste período ainda. A história começa no próximo',
  strength: (a, s) => `Sua maior arma: ${a} (${s})`,
  growth: (a, s) => `Pra evoluir: ${a} (${s}). Melhorando isso, outro personagem pode aparecer`,
  changeUp: (daysAgo, a, d) => `${a} +${d} ${daysAgo > 0 ? `desde ${daysAgo} dias atrás` : 'desde a última vez'}. O treino está dando resultado`,
  changeFlat: 'Quase igual à última vez. Sinal de que você pedala com constância',
  changeDown: (a, d) => `${a} ${d}. Talvez seu jeito de pedalar tenha mudado ultimamente`,
}
