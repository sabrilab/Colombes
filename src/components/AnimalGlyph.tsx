import type { ReactNode } from 'react'

/**
 * Les totems en silhouette : le même bestiaire que la scène 3D, mais en
 * quelques traits. Un rappel de palier tient dans chaque carte sans ouvrir
 * un contexte WebGL — le navigateur en plafonne le nombre, et on en aurait
 * bien plus que d'animaux à l'écran.
 *
 * Toutes regardent vers la gauche, comme les modèles.
 */

const GLYPHS: Record<string, ReactNode> = {
  // Corps ramassé, grande oreille, longue queue.
  Mice: (
    <>
      <path d="M3.6 13.4c0-3 2.6-5 6-5 4.6 0 8 1.9 8 4.7 0 1.5-1.2 2.4-3 2.4H6.6c-1.8 0-3-1-3-2.1Z" />
      <circle cx="10.4" cy="8.4" r="2.9" />
      <path
        d="M17.6 13.1c3.4-.3 5.6-1.6 6.9-4.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  // Deux longues oreilles couchées vers l'arrière.
  Rabbits: (
    <>
      <path d="M4.4 15.6c-1.6-1.6-1-4.2 1.6-5.4 1.5-.7 3-.8 4.3-.4 2.9.2 5.6 1.6 6.9 3.7.9 1.4.4 2.6-1.2 2.6H4.4Z" />
      <path d="M9.8 9.6c-.4-2.5.6-4.9 2.4-5.9.9-.5 1.7.1 1.5 1.2-.3 2-1.6 3.8-3.4 4.9Z" />
      <path d="M11.8 10c.3-2.4 1.8-4.5 3.7-5.1 1-.3 1.6.5 1.2 1.5-.7 1.9-2.5 3.4-4.6 4Z" />
    </>
  ),
  // Corps sur pattes, encolure dressée, bois ouverts.
  Deer: (
    <>
      <path d="M8.4 10.6c2.6-.7 6.4-.6 8.8.3l1.4 5.5-1.5.2-1-3.7-4.9.2-.9 3.6-1.5-.1.5-4.1Z" />
      <path d="M8.6 10.9c-.9-1.5-1-3.4-.5-5.2l1.6.4c-.3 1.5-.2 2.9.5 4.1Z" />
      <path
        d="M8.4 5.6 6.6 3.2m1.8 2.4L9.9 3m0 0 1.2-1.4M9.9 3 8.2 2.2M6.6 3.2 5.2 2m1.4 1.2-1.8-.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </>
  ),
  // Masse haute, oreille en éventail, trompe qui descend.
  Elephants: (
    <>
      <path d="M6.6 16.2V12c-1.4-1.6-1.2-4 .6-5.4 2.6-2 7.8-2 10.6 0 2.1 1.5 2.4 4.2.7 6v3.6l-1.6.1-.5-2.6-6.2.1-.4 2.4Z" />
      <ellipse cx="9.4" cy="8.9" rx="2.6" ry="3.1" />
      <path
        d="M6.4 9.2c-1.4 1.5-2 3.4-1.6 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </>
  ),
  // Fuseau et nageoire caudale relevée.
  Whales: (
    <>
      <path d="M3.4 11.5c1.6-2.6 5.2-4.2 9.4-4.2 3.6 0 6.6 1.1 8.3 2.8l-.4 1.9c-1.9 1.9-5 3.1-8.6 3.1-4.1 0-7.4-1.4-8.7-3.6Z" />
      <path d="M20.7 10.1c1.4-1.5 2.6-2.9 3.6-4.4l1.5.5-1.4 4.6 1.6 4.4-1.5.6c-1.2-1.4-2.5-2.8-4-4.2Z" />
    </>
  ),
}

export function AnimalGlyph({ animal, className }: { animal: string; className?: string }) {
  const glyph = GLYPHS[animal]
  if (!glyph) return null

  return (
    <svg viewBox="0 0 28 18" fill="currentColor" aria-hidden className={className}>
      {glyph}
    </svg>
  )
}

/** Le totem accompagné de son nom : le rappel de palier, partout pareil. */
export function TierBadge({ animal, className }: { animal: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground ${className ?? ''}`}
    >
      <AnimalGlyph animal={animal} className="h-3.5 w-5 shrink-0" />
      {animal}
    </span>
  )
}
