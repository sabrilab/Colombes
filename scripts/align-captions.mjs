/**
 * Cale les sous-titres sur ce que la voix off dit vraiment.
 *
 * La première version datait les lignes à la main : deux phrases manquaient et
 * les autres dérivaient de plus d'une seconde. Ici on mesure le fichier — on
 * découpe l'onde en salves de parole, puis on répartit le texte au prorata des
 * caractères prononcés sur le temps de parole effectif, les silences exclus. Une
 * ligne ne peut donc plus tomber dans un blanc, et son début est recalé sur la
 * salve la plus proche.
 *
 * Quand le fichier n'est pas encore là, on estime au lieu de renoncer : la durée
 * de la synthèse est connue dès la commande, et la même répartition au prorata des
 * caractères donne un calage à quelques dixièmes près. Un film livré avec des
 * sous-titres approchés vaut mieux qu'un film livré sans, et le jour où l'onde
 * arrive, la mesure les remplace sans qu'on touche à rien.
 *
 *     node scripts/align-captions.mjs
 *
 * Écrit un `captions*.json` par film (lu par le montage) et le `.srt` livré à part.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const FPS = 30

/**
 * Le texte exact envoyé à la synthèse, découpé en lignes d'affichage.
 *
 * `spoken` sert au calage — la synthèse a lu « two euros », pas « €2 » — et
 * `text` est ce qu'on incruste. Sans cette distinction, un symbole compté pour
 * un caractère décalerait tout ce qui suit.
 */
const FILM70 = [
  { text: 'You built an app.' },
  { text: "Somebody, someday, will ask what it's worth." },
  { text: 'Most calculators hand you a number.' },
  { text: 'And keep the reasoning to themselves.' },
  { text: 'So here is the reasoning.' },
  { text: 'Your revenue is a surface.' },
  { text: 'Price on one side, customers on the other.' },
  { text: 'Double either one, and you double the area.' },
  { text: 'But only one of them is free.' },
  { text: 'So where does that put you?' },
  {
    text: 'On the pricing ladder, Spotify is a mouse: €2 a month per user.',
    spoken: 'On the pricing ladder, Spotify is a mouse: two euros a month per user.',
  },
  { text: 'Shopify is a deer, at €75.', spoken: 'Shopify is a deer, at seventy five.' },
  { text: 'Salesforce is a whale.' },
  { text: 'Your price per customer decides your trade.' },
  { text: 'Who sells, who onboards, how many customers you will ever need.' },
  { text: 'But growing is not enough.' },
  { text: 'Direct costs, acquisition, fixed costs: each one takes its share.' },
  { text: 'What a buyer pays for is what remains at the bottom.' },
  { text: 'No profit, no multiple.' },
  { text: 'Then nine lines build that multiple.' },
  { text: 'Churn. Growth. Retention. Client concentration.' },
  { text: 'And how much of the company walks out of the door with you.' },
  { text: 'Every one of them, named.' },
  { text: 'Colombes. Free. No sign-up.', spoken: 'Colombes. Free. No sign up.' },
]

/** Le texte de la version rapide, envoyé à la même voix. */
const BUILT = [
  { text: 'Something just changed.' },
  { text: 'Claude writes the code now.' },
  { text: 'So anyone can ship it.' },
  { text: "Mobile, desktop, headset: it's all an app, sold by subscription." },
  { text: 'And everyone is shipping.' },
  { text: 'But shipping was the easy part.' },
  { text: "The hard question is what it's worth." },
  { text: 'Every calculator hands you a number, and keeps the reasoning.' },
  { text: 'So here is the reasoning.' },
  { text: 'You drag one dove across a plate, and a valuation happens.' },
  { text: 'Your revenue is a surface: price on one side, customers on the other.' },
  { text: 'Where that puts you has a name.' },
  {
    text: 'On the pricing ladder, Spotify is a mouse, at €2 a month.',
    spoken: 'On the pricing ladder, Spotify is a mouse, at two euros a month.',
  },
  { text: 'Salesforce is a whale.' },
  { text: 'Everyone sits somewhere.' },
  { text: 'Your price per customer decides your trade.' },
  { text: 'Then direct costs, acquisition and fixed costs each take their share.' },
  { text: 'And nine lines build the multiple on what remains.' },
  { text: 'Building it was never the hard part.' },
  { text: "Knowing what it's worth is." },
  { text: 'Colombes. Free. No sign-up.', spoken: 'Colombes. Free. No sign up.' },
]

/** Le texte du film des deux leviers. */
const LEVERS = [
  { text: 'You have a thousand customers, paying you €10 a month.', spoken: 'You have a thousand customers, paying you ten euros a month.' },
  { text: '€10,000.', spoken: 'Ten thousand euros.' },
  { text: 'And the first thing you think is: I need more customers.' },
  { text: 'That is the instinct.' },
  { text: 'And it is the expensive one.' },
  { text: 'Because revenue is not a line. It is a surface.' },
  { text: 'Price on one side, customers on the other,' },
  { text: 'and your money is the area between them.' },
  { text: 'Double the customers, and you double the area.' },
  { text: 'Double the price, and you double it too.' },
  { text: 'Exactly the same money. Two completely different companies.' },
  { text: 'Ten thousand customers means ten thousand people to find,' },
  { text: 'to convince, to onboard, and to keep.' },
  { text: 'At €180 to acquire each one,', spoken: 'At a hundred and eighty euros to acquire each one,' },
  { text: 'that is €1,800,000,', spoken: 'that is one million eight hundred thousand euros,' },
  { text: 'spent before a single one of them pays you back.' },
  { text: 'Doubling your price takes one afternoon. It costs nothing at all.' },
  { text: 'Some of them will leave, and even then, the arithmetic is not close.' },
  { text: 'One lever is free.' },
  { text: 'The other one is your whole company.' },
  { text: 'Most founders pull the expensive one first, because it looks like work.' },
  { text: 'Hiring looks like work. Advertising looks like work.' },
  { text: 'Changing a number on a pricing page does not.' },
  { text: 'Colombes puts both levers on the same plate.' },
  { text: 'You drag one dove, and you watch the surface change.' },
  { text: 'Then you decide which one you are actually pulling.' },
  { text: 'Free. No sign-up.', spoken: 'Free. No sign up.' },
]

/**
 * Le texte du film des règles empiriques.
 *
 * Le registre change, et c'est délibéré : les autres films expliquent une
 * mécanique, celui-ci s'adresse à quelqu'un. Le sujet de chaque phrase est le
 * spectateur — « tu », jamais « on » — parce que ce qui intéresse le plus une
 * personne reste elle-même. Le silence devant la question n'est pas présenté
 * comme une faute mais comme une information qu'on ne lui a jamais donnée, et
 * l'adversaire du film n'est pas l'acheteur : c'est le mystère entretenu autour
 * du chiffre.
 *
 * Les six règles ne sont pas inventées pour le film : ce sont les seuils de
 * `src/lib/engine/benchmarks.ts`, ceux que l'app applique déjà. Un film qui
 * annoncerait d'autres chiffres que le simulateur serait une publicité, pas une
 * démonstration.
 */
const HEURISTICS = [
  { text: 'You built something. And every month, people pay you for it.' },
  { text: "Then somebody asks what it's worth, and you go quiet." },
  { text: 'That silence is not a gap in you.' },
  { text: 'Nobody ever told you the honest part: nobody computes that number.' },
  { text: 'They estimate it, with rules of thumb.' },
  { text: 'There are six. And you can have all six, right now.' },
  { text: 'Churn under 3% a month.', spoken: 'Churn under three percent a month.' },
  { text: 'Revenue that grows inside the customers you already have.' },
  { text: 'A customer worth three times what they cost to win.' },
  { text: 'That cost paid back inside twelve months.' },
  { text: '80% gross margin.', spoken: 'Eighty percent gross margin.' },
  { text: 'And growth plus margin above forty.' },
  { text: 'Same revenue, six rules held instead of missed, and it is worth more than twice as much.' },
  { text: 'You were told to just go and get more users. You suspected that was lazy advice.' },
  { text: 'You were right. Nobody is counting your users. They are reading whether they stay.' },
  { text: 'So the fear of being found out, in a room full of spreadsheets, has it backwards.' },
  { text: 'It was never a test you fail. It is a map.' },
  { text: 'And you are the only one who has ever stood on the terrain.' },
  { text: 'Colombes puts all six in your hands. Move one, and watch your number move.' },
  { text: 'Your app is worth something today. Go and find out what.' },
  { text: 'Free. No sign-up.', spoken: 'Free. No sign up.' },
]

/**
 * Le texte du film de présentation, le seul en 16/9.
 *
 * Il ne démontre pas une idée : il montre le produit et demande une inscription.
 * D'où un texte plus court et plus plat que les autres — chaque réplique nomme
 * ce qui est à l'écran au même instant, et rien de plus. Sur un film de produit,
 * une phrase qui brille pendant qu'on regarde une interface fait perdre les deux.
 */
const PRODUCT = [
  { text: 'You built an app. People pay for it every month, and it is worth something today.' },
  { text: 'You just have no way of knowing what.' },
  { text: 'Every calculator online hands you one number and keeps the reasoning to itself.' },
  { text: 'Colombes gives you the reasoning.' },
  { text: 'Set a price, set a customer count, and you have a first estimate.' },
  { text: 'You get a valuation, the range around it, and the multiple that produced it.' },
  { text: 'Then the levers that actually move it: pricing, churn, acquisition.' },
  { text: 'Move one, and the number moves with it, in front of you.' },
  {
    text: 'Every metric is graded against the market: lifetime value over cost, payback, retention, rule of 40.',
    spoken:
      'Every metric is graded against the market: lifetime value over cost, payback, retention, rule of forty.',
  },
  { text: 'Where you sit has a name — five tiers, from mice to whales, and each one is a different company to run.' },
  { text: 'And when you want to know why a number moved, it is written down in plain words.' },
  { text: 'Or drag a single dove across a plate, and watch a valuation happen under your hand.' },
  { text: 'No spreadsheet. No sales call. No credit card.' },
  { text: 'Colombes. Create your free account.' },
]

/**
 * Les films qui ont une voix off.
 *
 * Les deux courts n'en ont pas et ne passent donc pas ici : sans parole, il n'y a
 * rien à caler et rien à sous-titrer.
 */
const FILMS = [
  {
    voice: 'video/audio/voice-en.wav',
    script: FILM70,
    captions: 'video/captions.json',
    srt: 'public/film/colombes-70s.en.srt',
    duration: 64.5,
    from: 0,
  },
  {
    voice: 'video/audio/voice-built.wav',
    script: BUILT,
    captions: 'video/captions-built.json',
    srt: 'public/film/colombes-built.en.srt',
    // Durée rendue par la synthèse, et entrée de la voix dans le film : de quoi
    // estimer tant que le fichier manque. `build-mix.mjs` applique le même décalage.
    duration: 57.745,
    from: 4,
  },
  {
    voice: 'video/audio/voice-levers.wav',
    script: LEVERS,
    captions: 'video/captions-levers.json',
    srt: 'public/film/colombes-levers.en.srt',
    duration: 65.274,
    from: 0.4,
    /*
     * Le plan qui commence sur chaque ligne. Une fois l'onde mesurée, le script
     * en déduit les durées exactes à recopier dans `cuts/levers.mjs` — ce qui
     * évite de les calculer à la main et de laisser l'image traîner derrière la
     * voix, comme c'était le cas de la version estimée.
     */
    anchors: [
      ['storm', 0],
      ['instinct', 3],
      ['not-a-line', 5],
      ['surface', 6],
      ['more-customers', 8],
      ['more-price', 9],
      ['compare', 10],
      ['chores', 11],
      ['bill', 13],
      ['before', 15],
      ['afternoon', 16],
      ['even-then', 17],
      ['one-is-free', 18],
      ['looks-like-work', 20],
      ['does-not', 22],
      ['pad', 23],
      ['closing', 26],
    ],
    total: 2100,
  },
  {
    voice: 'video/audio/voice-heuristics.wav',
    script: HEURISTICS,
    captions: 'video/captions-heuristics.json',
    srt: 'public/film/colombes-heuristics.en.srt',
    /*
     * Estimation tant que l'onde n'est pas là : 215 mots au débit mesuré sur les
     * deux voix précédentes — 235 mots en 65,27 s, soit 3,6 mots par seconde.
     * Le film est monté sur cette estimation, et `anchors` ci-dessous imprimera
     * les durées vraies dès que le fichier arrivera.
     */
    duration: 59.7,
    from: 4,
    /*
     * Le plan qui commence sur chaque ligne. « map » en porte deux : la carte est
     * le seul endroit du film où l'on s'arrête, et la couper en deux casserait le
     * seul plan qui respire.
     */
    anchors: [
      ['you', 0],
      ['quiet', 1],
      ['not-a-gap', 2],
      ['nobody-computes', 3],
      ['estimate', 4],
      ['six', 5],
      ['churn', 6],
      ['nrr', 7],
      ['ltv-cac', 8],
      ['payback', 9],
      ['margin', 10],
      ['rule-of-40', 11],
      ['worth-twice', 12],
      ['lazy-advice', 13],
      ['you-were-right', 14],
      ['fear', 15],
      ['map', 16],
      ['pad', 18],
      ['today', 19],
      ['closing', 20],
    ],
    total: 2100,
  },
  {
    voice: 'video/audio/voice-product.wav',
    script: PRODUCT,
    captions: 'video/captions-product.json',
    srt: 'public/film/colombes-product.en.srt',
    // 174 mots au débit mesuré sur les voix précédentes, entrée à la troisième
    // seconde : la chute garde ainsi neuf secondes de bouton à l'image.
    duration: 48.3,
    from: 3,
    anchors: [
      ['open', 0],
      ['worth', 1],
      ['black-box', 2],
      ['enter', 3],
      ['home', 4],
      ['valuation', 5],
      // « bouge un levier » et « le chiffre bouge avec » sont le même plan : c'est
      // le seul endroit du film où l'on voit deux états réels de l'app se succéder.
      ['levers', 6],
      ['health', 8],
      ['tiers', 9],
      ['learn', 10],
      ['pad', 11],
      ['free', 12],
      ['cta', 13],
    ],
    total: 1800,
  },
]

/** Décodage d'un WAV PCM 16 bits : suffisant, et évite une dépendance. */
function readWav(path) {
  const buffer = readFileSync(path)
  let offset = 12
  let channels = 2
  let rate = 48_000
  let data = null

  while (offset < buffer.length - 8) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const length = buffer.readUInt32LE(offset + 4)
    if (id === 'fmt ') {
      channels = buffer.readUInt16LE(offset + 10)
      rate = buffer.readUInt32LE(offset + 12)
    }
    if (id === 'data') {
      data = { start: offset + 8, length: Math.min(length, buffer.length - offset - 8) }
      break
    }
    offset += 8 + length + (length % 2)
  }

  const frames = Math.floor(data.length / 2 / channels)
  const samples = new Float32Array(frames)
  for (let i = 0; i < frames; i++) {
    let sum = 0
    for (let k = 0; k < channels; k++) sum += buffer.readInt16LE(data.start + (i * channels + k) * 2)
    samples[i] = sum / channels / 32_768
  }
  return { samples, rate }
}

/**
 * Les salves de parole. Le seuil est relatif au pic : un seuil absolu
 * classerait une voix douce comme du silence. Les trous de moins de 200 ms
 * sont recousus — ce sont les occlusives, pas des fins de phrase.
 */
function speechBursts({ samples, rate }) {
  const window = Math.floor(rate * 0.01)
  const envelope = []
  for (let w = 0; w * window < samples.length; w++) {
    let sum = 0
    let count = 0
    for (let i = w * window; i < Math.min(samples.length, (w + 1) * window); i++) {
      sum += samples[i] ** 2
      count++
    }
    envelope.push(Math.sqrt(sum / count))
  }

  const gate = Math.max(...envelope) * 0.035
  const bursts = []
  let current = null
  for (let i = 0; i < envelope.length; i++) {
    if (envelope[i] > gate) {
      if (current) current.end = i
      else current = { start: i, end: i }
    } else if (current && i - current.end > 20) {
      bursts.push(current)
      current = null
    }
  }
  if (current) bursts.push(current)

  return bursts
    .filter((b) => b.end - b.start >= 10)
    .map((b) => ({ start: b.start / 100, end: (b.end + 1) / 100 }))
}

for (const film of FILMS) {
  const measured = existsSync(film.voice)
  let bursts = null
  let spokenTime = film.duration

  if (measured) {
    bursts = speechBursts(readWav(film.voice))
    spokenTime = bursts.reduce((total, b) => total + (b.end - b.start), 0)
  }

  /**
   * Position, en secondes du film, d'un instant donné sur l'axe « parole seule ».
   *
   * Mesuré, l'axe saute les silences : une ligne ne peut donc pas tomber dans un
   * blanc. Estimé, il n'y a pas de silences connus — on étale simplement sur la
   * durée annoncée, décalée de l'entrée de la voix.
   */
  function wallClock(spokenOffset) {
  if (!bursts) return film.from + spokenOffset
  let remaining = spokenOffset
  for (const burst of bursts) {
    const length = burst.end - burst.start
    if (remaining <= length) return film.from + burst.start + remaining
    remaining -= length
  }
  return film.from + bursts[bursts.length - 1].end
  }

  const weights = film.script.map((line) => (line.spoken ?? line.text).replace(/\s/g, '').length)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const captions = []
  let cursor = 0
  film.script.forEach((line, index) => {
  const from = wallClock((cursor / totalWeight) * spokenTime)
  cursor += weights[index]
  const to = wallClock((cursor / totalWeight) * spokenTime)

  // Recalage sur la salve la plus proche : une entrée posée sur l'attaque se
  // lit comme synchrone, une entrée à 200 ms près se lit comme un décalage.
  // Sans onde, il n'y a rien sur quoi se recaler.
  const snapped = bursts
    ? bursts.reduce(
        (best, b) => (Math.abs(film.from + b.start - from) < Math.abs(best - from) ? film.from + b.start : best),
        from,
      )
    : from
  const start = Math.abs(snapped - from) < 0.4 ? snapped : from

  captions.push({
    at: Math.round(start * FPS),
    len: Math.max(Math.round((to - start) * FPS), 24),
    text: line.text,
  })
  })

  // Aucune ligne ne doit mordre sur la suivante : le chevauchement afficherait
  // deux sous-titres l'un sur l'autre.
  for (let i = 0; i < captions.length - 1; i++) {
  const overlap = captions[i].at + captions[i].len - captions[i + 1].at
  if (overlap > 0) captions[i].len -= overlap
  }

  writeFileSync(film.captions, `${JSON.stringify(captions, null, 2)}\n`)

  const stamp = (frames) => {
  const total = frames / FPS
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(Math.floor(total % 60)).padStart(2, '0')
  const ms = String(Math.round((total % 1) * 1000)).padStart(3, '0')
  return `${h}:${m}:${s},${ms}`
  }

  const srt = captions
  .map((c, i) => `${i + 1}\n${stamp(c.at)} --> ${stamp(c.at + c.len)}\n${c.text}\n`)
  .join('\n')
  writeFileSync(film.srt, srt)

  console.log(
    measured
      ? `\n${film.voice} — ${spokenTime.toFixed(2)} s de parole mesurés sur ${bursts.length} salves`
      : `\n${film.voice} absent — ${spokenTime.toFixed(2)} s estimés, entrée à ${film.from} s`,
  )
  for (const c of captions) {
  console.log(`${(c.at / FPS).toFixed(2).padStart(6)}s  ${(c.len / FPS).toFixed(2)}s  ${c.text}`)
  }
  console.log(`${film.captions} et ${film.srt} : ${captions.length} lignes`)

  if (film.anchors) {
    // Les durées de plan que le montage devrait porter, calculées et non estimées.
    // Le premier plan part de l'image zéro, pas de sa réplique : le film commence
    // avant que la voix entre, et ce silence appartient à l'accroche.
    const starts = film.anchors.map(([id, line], index) => ({ id, at: index === 0 ? 0 : captions[line].at }))
    console.log(`\n  durées à porter dans le montage (${measured ? 'mesurées' : 'estimées'}) :`)
    starts.forEach((shot, index) => {
      const next = starts[index + 1]?.at ?? film.total
      console.log(`    { id: '${shot.id}', len: ${next - shot.at} },`.padEnd(46) + `// ${(shot.at / FPS).toFixed(2)} s`)
    })
  }
}
