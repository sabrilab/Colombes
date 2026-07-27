/**
 * Les couches du pad, isolées pour pouvoir les éteindre une à une. Chaque
 * variante est une combinaison — c'est le seul moyen de comparer sur pièces
 * plutôt que de discuter en principe.
 */
export interface PadLayers {
  /** Bandes horizontales des paliers de Janz. */
  bands: boolean
  /** Courbes d'iso-revenu en fond. */
  isoLines: boolean
  /** Étiquettes chiffrées sur les courbes d'iso-revenu. */
  isoLabels: boolean
  /** Quadrant lumineux sous la colombe. */
  quadrant: boolean
  /** Essaim de points figurant les clients. */
  swarm: boolean
  /** Repères d'axes aux ordres de grandeur. */
  ticks: boolean
  /** Croix de visée reliant la colombe aux axes. */
  crosshair: boolean
}

export interface PadVariant {
  id: string
  name: string
  /** Ce que la variante cherche à privilégier, et ce qu'elle sacrifie. */
  rationale: string
  layers: PadLayers
}

const ALL: PadLayers = {
  bands: true,
  isoLines: true,
  isoLabels: false,
  quadrant: true,
  swarm: true,
  ticks: true,
  crosshair: true,
}

/** La variante retenue à l'issue du banc d'essai : celle que le site affiche. */
const TIERS: PadLayers = {
  bands: true,
  isoLines: false,
  isoLabels: false,
  quadrant: true,
  swarm: false,
  ticks: false,
  crosshair: true,
}

export const PAD_VARIANTS: PadVariant[] = [
  {
    id: 'current',
    name: 'Current',
    rationale:
      'Every layer at once: tier bands, revenue contours, the lit quadrant and its swarm. The most informative, and the busiest.',
    layers: ALL,
  },
  {
    id: 'instrument',
    name: 'Instrument',
    rationale:
      'Axis markers and a crosshair, nothing else. The pad reads like a measuring tool: your position is exact, but nothing tells you what a good position would be.',
    layers: {
      bands: false,
      isoLines: false,
      isoLabels: false,
      quadrant: false,
      swarm: false,
      ticks: true,
      crosshair: true,
    },
  },
  {
    id: 'quadrant',
    name: 'Quadrant',
    rationale:
      'Only the lit area and the swarm. The size of the glow is the whole message — bigger means bigger business. Nothing to read, everything to feel.',
    layers: {
      bands: false,
      isoLines: false,
      isoLabels: false,
      quadrant: true,
      swarm: true,
      ticks: true,
      crosshair: false,
    },
  },
  {
    id: 'contours',
    name: 'Contours',
    rationale:
      'Revenue contours, labelled. You see the €10K and €100K MRR lines and how far you sit from them — the most useful for someone chasing a number, at the cost of a busier surface.',
    layers: {
      bands: false,
      isoLines: true,
      isoLabels: true,
      quadrant: false,
      swarm: false,
      ticks: true,
      crosshair: true,
    },
  },
  {
    id: 'tiers',
    name: 'Tiers',
    rationale:
      'What the site ships. Tier bands and the quadrant: you always know which animal you are in and how big you have grown, without any numeric clutter.',
    layers: TIERS,
  },
]

export const DEFAULT_LAYERS = TIERS
