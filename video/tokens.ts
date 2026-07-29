import { interpolate, useCurrentFrame } from 'remotion'

/**
 * Les jetons de présentation des films : pigments, typographie, centrage, et la
 * petite horloge qui sert à les animer.
 *
 * Séparés des composants pour une raison pratique — un fichier qui exporte à la
 * fois des composants et des constantes casse le rechargement à chaud de l'aperçu
 * Remotion, où l'on passe le plus clair du temps à régler un montage.
 *
 * Les valeurs sont celles de `src/index.css`, recopiées et non importées : une
 * vidéo n'a pas de thème clair, ni de variables CSS à résoudre, et le rendu ne
 * doit dépendre d'aucune feuille de style pour composer une image.
 */

export const LUME = 'oklch(0.92 0.145 112)'
export const HAZE = 'oklch(0.78 0.13 305)'
export const INK = 'oklch(0.98 0.005 110)'
export const DIM = 'oklch(0.68 0 0)'
export const RED = 'oklch(0.7 0.2 25)'
export const BG = 'oklch(0.125 0.006 110)'

export const display = { fontFamily: "'Chakra Petch', system-ui, sans-serif" } as const
export const mono = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontVariantNumeric: 'tabular-nums',
} as const

export const centred = { alignItems: 'center', justifyContent: 'center' } as const

/** Un nombre qui se pose : il monte vite, puis se cale sur sa valeur. */
export function useCount(target: number, { delay = 0, duration = 26 } = {}) {
  const frame = useCurrentFrame()
  return (
    target *
    interpolate(frame - delay, [0, duration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 3,
    })
  )
}
