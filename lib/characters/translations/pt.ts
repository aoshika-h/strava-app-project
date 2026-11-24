// キャラクターの文章のブラジル・ポルトガル語版（日本語の元は data.ts）。名前は全言語で共通の固有名詞にそろえ、肩書き・セリフ・説明を訳している
// ポルトガル語は名詞・形容詞に性があるので、男性版・女性版で肩書きの語尾（o / a）を変えている
import type { CharacterId, CharacterText } from '../types'

export const pt: Record<CharacterId, CharacterText> = {
  climber: {
    typeName: 'Escalador',
    tagline: 'Senhor das Montanhas',
    strengths: ['Subidas', 'Relação potência/peso', 'Esforços aeróbicos longos', 'Ataques em rampas duras'],
    tips: [
      'Aumente seu FTP com treinos intervalados para elevar ainda mais seu W/kg',
      'Desenvolva o VO2máx com tiros curtos na Zona 5',
      'Aprender a dosar o ritmo no plano vai te dar vantagem nas provas de montanha',
    ],
    variants: {
      male: {
        name: 'Alpinist Cross',
        title: 'Guardião da Serra',
        catchphrase: '"A subida é o meu palco."',
        specialMove: '⚔️ Ascensão Vertical',
        description:
          'Filho da montanha, seus olhos brilham quanto mais íngreme fica. Leve e com um VO2máx altíssimo, acelera em outro nível quando a estrada empina. Onde os rivais ficam sem ar, Cross sorri e aperta ainda mais.',
        lore: 'Cresceu correndo pelos morros e, quando viu, já dominava as serras de bike. Bordão: "Plano é chato."',
      },
      female: {
        name: 'Alpina Cross',
        title: 'Rainha dos Picos',
        catchphrase: '"Sinto que essa subida foi feita pra mim."',
        specialMove: '⚔️ Florada Vertical',
        description:
          'Uma deusa da montanha que sorri mais quanto mais íngreme fica. Leve e com um VO2máx impressionante, sobe com elegância as rampas onde todo mundo sofre. "Eu amo montanha" — essa paixão pura é sua maior arma.',
        lore: 'Conheceu as provas de subida no colégio e desabrochou. Bordão: "Cada topo me dá vontade de voltar."',
      },
    },
  },
  sprinter: {
    typeName: 'Velocista',
    tagline: 'O Raio Relâmpago',
    strengths: ['Sprint de chegada', 'Potência máxima', 'Disputas curtas no plano', 'Aceleração'],
    tips: [
      'Faça sprints de 10 a 30 segundos no máximo para melhorar a capacidade anaeróbica',
      'Recuperar rápido a frequência cardíaca depois do sprint também é treino',
      'Treine o posicionamento no pelotão para acertar o embalo final',
    ],
    variants: {
      male: {
        name: 'Flash Liner',
        title: 'O Caçador de Relâmpagos',
        catchphrase: '"Ninguém nunca viu minhas costas. Só minha roda."',
        specialMove: '⚔️ Explosão Final',
        description:
          'A explosão em forma de gente, que ganha vida nos últimos 200 m. Fica escondido no pelotão e, perto da linha, deixa todo mundo para trás com uma arrancada brutal. Nesse instante, o mundo gira em outra velocidade.',
        lore: 'Ex-velocista do atletismo que trocou a pista pela bike. Diz que, no sprint, "tudo fica em silêncio".',
      },
      female: {
        name: 'Flash Ray',
        title: 'A Deusa do Relâmpago',
        catchphrase: '"Os últimos 100 m são o meu palco."',
        specialMove: '⚔️ Chegada Relâmpago',
        description:
          'Espera quietinha no pelotão e explode faltando 100 m. Quando alguém percebe, ela já cruzou a linha. Essa arrancada é talento puro.',
        lore: 'Ex-velocista do atletismo cujo talento floresceu na bike. Diz que "o tempo para no momento da arrancada".',
      },
    },
  },
  tt: {
    typeName: 'Contrarrelogista',
    tagline: 'Resistência de Ferro',
    strengths: ['Velocidade de cruzeiro no plano', 'Sustentar potência de limiar', 'Controle de ritmo', 'Força mental'],
    tips: [
      'Faça o teste de FTP de 20 minutos com frequência para saber sua referência',
      'Intervalos longos no sweet spot (88–93% do FTP) funcionam muito bem',
      'Aumente a base aeróbica com mais quilometragem para fortalecer o motor',
    ],
    variants: {
      male: {
        name: 'Iron Chronos',
        title: 'O Cruzador de Aço',
        catchphrase: '"Vai. Tenta acompanhar meu ritmo."',
        specialMove: '⚔️ Cruzeiro Infinito',
        description:
          'Um motor sobre rodas que segura potência alta por horas. Pedalando sem expressão, é pura máquina. Vento, chuva ou vento contra — ele mói o asfalto sempre na mesma velocidade.',
        lore: 'Ex-engenheiro que treina com uma crença: "Com o ajuste certo, o corpo humano vira máquina."',
      },
      female: {
        name: 'Iron Eclipse',
        title: 'Rainha da Precisão',
        catchphrase: '"Emoção não precisa. Dados são meus únicos amigos."',
        specialMove: '⚔️ Sombra Crono',
        description:
          'Um computador sobre rodas que mantém a potência alta e estável. Sua pedalada sem expressão é linda e assustadora. Vento e subida, tudo é esmagado com watts calculados.',
        lore: 'Fez pós-graduação em exatas. O hobby dela é analisar arquivos do medidor de potência; o lema, "números acima de sentimentos".',
      },
    },
  },
  granfondo: {
    typeName: 'Gran Fondo',
    tagline: 'Até o Fim do Horizonte',
    strengths: ['Pedais ultralongos', 'Resistência o dia todo', 'Estratégia de alimentação', 'Força mental'],
    tips: [
      'Planeje com precisão quando e quanto comer durante o pedal',
      'Construa a base aeróbica com longões de 3 a 5 horas na Zona 2',
      'Cuide de sono, nutrição e recuperação juntos — isso é o mais importante',
    ],
    variants: {
      male: {
        name: 'Grande Explorer',
        title: 'Desbravador da Terra',
        catchphrase: '"Depois do horizonte, ainda tem estrada."',
        specialMove: '⚔️ Estrada Sem Fim',
        description:
          '"100 km é só o aquecimento" — e ele fala sério. Um ciclista de fôlego fora da curva, que fica mais forte quanto mais longo o pedal e ainda sorri pedalando no km 200. Uma lenda em construção.',
        lore: 'Já atravessou o país de ponta a ponta. Seu bordão "acho que ainda dá pra ir mais" deixa os amigos sem palavras.',
      },
      female: {
        name: 'Grande Sera',
        title: 'Viajante da Terra',
        catchphrase: '"Ainda dá. Só mais um pouco, só mais um pouquinho."',
        specialMove: '⚔️ Horizonte Sem Fim',
        description:
          'Os quilômetros dela não precisam de unidade — uma mensageira das longas distâncias com fôlego sem medida. Pedala centenas de km com um sorriso incansável, e sua roda vira a esperança do grupo.',
        lore: 'Ex-mochileira que se apaixonou pela bike. Seu lema: "A bicicleta é o melhor equipamento de viagem."',
      },
    },
  },
  allrounder: {
    typeName: 'Completo',
    tagline: 'O Herói Versátil',
    strengths: ['Equilíbrio', 'Adapta-se a qualquer percurso', 'Pilar da equipe', 'Desempenho constante'],
    tips: [
      'Desenvolva ainda mais seu ponto forte — de completo para o completo definitivo',
      'Varie terreno e distância a cada semana para manter o equilíbrio',
      'Escolha uma prova-alvo e monte um treino específico para ela',
    ],
    variants: {
      male: {
        name: 'Omni Rider',
        title: 'O Herói Versátil',
        catchphrase: '"Eu luto em qualquer terreno. Essa é minha força."',
        specialMove: '⚔️ Força Omni',
        description:
          'Subida ou plano, curto ou longo — esse herói sempre entrega. Sem um ponto fraco evidente, pode ser o pilar da equipe em qualquer situação. Um nível que só o verdadeiro talento completo alcança.',
        lore: 'Passou por vários esportes até se encontrar na bike. Acredita em "adaptação acima de especialização".',
      },
      female: {
        name: 'Omni Grace',
        title: 'A Heroína Versátil',
        catchphrase: '"Se adaptar é ser forte. Esse é o meu estilo."',
        specialMove: '⚔️ Graça Omni',
        description:
          'Uma ciclista completa de verdade, que anda em alto nível na subida e no plano, no curto e no longo. A vontade de "não deixar ponto fraco" é o que a faz vencer qualquer batalha.',
        lore: 'Atleta nata, com vários esportes no currículo. Brinca: "Difícil é achar algo que eu não consiga fazer."',
      },
    },
  },
  weekend: {
    typeName: 'Ciclista de Domingo',
    tagline: 'Espírito Livre do Fim de Semana',
    strengths: ['Amor puro pelo pedal', 'Pedalar pela cabeça leve', 'Vontade de continuar', 'Estilo livre'],
    tips: [
      'Primeiro, tente transformar 2 ou 3 pedais por semana em hábito',
      'Entrar em pedais em grupo aumenta sua distância naturalmente',
      'Inclua um pedal um pouco mais puxado por mês e você vai sentir a evolução',
    ],
    variants: {
      male: {
        name: 'Freedom Sunny',
        title: 'Livre como o Vento',
        catchphrase: '"Hoje eu viro vento. Só isso já basta."',
        specialMove: '⚔️ Pedal do Sol',
        description:
          'Paisagem acima do tempo, café acima do KOM — um ciclista rico na alegria simples de pedalar. Aproveita cada pedaço da liberdade do fim de semana, e o pedal em si é o objetivo. No fundo, talvez seja o jeito mais feliz de pedalar.',
        lore: 'Viciou na bike pedalando para aliviar o estresse do trabalho. A comida pós-pedal é a maior recompensa.',
      },
      female: {
        name: 'Freedom Soleil',
        title: 'Livre como o Vento',
        catchphrase: '"Com uma bike, todo dia fica um pouco especial."',
        specialMove: '⚔️ Pedal Feliz',
        description:
          'Café acima do tempo, foto acima do KOM — uma mestra em curtir a bike. Pedalar é o objetivo em si, e a energia positiva dela faz todo mundo sorrir.',
        lore: 'Uma amiga a chamou para um passeio tranquilo e ela se apaixonou pela bike. O docinho pós-pedal é sua maior alegria.',
      },
    },
  },
}
