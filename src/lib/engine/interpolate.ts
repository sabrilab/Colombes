export type Anchor = readonly [x: number, y: number]

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max)
}

/**
 * Interpolation linéaire par morceaux entre ancrages triés par x croissant.
 * Hors du domaine, renvoie l'ancrage extrême le plus proche : on n'extrapole
 * jamais un barème de marché au-delà de ce qu'il décrit.
 */
export function interpolate(anchors: readonly Anchor[], x: number): number {
  if (anchors.length === 0) return 0
  if (x <= anchors[0][0]) return anchors[0][1]

  const last = anchors[anchors.length - 1]
  if (x >= last[0]) return last[1]

  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i]
    const [x1, y1] = anchors[i + 1]
    if (x <= x1) {
      const span = x1 - x0
      if (span === 0) return y1
      return y0 + ((x - x0) / span) * (y1 - y0)
    }
  }

  return last[1]
}

/** Transition lisse de 0 à 1, à dérivée nulle aux deux bornes. */
export function smoothstep(a: number, b: number, x: number): number {
  if (b === a) return x < a ? 0 : 1
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Reporte des ancrages sur une échelle logarithmique décimale. */
export function logAnchors(pairs: readonly Anchor[]): Anchor[] {
  return pairs.map(([x, y]) => [Math.log10(Math.max(x, 1)), y] as Anchor)
}
