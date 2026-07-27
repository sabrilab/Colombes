import type { ReactNode } from 'react'

/**
 * Les marques de la volière : des pastilles rondes portant une forme pleine,
 * pensées comme de vrais logos d'entreprise et non comme des pictogrammes.
 * Chaque colombe a sa palette, franchement contrastée.
 */

interface Mark {
  /** Fond de la pastille. */
  bg: string
  /** Couleur de la forme. */
  fg: string
  shape: ReactNode
}

const MARKS: Record<string, Mark> = {
  // Monitoring : trois barres de signal qui montent.
  turquoise: {
    bg: '#0D1110',
    fg: '#FFFFFF',
    shape: (
      <>
        <rect x="12" y="27" width="6" height="11" rx="1.5" />
        <rect x="21" y="19" width="6" height="19" rx="1.5" />
        <rect x="30" y="11" width="6" height="27" rx="1.5" />
      </>
    ),
  },
  // Restauration : un demi-disque, comme une assiette vue de profil.
  biset: {
    bg: '#F2ECE1',
    fg: '#16120C',
    shape: <path d="M10 27a14 14 0 0 1 28 0Z" />,
  },
  // Fitness B2C : le losange, taillé net.
  diamant: {
    bg: '#E22C39',
    fg: '#FFFFFF',
    shape: <path d="M24 9 39 24 24 39 9 24Z" />,
  },
  // Newsletters : la feuille pliée, penchée comme un envoi.
  colombine: {
    bg: '#FAFAF6',
    fg: '#111111',
    shape: <path d="M11 36 38 12 31 36Z" />,
  },
  // BTP : deux assises pleines, appareillées.
  ramier: {
    bg: '#2B3037',
    fg: '#FFFFFF',
    shape: (
      <>
        <rect x="10" y="16" width="28" height="8" rx="1.5" />
        <rect x="10" y="27" width="19" height="8" rx="1.5" />
      </>
    ),
  },
  // RH mid-market : trois pleins en triade, une équipe.
  tourterelle: {
    bg: '#17386B',
    fg: '#FFFFFF',
    shape: (
      <>
        <circle cx="24" cy="16" r="5.5" />
        <circle cx="15" cy="31" r="5.5" />
        <circle cx="33" cy="31" r="5.5" />
      </>
    ),
  },
}

/** Repli neutre : une pastille pleine, si une colombe n'a pas encore sa marque. */
const FALLBACK: Mark = {
  bg: '#1A1D1B',
  fg: '#FFFFFF',
  shape: <circle cx="24" cy="24" r="11" />,
}

export function BrandMark({ id, className }: { id: string; className?: string }) {
  const mark = MARKS[id] ?? FALLBACK

  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <circle cx="24" cy="24" r="24" fill={mark.bg} />
      <g fill={mark.fg}>{mark.shape}</g>
    </svg>
  )
}
