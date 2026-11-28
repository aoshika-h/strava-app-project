// 画面に出る文言（ブラジルのポルトガル語）。形は ja.ts と同じ（Dictionary 型で型チェックされる）
// 呼びかけはブラジルで一般的な você。Strava のアプリ内表記（"Somente você" など）に合わせている

import type { Dictionary } from './ja'

export const pt: Dictionary = {
  htmlLang: 'pt-BR',
  ogLocale: 'pt_BR',
  langName: 'Português',
  numberLocale: 'pt-BR',
  meta: {
    title: 'VeloAva — Descubra seu personagem ciclista',
    ogTitle: 'VeloAva — Descubra seu personagem ciclista',
    description: 'O VeloAva analisa seus pedais no Strava e revela o seu avatar ciclista',
  },
  home: {
    badge: 'Análise de dados do Strava',
    titleLine1: 'Descubra seu',
    titleLine2: 'personagem ciclista',
    lead: 'O VeloAva analisa seus pedais no Strava e descobre qual dos 6 personagens combina com o seu jeito de pedalar — com base em potência, estilo, frequência e altimetria.',
    errors: {
      access_denied: 'A conexão com o Strava foi recusada. Tente de novo.',
      no_code: 'Não foi possível obter o código de autorização. Tente de novo.',
      analysis_failed: 'Ocorreu um erro ao analisar seus dados. Tente novamente mais tarde.',
      athlete_limit: 'O app atingiu o limite de usuários (999 atletas). No momento não está disponível.',
    } as Record<string, string>,
    trust: [
      'Seus dados de pedal nunca ficam salvos em nossos servidores',
      'Depois do diagnóstico, o VeloAva se desconecta do Strava automaticamente (dá para conferir em "Configurações → Meus aplicativos" no Strava)',
      'Somente leitura. Nada é publicado nem alterado. Atividades em "Somente você" só são lidas se você marcar a opção',
    ],
    readPrivacy: 'Ler a política de privacidade',
    typesTitle: '6 tipos de ciclista',
    howTitle: 'Como funciona',
    how: [
      { title: 'Conecte o Strava', desc: 'Conecte sua conta do Strava com um clique, usando OAuth seguro.' },
      { title: 'Análise dos pedais', desc: 'Seus pedais do período escolhido (3 meses, 6 meses ou 1 ano) — distância, altimetria, velocidade e potência — são analisados automaticamente.' },
      { title: 'Conheça seu personagem', desc: 'Seu jeito de pedalar é comparado com 6 personagens ciclistas.' },
    ],
    changelogTitle: 'Novidades',
    showAll: (n: number) => `Ver tudo (${n})`,
    footerNote: 'Os dados do Strava são usados só para a análise — nunca salvos nem compartilhados',
    privacy: 'Política de privacidade',
  },
  starter: {
    step1: '① Qual tipo você acha que é?',
    unknown: 'Não sei / pular o palpite',
    step2: '② Escolha o período e comece!',
    yourGuess: 'Seu palpite: ',
    includePrivate: 'Incluir pedais em "Somente você"',
    includePrivateNote: 'Para quem deixa os treinos no rolo como privados. O Strava também vai pedir permissão para ler suas atividades privadas',
  },
  periods: { '90': '3 meses', '180': '6 meses', '365': '1 ano' } as Record<string, string>,
  loading: {
    title: 'Conectando ao Strava',
    body1: 'Levando você para a página de autorização',
    body2: 'Aguarde um instante',
    period: 'Período: ',
  },
  result: {
    preview: '⚡ PREVIEW MODE — exibição de teste',
    totalDistance: 'Distância total',
    avgDistance: 'Distância média',
    avgSpeed: 'Velocidade média',
    totalElevation: 'Altimetria total',
    climbingRatio: 'Taxa de subida',
    ridingDays: 'Dias pedalando',
    avgPower: 'Potência média',
    indoorTag: ' (indoor)',
    outdoorTag: ' (na rua)',
    daysPerWeek: (n: string) => `${n} dias/semana`,
    retry: '← Fazer de novo',
    errorMissing: 'Nenhum resultado encontrado',
    errorInvalid: 'Não foi possível carregar os dados',
    backToTop: 'Voltar ao início',
    tryAgain: 'Fazer de novo',
  },
  evolution: {
    evolved: 'Evoluiu!',
    keeping: (name: string) => `Continua ${name}`,
    period: (days: number) => (days >= 365 ? '1 ano' : `${Math.round(days / 30)} meses`),
    previous: (period: string, date: string) => `Diagnóstico anterior (${period}): ${date}`,
  },
  reveal: {
    yourGuess: 'Seu palpite',
    result: 'Resultado',
    hit: 'Na mosca! Você conhece bem o seu pedal',
    miss: 'Um lado surpreendente — foi isso que seus dados mostraram',
  },
  share: {
    postBeforeLogo: 'Postar no',
    postAfterLogo: '',
    saving: '⏳ Processando...',
    saveMobile: '📲 Salvar / Compartilhar',
    saveDesktop: '💾 Baixar imagem',
    shareTitle: 'VeloAva — personagem ciclista',
    postText: (name: string, title: string) =>
      `O VeloAva disse que meu tipo de ciclista é "${name}" (${title})!\nE o seu, qual é?\n#VeloAva #ciclismo #pedal`,
    postTextHit: (name: string, title: string) =>
      `O VeloAva disse que meu tipo de ciclista é "${name}" (${title}) — bem como eu imaginava!\nE o seu, qual é?\n#VeloAva #ciclismo #pedal`,
    postTextMiss: (predicted: string, name: string, title: string) =>
      `Eu jurava que era do tipo ${predicted}, mas o VeloAva disse que sou "${name}" (${title})!\nE o seu, qual é?\n#VeloAva #ciclismo #pedal`,
  },
  sharePage: {
    metaTitle: (name: string) => `Meu tipo de ciclista é "${name}" — VeloAva`,
    metaDescription: 'Descubra qual dos 6 personagens ciclistas combina com seus pedais no Strava.',
    cta: 'Descubra o seu →',
    note: 'Conecte o Strava — resultado em 30 segundos',
    seoTitle: (name: string, title: string, typeName: string) => `${name} (${title}) | Perfil ${typeName} — VeloAva, diagnóstico de ciclista`,
    featuresTitle: (typeName: string) => `Como é o perfil ${typeName}`,
    strengthsTitle: 'Pontos fortes',
    loreTitle: 'História',
    otherVariantTitle: (sexLabel: string) => `A versão ${sexLabel}`,
    sexLabel: { male: 'masculina', female: 'feminina' } as Record<string, string>,
    otherTypesTitle: 'Outros tipos',
    indexLink: 'Ver os 12 personagens →',
    trustTitle: 'Por que é seguro testar',
  },
  og: {
    alt: 'VeloAva — Diagnóstico de personagem ciclista',
    lead: 'Meu tipo de ciclista é',
    cta: 'E o seu, qual é?',
  },
  typesIndex: {
    metaTitle: 'Guia de tipos de ciclista (12 personagens) — VeloAva',
    metaDescription: 'Escalador, Velocista, Contrarrelogista, Gran Fondo, Completo, Ciclista de Domingo. Conheça os 6 tipos e 12 personagens que você pode tirar com seus pedais do Strava.',
    title: 'Guia de tipos de ciclista',
    lead: '6 tipos × versões masculina e feminina: 12 personagens. Qual é você?',
    cta: 'Descobrir meu tipo →',
  },
  notFound: {
    title: 'Página não encontrada',
    body: 'O endereço pode estar errado, ou a página pode ter mudado de lugar.',
    backTop: 'Voltar ao início e fazer o diagnóstico',
  },
  privacy: {
    metaTitle: 'Política de Privacidade — VeloAva',
    title: 'Política de Privacidade',
    updated: 'Última atualização: novembro de 2026',
    backTop: '← Início do VeloAva',
    backBottom: '← Voltar ao início',
  },
  axes: { climbing: 'Subida', speed: 'Velocidade', endurance: 'Resistência', power: 'Potência', consistency: 'Constância' },
  // 日付の表示（ブラジルは 日/月/年）
  formatDate: (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  },
  formatShortDate: (ymd: string) => {
    const [, m, d] = ymd.split('-')
    return `${d}/${m}`
  },
}
