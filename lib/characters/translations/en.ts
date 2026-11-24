// キャラクターの文章の英語版（日本語の元は data.ts）。名前は全言語で共通の固有名詞にそろえ、肩書き・セリフ・説明を訳している
// 型 Record<CharacterId, CharacterText> なので、6キャラ・男女どちらかの書き忘れはビルドで分かる
import type { CharacterId, CharacterText } from '../types'

export const en: Record<CharacterId, CharacterText> = {
  climber: {
    typeName: 'Climber',
    tagline: 'Ruler of the Mountains',
    strengths: ['Hill climbs', 'Power-to-weight ratio', 'Long aerobic efforts', 'Attacks on steep ramps'],
    tips: [
      'Raise your FTP with interval training to push your W/kg even higher',
      'Build VO2max with short intervals at Zone 5 intensity',
      'Learning to pace on the flats will give you an edge in mountain races',
    ],
    variants: {
      male: {
        name: 'Alpinist Cross',
        title: 'Guardian of the Pass',
        catchphrase: '"The climb is my stage."',
        specialMove: '⚔️ Vertical Rising',
        description:
          'A child of the mountains whose eyes light up as the gradient gets steeper. Light build and a huge VO2max let him accelerate on another level when the road kicks up. Where rivals gasp for air, Cross smiles and pushes harder.',
        lore: 'Grew up running around the hills and one day found himself conquering passes by bike. Favorite line: "Flat roads are boring."',
      },
      female: {
        name: 'Alpina Cross',
        title: 'Queen of the Peaks',
        catchphrase: '"I feel like this climb was made for me."',
        specialMove: '⚔️ Vertical Bloom',
        description:
          'A mountain goddess who smiles more the steeper it gets. With a light frame and astonishing VO2max, she glides up the walls where everyone else is suffering. "I just love the mountains" — that pure joy is her greatest weapon.',
        lore: 'Discovered hill-climb races in high school and blossomed. Favorite line: "Every summit makes me want to come back."',
      },
    },
  },
  sprinter: {
    typeName: 'Sprinter',
    tagline: 'Lightning in a Flash',
    strengths: ['Finish-line sprints', 'Peak power', 'Short battles on the flats', 'Acceleration'],
    tips: [
      'Do all-out 10–30 second sprints to build your anaerobic capacity',
      'Recovering your heart rate quickly after a sprint is training too',
      'Practice positioning in group rides to nail the final lead-out',
    ],
    variants: {
      male: {
        name: 'Flash Liner',
        title: 'The Lightning Chaser',
        catchphrase: '"Nobody has ever seen my back. Only my wheel."',
        specialMove: '⚔️ Final Burst',
        description:
          'Explosive power in human form, coming alive in the last 200 m. He hides in the bunch, then leaves everyone behind with one violent burst before the line. For that moment, the world moves at a different speed.',
        lore: 'A former track sprinter who switched to bikes. Says that during a sprint, "everything goes silent."',
      },
      female: {
        name: 'Flash Ray',
        title: 'Goddess of Lightning',
        catchphrase: '"The last 100 m — that\'s my stage."',
        specialMove: '⚔️ Lightning Finish',
        description:
          'She waits quietly in the bunch, then explodes with 100 m to go. By the time anyone notices, she has already crossed the line. That kick is pure natural talent.',
        lore: 'A former track sprinter whose talent bloomed once she found cycling. Says "time stops the moment I accelerate."',
      },
    },
  },
  tt: {
    typeName: 'Time Trialist',
    tagline: 'Iron Endurance',
    strengths: ['Fast cruising on the flats', 'Holding threshold power', 'Pace control', 'Mental strength'],
    tips: [
      'Do a 20-minute FTP test regularly to know your baseline',
      'Long intervals at sweet spot (88–93% of FTP) work wonders',
      'Add more aerobic base miles to build a stronger engine',
    ],
    variants: {
      male: {
        name: 'Iron Chronos',
        title: 'The Steel Cruiser',
        catchphrase: '"Go on. Try to match my pace."',
        specialMove: '⚔️ Infinite Cruise',
        description:
          'A rolling engine that can hold high power for hours. Pedaling with a blank face, he is pure machine. Wind, rain or headwind — he grinds the road down at the same relentless speed.',
        lore: 'A former engineer who trains by one belief: "With the right tuning, the human body can become a machine."',
      },
      female: {
        name: 'Iron Eclipse',
        title: 'Queen of Precision',
        catchphrase: '"No emotions needed. Data is my only friend."',
        specialMove: '⚔️ Chrono Shadow',
        description:
          'A riding computer that holds high power perfectly steady. Her expressionless pedaling is both beautiful and terrifying. Wind and hills alike are crushed with calculated watts.',
        lore: 'Holds a science graduate degree. Her hobby is staring at power-meter files, and her creed is "numbers over feelings."',
      },
    },
  },
  granfondo: {
    typeName: 'Gran Fondo',
    tagline: 'To the Edge of the Horizon',
    strengths: ['Ultra-long rides', 'All-day endurance', 'Fueling strategy', 'Mental toughness'],
    tips: [
      'Plan the timing and amount of fueling during your rides precisely',
      'Build your aerobic base with 3–5 hour Zone 2 long rides',
      'Manage sleep, nutrition and recovery as one — that matters most',
    ],
    variants: {
      male: {
        name: 'Grande Explorer',
        title: 'Pioneer of the Land',
        catchphrase: '"Beyond the horizon, there\'s still more road."',
        specialMove: '⚔️ Endless Road',
        description:
          '"100 km is just the warm-up" — and he means it. A rider of off-the-charts stamina who only gets stronger the longer it goes, still smiling and pedaling at the 200 km mark. A legend in the making.',
        lore: 'Once rode the entire length of his country. His catchphrase "I feel like I could keep going" leaves his friends speechless.',
      },
      female: {
        name: 'Grande Sera',
        title: 'Wanderer of the Land',
        catchphrase: '"I can keep going. Just a little more, a little more."',
        specialMove: '⚔️ Endless Horizon',
        description:
          'Her distances need no units — a long-distance messenger with stamina beyond measure. She rides hundreds of kilometers with a tireless smile, and her back wheel becomes her friends\' hope.',
        lore: 'A former backpacker who fell in love with cycling. Her motto: "The bike is the ultimate travel gear."',
      },
    },
  },
  allrounder: {
    typeName: 'All-Rounder',
    tagline: 'The Versatile Hero',
    strengths: ['Well-balanced', 'Adapts to any course', 'Backbone of the team', 'Consistent performance'],
    tips: [
      'Push your strongest area further — go from all-rounder to the ultimate all-rounder',
      'Mix in rides with different terrain and distances each week to stay balanced',
      'Pick a target race and build specific training toward it',
    ],
    variants: {
      male: {
        name: 'Omni Rider',
        title: 'The Versatile Hero',
        catchphrase: '"I can fight anywhere. That\'s my strength."',
        specialMove: '⚔️ Omni Force',
        description:
          'Climbs or flats, short or long — this hero always delivers. No obvious weakness means he can be the pillar of any team in any situation. A level only true all-round talent reaches.',
        lore: 'Tried many sports before settling on cycling. Believes in "adaptability over specialization."',
      },
      female: {
        name: 'Omni Grace',
        title: 'The Versatile Heroine',
        catchphrase: '"Adapting is strength. That\'s my style."',
        specialMove: '⚔️ Omni Grace',
        description:
          'A true all-rounder who rides at a high level on climbs and flats, short and long. Her will to "leave no weakness" is what lets her win every kind of battle.',
        lore: 'A natural athlete with many sports behind her. Laughs: "It\'s harder to find something I can\'t do."',
      },
    },
  },
  weekend: {
    typeName: 'Sunday Rider',
    tagline: 'Free Spirit of the Weekend',
    strengths: ['Pure love of riding', 'Riding for a happy mind', 'Will to keep going', 'Free style'],
    tips: [
      'First, try making 2–3 rides a week a habit',
      'Joining group rides will naturally stretch your distance',
      'Add one slightly harder ride a month and you\'ll feel yourself improving',
    ],
    variants: {
      male: {
        name: 'Freedom Sunny',
        title: 'Free as the Wind',
        catchphrase: '"Becoming the wind today. That\'s all I need."',
        specialMove: '⚔️ Sunshine Ride',
        description:
          'Views over times, coffee over KOMs — a rider rich in the simple joy of cycling. He savors every bit of weekend freedom, and the ride itself is the goal. Honestly, that might be the happiest way to ride.',
        lore: 'Got hooked on cycling while riding off work stress. The post-ride meal is his biggest reward.',
      },
      female: {
        name: 'Freedom Soleil',
        title: 'Free as the Wind',
        catchphrase: '"With a bike, every day is a little special."',
        specialMove: '⚔️ Happy Ride',
        description:
          'Cafés over times, photo spots over KOMs — a master of enjoying the bike. Riding is the goal itself, and her positive energy makes everyone around her smile.',
        lore: 'A friend invited her on an easy cruise and she fell for cycling. Post-ride sweets are her greatest joy.',
      },
    },
  },
}
