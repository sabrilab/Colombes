/**
 * Cale les sous-titres sur ce que la voix off dit vraiment.
 *
 * La première version datait les lignes à la main : deux phrases manquaient et
 * les autres dérivaient de plus d'une seconde. Ici on mesure le fichier — on
 * découpe l'onde en salves de parole, puis on répartit le texte au prorata des
 * caractères prononcés sur le temps de parole effectif, les silences exclus.
 * Une ligne ne peut donc plus tomber dans un blanc, et son début est recalé sur
 * la salve la plus proche.
 *
 *     node scripts/align-captions.mjs
 *
 * Écrit `video/captions.json` (lu par le montage) et le `.srt` livré à part.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const VOICE = 'video/audio/voice-en.wav'
const FPS = 30

/**
 * Le texte exact envoyé à la synthèse, découpé en lignes d'affichage.
 *
 * `spoken` sert au calage — la synthèse a lu « two euros », pas « €2 » — et
 * `text` est ce qu'on incruste. Sans cette distinction, un symbole compté pour
 * un caractère décalerait tout ce qui suit.
 */
const SCRIPT = [
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

const voice = readWav(VOICE)
const bursts = speechBursts(voice)
const spokenTime = bursts.reduce((total, b) => total + (b.end - b.start), 0)

/** Position, en secondes réelles, d'un instant donné sur l'axe « parole seule ». */
function wallClock(spokenOffset) {
  let remaining = spokenOffset
  for (const burst of bursts) {
    const length = burst.end - burst.start
    if (remaining <= length) return burst.start + remaining
    remaining -= length
  }
  return bursts[bursts.length - 1].end
}

const weights = SCRIPT.map((line) => (line.spoken ?? line.text).replace(/\s/g, '').length)
const totalWeight = weights.reduce((a, b) => a + b, 0)

const captions = []
let cursor = 0
SCRIPT.forEach((line, index) => {
  const from = wallClock((cursor / totalWeight) * spokenTime)
  cursor += weights[index]
  const to = wallClock((cursor / totalWeight) * spokenTime)

  // Recalage sur la salve la plus proche : une entrée posée sur l'attaque se
  // lit comme synchrone, une entrée à 200 ms près se lit comme un décalage.
  const snapped = bursts.reduce((best, b) => (Math.abs(b.start - from) < Math.abs(best - from) ? b.start : best), from)
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

writeFileSync('video/captions.json', `${JSON.stringify(captions, null, 2)}\n`)

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
writeFileSync('public/film/colombes-70s.en.srt', srt)

console.log(`parole : ${spokenTime.toFixed(2)} s utiles sur ${bursts.length} salves`)
for (const c of captions) {
  console.log(`${(c.at / FPS).toFixed(2).padStart(6)}s  ${(c.len / FPS).toFixed(2)}s  ${c.text}`)
}
console.log(`\nvideo/captions.json et le .srt écrits : ${captions.length} lignes`)
