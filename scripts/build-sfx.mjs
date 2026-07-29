/**
 * Les effets sonores du montage, synthétisés.
 *
 * Aucun fichier à chercher, aucune licence à vérifier, et surtout : ils sont
 * réglés pour cette vidéo — un bruit de coupe pris dans une banque arrive
 * toujours trop long ou trop clair.
 *
 *     node scripts/build-sfx.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const RATE = 48_000

/** Écrit un WAV mono 16 bits à partir d'échantillons dans [-1, 1]. */
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(clamped * 32_767), i * 2)
  }

  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)

  return Buffer.concat([header, data])
}

const seconds = (d) => Math.floor(RATE * d)

/** Filtre passe-bas à un pôle : suffit à retirer le sifflement d'un bruit blanc. */
function lowpass(input, cutoff) {
  const alpha = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE)
  const out = new Float64Array(input.length)
  let last = 0
  for (let i = 0; i < input.length; i++) {
    last += alpha * (input[i] - last)
    out[i] = last
  }
  return out
}

/** Le souffle d'une coupe : bruit filtré dont la bande s'ouvre puis se ferme. */
function whoosh(duration = 0.42) {
  const n = seconds(duration)
  const noise = new Float64Array(n)
  for (let i = 0; i < n; i++) noise[i] = Math.random() * 2 - 1

  const low = lowpass(noise, 900)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    // Cloche d'amplitude, montée rapide et queue plus longue.
    const env = Math.sin(Math.PI * t) ** 1.6 * (1 - t * 0.35)
    out[i] = (noise[i] * 0.35 + low[i] * 1.6) * env * 0.5
  }
  return out
}

/** Le cran d'une molette : une impulsion très courte, à peine timbrée. */
function click(duration = 0.035) {
  const n = seconds(duration)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const decay = (1 - t) ** 9
    out[i] = ((Math.random() * 2 - 1) * 0.6 + Math.sin(2 * Math.PI * 2_100 * (i / RATE)) * 0.4) * decay * 0.5
  }
  return out
}

/** L'impact d'un chiffre qui tombe : une sinusoïde grave qui descend. */
function thud(duration = 0.3) {
  const n = seconds(duration)
  const out = new Float64Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const freq = 120 - 55 * t
    phase += (2 * Math.PI * freq) / RATE
    out[i] = Math.sin(phase) * (1 - t) ** 3 * 0.55
  }
  return out
}

/** La montée qui précède une révélation : bruit qui s'ouvre, ton qui monte. */
function riser(duration = 1.1) {
  const n = seconds(duration)
  const noise = new Float64Array(n)
  for (let i = 0; i < n; i++) noise[i] = Math.random() * 2 - 1

  const out = new Float64Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const freq = 180 + 900 * t ** 2
    phase += (2 * Math.PI * freq) / RATE
    const env = t ** 1.4
    out[i] = (Math.sin(phase) * 0.22 + lowpassStep(noise[i], t) * 0.4) * env * 0.42
  }
  return out

  function lowpassStep(sample, t) {
    // Bande qui s'ouvre avec la montée : plus on monte, plus c'est brillant.
    return sample * (0.3 + t * 0.7)
  }
}

/** Le coup grave d'une ouverture : plus long et plus bas qu'un impact. */
function boom(duration = 1.4) {
  const n = seconds(duration)
  const out = new Float64Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const freq = 62 - 26 * t
    phase += (2 * Math.PI * freq) / RATE
    // Attaque en deux images, puis une longue traîne : le grave doit rester
    // sous la voix off sans jamais la masquer.
    const attack = Math.min(1, t * 40)
    out[i] = Math.sin(phase) * attack * (1 - t) ** 2.2 * 0.7
  }
  return out
}

const DIRECTORY = 'video/audio/sfx'
mkdirSync(DIRECTORY, { recursive: true })

const FX = {
  'whoosh.wav': whoosh(),
  'click.wav': click(),
  'thud.wav': thud(),
  'riser.wav': riser(),
  'boom.wav': boom(),
}

for (const [name, samples] of Object.entries(FX)) {
  const buffer = wav(samples)
  writeFileSync(`${DIRECTORY}/${name}`, buffer)
  console.log(`${DIRECTORY}/${name.padEnd(12)} ${(samples.length / RATE).toFixed(2)} s  ${(buffer.length / 1024).toFixed(1)} ko`)
}
