/**
 * Génère l'icône d'application à partir du tracé de la colombe.
 *
 * Les PNG sont versionnés dans `public/` : ce script ne tourne qu'à la main,
 * quand la marque bouge. Il demande un rasteriseur qui n'a pas sa place dans
 * les dépendances du projet le reste du temps :
 *
 *     pnpm add -D @resvg/resvg-js && node scripts/build-icons.mjs && pnpm remove @resvg/resvg-js
 *
 * Règles iOS respectées ici : carré plein bord à bord, aucune transparence,
 * aucun arrondi de notre part — le système applique son propre masque, et un
 * coin déjà arrondi produirait un liseré. Le glyphe occupe 56 % de la toile,
 * ce qui le laisse dans la zone sûre d'un masque « maskable ».
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

/** Le tracé officiel, copié de src/components/DoveLogo.tsx. */
const DOVE =
  'M437.8,130.83c-4.24,1.84-7.6,5.16-8.72,9.56l-32.09,125.48-288.89,117.97,44.87-52.06,69.66-77.81L0,140.42.23,0l307.8,156.93,46.18-51.71c3.89-5.3,8.73-9.38,14.52-12.35l41.56-13.58c7.99-2.61,14.57-1.38,21.71,2.45l54.52,29.24-48.71,19.86Z'
const DOVE_BOX = { w: 486.52, h: 383.84 }

/**
 * Le jaune de la marque et son encre, repris de `.lume-pill` dans index.css —
 * hardcodés là-bas aussi, pour que le bouton reste le même jaune quel que
 * soit le thème. L'icône doit être ce jaune-là, pas une approximation.
 */
const TOP = 'oklch(0.93 0.135 110)'
const BOTTOM = 'oklch(0.875 0.13 110)'
const INK = 'oklch(0.22 0.04 112)'

/** Part de la toile occupée par la colombe, dans sa plus grande dimension. */
const GLYPH_SHARE = 0.56

function iconSvg(size) {
  const scale = (size * GLYPH_SHARE) / DOVE_BOX.w
  const w = DOVE_BOX.w * scale
  const h = DOVE_BOX.h * scale
  // Centrage optique : la colombe pointe vers le bas à droite, sa masse est
  // en haut à gauche. Un centrage géométrique la ferait paraître trop basse.
  const x = (size - w) / 2
  const y = (size - h) / 2 - size * 0.012

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="lume" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${TOP}"/>
      <stop offset="1" stop-color="${BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#lume)"/>
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="${DOVE}" fill="${INK}"/>
  </g>
</svg>`
}

const OUTPUTS = [
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'public/icon-1024.png', size: 1024 },
]

mkdirSync('public', { recursive: true })

for (const { file, size } of OUTPUTS) {
  const png = new Resvg(iconSvg(size), { fitTo: { mode: 'width', value: size } })
    .render()
    .asPng()
  writeFileSync(file, png)
  console.log(`${file.padEnd(30)} ${size}×${size}  ${(png.length / 1024).toFixed(1)} ko`)
}

// La source vectorielle, pour qui veut la retoucher sans relancer le script.
writeFileSync('public/icon.svg', iconSvg(1024))
console.log('public/icon.svg                 source vectorielle')
