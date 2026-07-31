/**
 * Le mixage des films, fabriqué avant le rendu.
 *
 * Remotion sait empiler plusieurs pistes, mais pas les faire s'écouter entre
 * elles : la musique passerait au même volume sous la voix que dans les silences,
 * et un réglage raté ne se découvrirait qu'après dix minutes de rendu. Ici le
 * mixage est un fichier — on le mesure en trois secondes, et le montage n'a plus
 * qu'une seule piste à monter.
 *
 * Quatre choses s'y jouent :
 *  — la voix, quand il y en a une, est compressée puis calée au niveau, parce que
 *    la synthèse rend une piste à −25 dBFS que personne n'entend sur un téléphone ;
 *  — la musique s'écarte quand la voix parle, et remonte dans les silences ;
 *  — les bruits de coupe sont posés sur les coupes du montage ;
 *  — les rampes crantées — molettes, barres — sont sonorisées cran par cran, aux
 *    images que `video/motion.mjs` calcule pour l'image elle-même.
 *
 *     node scripts/build-mix.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stepFrames } from '../video/motion.mjs'

const RATE = 48_000

/** Cibles de niveau, en dBFS. La voix commande, le reste se règle sous elle. */
const VOICE_RMS = -17
const MUSIC_DUCK = -9 // ce que la musique perd quand la voix parle
const SFX_PEAK = -14
/** Les crans passent nettement plus bas : il y en a jusqu'à vingt-quatre d'affilée. */
const TICK_PEAK = -19
const CEILING = -1.2

/**
 * Les trois films.
 *
 * `musicFrom` décale l'entrée dans la piste : sans ça les trois films ouvriraient
 * sur les mêmes quatre mesures et s'entendraient comme trois montages du même
 * rush. Les films sans voix montent la musique de huit décibels — elle n'a plus
 * rien à laisser passer, et les trois doivent sortir au même niveau, sinon le
 * spectateur touche au volume entre deux vidéos.
 */
const FILMS = [
  {
    label: '1 min 10, anglais',
    output: 'public/film/mix-70s.mp3',
    cut: '../video/cuts/film70.mjs',
    voice: 'video/audio/voice-en.wav',
    musicRms: -25.5,
    musicFrom: 0,
    // L'accroche et la chute n'ont pas de voix : la musique y monte, sinon
    // l'ouverture paraît vide et la fin s'éteint trop tôt.
    swells: [
      [0, 3.2, 3],
      [64.6, Infinity, 3],
    ],
  },
  {
    label: 'la version rapide, 1 min 10',
    output: 'public/film/mix-built.mp3',
    cut: '../video/cuts/built.mjs',
    voice: 'video/audio/voice-built.wav',
    /*
     * La voix entre à la quatrième seconde et se tait à la soixante-deuxième.
     * Le couloir d'ouverture et la chute sont donc portés par la musique seule,
     * qui y monte de trois décibels — sinon l'ouverture paraît vide et la fin
     * s'éteint trop tôt.
     */
    voiceFrom: 4,
    musicRms: -25.5,
    /*
     * Niveau de repli tant que la voix n'est pas déposée : sans elle, une musique
     * réglée pour passer dessous sort huit décibels trop bas, et le film paraît
     * cassé alors qu'il ne manque qu'un fichier.
     */
    musicRmsSolo: -17.5,
    musicFrom: 8,
    swells: [
      [0, 4.2, 3],
      [62, Infinity, 3],
    ],
  },
  {
    label: 'les deux leviers, 1 min 10',
    output: 'public/film/mix-levers.mp3',
    cut: '../video/cuts/levers.mjs',
    voice: 'video/audio/voice-levers.wav',
    voiceFrom: 0,
    musicRms: -25.5,
    musicRmsSolo: -17.5,
    musicFrom: 74,
    swells: [],
  },
  {
    label: 'les six règles, 1 min 10',
    output: 'public/film/mix-heuristics.mp3',
    cut: '../video/cuts/heuristics.mjs',
    voice: 'video/audio/voice-heuristics.wav',
    /*
     * La voix entre à la quatrième seconde — l'accroche survole le relief sans
     * un mot — et se tait vers la soixante-quatrième. Le survol et la chute sont
     * donc portés par la musique seule, qui y monte de trois décibels.
     */
    voiceFrom: 4,
    musicRms: -25.5,
    musicRmsSolo: -17.5,
    /*
     * 26 s : la piste dure 2 min 14, donc soixante-dix secondes prises là ne
     * bouclent pas — et c'est une section qu'aucun des quatre autres films
     * n'emploie, ce qui évite de les entendre comme cinq montages du même rush.
     */
    musicFrom: 26,
    swells: [
      [0, 4.2, 3],
      [64, Infinity, 3],
    ],
  },
  {
    label: 'la présentation du produit, 1 min, 16/9',
    output: 'public/film/mix-product.mp3',
    cut: '../video/cuts/product.mjs',
    voice: 'video/audio/voice-product.wav',
    // La voix entre à la troisième seconde : l'accroche traverse les plaques
    // sans un mot, et la chute garde dix secondes de bouton en musique seule.
    voiceFrom: 3,
    musicRms: -25.5,
    musicRmsSolo: -17.5,
    // 58 s : soixante secondes prises là ne bouclent pas, et la section n'est
    // employée par aucun des cinq autres films.
    musicFrom: 58,
    swells: [
      [0, 3.2, 3],
      [52, Infinity, 3],
    ],
  },
  {
    label: "l'échelle, 35 s",
    output: 'public/film/mix-ladder.mp3',
    cut: '../video/cuts/ladder.mjs',
    voice: null,
    musicRms: -17.5,
    musicFrom: 47,
    swells: [],
  },
  {
    label: 'la cascade, 35 s',
    output: 'public/film/mix-remains.mp3',
    cut: '../video/cuts/remains.mjs',
    voice: null,
    musicRms: -17.5,
    musicFrom: 103,
    swells: [],
  },
]

const dbToGain = (db) => 10 ** (db / 20)
const gainToDb = (gain) => 20 * Math.log10(Math.max(gain, 1e-9))

/** Décodage d'un WAV PCM 16 bits, ramené en mono flottant. */
function readWavMono(path) {
  const buffer = readFileSync(path)
  let offset = 12
  let channels = 1
  let rate = RATE
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
  if (!data) throw new Error(`${path} : pas de bloc data`)

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
 * Rééchantillonnage linéaire. Suffisant ici : on ne fait que monter en fréquence,
 * et l'erreur d'interpolation se place au-delà de ce que la voix contient.
 */
function resample({ samples, rate }, target = RATE) {
  if (rate === target) return samples
  const ratio = rate / target
  const out = new Float32Array(Math.floor(samples.length / ratio))
  for (let i = 0; i < out.length; i++) {
    const position = i * ratio
    const index = Math.floor(position)
    const fraction = position - index
    const a = samples[index] ?? 0
    const b = samples[index + 1] ?? a
    out[i] = a + (b - a) * fraction
  }
  return out
}

/** Suiveur d'enveloppe : attaque rapide, retour lent. */
function envelope(samples, attackMs, releaseMs) {
  const attack = Math.exp(-1 / ((attackMs / 1000) * RATE))
  const release = Math.exp(-1 / ((releaseMs / 1000) * RATE))
  const out = new Float32Array(samples.length)
  let level = 0
  for (let i = 0; i < samples.length; i++) {
    const rectified = Math.abs(samples[i])
    const coefficient = rectified > level ? attack : release
    level = rectified + coefficient * (level - rectified)
    out[i] = level
  }
  return out
}

/** Crête d'un tableau. `Math.max(...tableau)` déborde la pile au-delà de 100 000 valeurs. */
function peakOf(samples) {
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const value = Math.abs(samples[i])
    if (value > peak) peak = value
  }
  return peak
}

function rms(samples, from = 0, to = samples.length) {
  let sum = 0
  for (let i = from; i < to; i++) sum += samples[i] ** 2
  return Math.sqrt(sum / Math.max(1, to - from))
}

/**
 * Compression de la voix. Une synthèse arrive avec vingt décibels d'écart entre un
 * mot appuyé et une fin de phrase : sans compression, monter le niveau moyen fait
 * saturer les attaques, et le baisser rend les fins inaudibles.
 */
function compress(samples, { threshold = -26, ratio = 3.4 } = {}) {
  const level = envelope(samples, 6, 140)
  const limit = dbToGain(threshold)
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    let gain = 1
    if (level[i] > limit) {
      const over = gainToDb(level[i] / limit)
      gain = dbToGain(-over * (1 - 1 / ratio))
    }
    out[i] = samples[i] * gain
  }
  return out
}

/** Niveau moyen mesuré sur la parole seule : les silences fausseraient la mesure. */
function speechRms(samples) {
  const level = envelope(samples, 10, 200)
  const gate = peakOf(level) * 0.06
  let sum = 0
  let count = 0
  for (let i = 0; i < samples.length; i++) {
    if (level[i] > gate) {
      sum += samples[i] ** 2
      count++
    }
  }
  return { value: Math.sqrt(sum / Math.max(1, count)), share: count / samples.length }
}

/**
 * Limiteur à anticipation.
 *
 * Un suiveur d'enveloppe ne convient pas : quelle que soit son attaque, il monte
 * *après* la crête, donc il réduit trop tard et l'échantillon écrête quand même.
 * Ici on prend le maximum des deux millisecondes à venir — une borne supérieure,
 * jamais en retard — puis on ne lisse que le retour, pour que le gain ne remonte
 * pas entre deux crêtes rapprochées.
 */
function lookaheadPeak(samples, lookaheadMs, releaseMs) {
  const window = Math.max(1, Math.round((lookaheadMs / 1000) * RATE))
  const release = Math.exp(-1 / ((releaseMs / 1000) * RATE))
  const out = new Float32Array(samples.length)

  // File monotone décroissante : le maximum glissant en temps constant.
  const queue = new Int32Array(samples.length)
  let head = 0
  let tail = 0
  for (let i = 0; i < samples.length; i++) {
    const bound = Math.min(samples.length - 1, i + window - 1)
    for (let j = i === 0 ? 0 : Math.max(i + window - 1, 1); j <= bound; j++) {
      const value = Math.abs(samples[j])
      while (tail > head && Math.abs(samples[queue[tail - 1]]) <= value) tail--
      queue[tail++] = j
    }
    while (head < tail && queue[head] < i) head++
    out[i] = head < tail ? Math.abs(samples[queue[head]]) : 0
  }

  let level = 0
  for (let i = 0; i < out.length; i++) {
    level = Math.max(out[i], level * release)
    out[i] = level
  }
  return out
}

/** Écriture d'un WAV stéréo : voix, musique et bruitage sont tous centrés. */
function writeStereoWav(path, mono) {
  const data = Buffer.alloc(mono.length * 4)
  for (let i = 0; i < mono.length; i++) {
    const value = Math.round(Math.max(-1, Math.min(1, mono[i])) * 32_767)
    data.writeInt16LE(value, i * 4)
    data.writeInt16LE(value, i * 4 + 2)
  }

  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(2, 22)
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 4, 28)
  header.writeUInt16LE(4, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)

  writeFileSync(path, Buffer.concat([header, data]))
}

const scratch = join(tmpdir(), 'colombes-mix')
mkdirSync(scratch, { recursive: true })

/**
 * La musique, décodée une fois pour les trois films.
 *
 * Le décodage passe par le ffmpeg fourni avec Remotion : décoder un MP3 à la main
 * n'apporterait rien, et cette version est déjà celle qui rendra les vidéos.
 */
function loadMusic() {
  const wav = join(scratch, 'music.wav')
  execFileSync(
    'npx',
    ['remotion', 'ffmpeg', '-y', '-i', 'video/audio/music.mp3', '-ac', '1', '-ar', String(RATE), '-f', 'wav', wav],
    { stdio: 'pipe' },
  )
  return readWavMono(wav).samples
}

const MUSIC = loadMusic()

const sfxCache = new Map()
/** Un effet, ramené à la crête voulue. Mis en cache : il sert des dizaines de fois. */
function sfx(name, peakDb) {
  const key = `${name}@${peakDb}`
  if (!sfxCache.has(key)) {
    const samples = readWavMono(`video/audio/sfx/${name}.wav`).samples
    const gain = dbToGain(peakDb) / Math.max(peakOf(samples), 1e-6)
    const scaled = new Float32Array(samples.length)
    for (let i = 0; i < samples.length; i++) scaled[i] = samples[i] * gain
    sfxCache.set(key, scaled)
  }
  return sfxCache.get(key)
}

async function buildFilm(film) {
  const { FPS, TIMELINE, TOTAL_FRAMES } = await import(film.cut)
  const length = Math.round((TOTAL_FRAMES / FPS) * RATE)

  // ── La voix ───────────────────────────────────────────────────────────────
  let voice = null
  let voiceReport = 'aucune'
  if (film.voice && !existsSync(film.voice)) {
    // Le fichier n'est pas encore là : on construit quand même la piste, sans
    // voix. Refuser de mixer bloquerait aussi les films qui n'en ont pas besoin.
    voiceReport = `${film.voice} absent — mixé sans voix`
  } else if (film.voice) {
    voice = compress(resample(readWavMono(film.voice)))
    const measured = speechRms(voice)
    const gain = dbToGain(VOICE_RMS) / measured.value
    for (let i = 0; i < voice.length; i++) voice[i] *= gain

    // Décalage d'entrée : la voix ne commence pas forcément à la première image.
    const offset = Math.round((film.voiceFrom ?? 0) * RATE)
    if (offset > 0) {
      const shifted = new Float32Array(voice.length + offset)
      shifted.set(voice, offset)
      voice = shifted
    }

    voiceReport = `${gainToDb(measured.value).toFixed(1)} dBFS mesurés → ${VOICE_RMS} (gain ${gainToDb(gain).toFixed(1)} dB), entrée à ${film.voiceFrom ?? 0} s`
  }

  // ── La musique ────────────────────────────────────────────────────────────
  const music = new Float32Array(length)
  const start = Math.round(film.musicFrom * RATE)
  const crossfade = RATE
  const loopLength = Math.max(1, MUSIC.length - crossfade)
  for (let i = 0; i < length; i++) {
    // Bouclée si le film dépasse la piste, avec un fondu croisé d'une seconde :
    // une reprise sèche s'entend immédiatement.
    const position = (start + i) % loopLength
    music[i] = MUSIC[position] ?? 0
  }
  const musicTarget = voice ? film.musicRms : (film.musicRmsSolo ?? film.musicRms)
  const musicGain = dbToGain(musicTarget) / Math.max(rms(music), 1e-6)
  for (let i = 0; i < length; i++) music[i] *= musicGain

  if (voice) {
    // L'évitement. L'enveloppe de la voix commande la baisse, avec un retour lent :
    // la musique ne doit pas remonter entre deux mots, seulement entre deux phrases.
    const duck = envelope(voice, 12, 320)
    const gate = dbToGain(VOICE_RMS - 16)
    for (let i = 0; i < length; i++) {
      music[i] *= dbToGain(MUSIC_DUCK * Math.min(1, (duck[i] ?? 0) / gate))
    }
  }

  for (const [from, to, db] of film.swells) {
    const end = to === Infinity ? length : Math.round(to * RATE)
    for (let i = Math.round(from * RATE); i < Math.min(end, length); i++) music[i] *= dbToGain(db)
  }

  // Fondu de sortie sur les deux dernières secondes.
  const fade = Math.round(2 * RATE)
  for (let i = 0; i < fade; i++) music[length - fade + i] *= 1 - i / fade

  // ── Le bruitage ───────────────────────────────────────────────────────────
  const effects = new Float32Array(length)
  const place = (samples, frame) => {
    const at = Math.max(0, Math.round((frame / FPS) * RATE))
    for (let i = 0; i < samples.length && at + i < length; i++) effects[at + i] += samples[i]
  }

  let cuts = 0
  let ticks = 0
  for (const shot of TIMELINE) {
    if (shot.sfx) {
      // Le bruit de coupe part quatre images avant : un souffle qui commence à
      // l'image exacte arrive en retard à l'oreille.
      place(sfx(shot.sfx, SFX_PEAK), shot.at - 4)
      cuts++
    }
    if (shot.ticks) {
      // Les crans, eux, tombent pile : ils accompagnent un mouvement visible, et
      // toute avance se lirait comme un décalage.
      const grain = sfx(shot.ticks.sound, TICK_PEAK)
      for (const frame of stepFrames(shot.ticks)) {
        place(grain, shot.at + frame)
        ticks++
      }
    }
  }

  // ── Somme et limiteur ─────────────────────────────────────────────────────
  const mix = new Float32Array(length)
  for (let i = 0; i < length; i++) mix[i] = (voice?.[i] ?? 0) + music[i] + effects[i]

  const ceiling = dbToGain(CEILING)
  const peaks = lookaheadPeak(mix, 2, 150)
  let reduced = 0
  for (let i = 0; i < length; i++) {
    if (peaks[i] > ceiling) {
      mix[i] *= ceiling / peaks[i]
      reduced++
    }
  }

  const wav = join(scratch, 'mix.wav')
  writeStereoWav(wav, mix)
  // Le fichier livré est en MP3 : le WAV pèse des mégaoctets que le dépôt et le
  // déploiement porteraient pour rien.
  execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-i', wav, '-b:a', '176k', film.output], { stdio: 'pipe' })

  console.log(`${film.output}  ${(length / RATE).toFixed(2)} s — ${film.label}`)
  console.log(`  voix     ${voiceReport}`)
  console.log(`  musique  ${musicTarget} dBFS, entrée à ${film.musicFrom} s${voice ? `, évitement ${MUSIC_DUCK} dB` : ''}`)
  console.log(`  bruitage ${cuts} coupes, ${ticks} crans`)
  console.log(`  sortie   ${gainToDb(rms(mix)).toFixed(1)} dBFS moyens, crête ${gainToDb(peakOf(mix)).toFixed(1)} dBFS, ${((reduced / length) * 100).toFixed(2)} % limités`)
}

for (const film of FILMS) await buildFilm(film)
rmSync(scratch, { recursive: true, force: true })
