/**
 * « Colombes, in sixty seconds » — le film de présentation, et le seul en 16/9.
 *
 * Il ne démontre pas une idée, il montre un produit et demande une inscription.
 * D'où un montage différent de tous les autres :
 *
 *  — l'accroche dure sept secondes et ne montre que l'interface, en volume, sans
 *    un chiffre à lire. On regarde l'objet avant d'écouter l'argument ;
 *  — les plans de produit sont longs — jusqu'à six secondes — là où les films de
 *    démonstration coupent toutes les deux. Une capture d'écran demande à être
 *    lue, et une coupe rapide sur une interface donne l'impression qu'on cache
 *    quelque chose ;
 *  — la chute tient dix secondes sur le bouton. C'est le seul plan du film qui a
 *    quelque chose à obtenir, et il lui faut le temps qu'on s'y décide.
 *
 * Les durées viennent de la voix off, estimées tant que l'onde n'est pas là —
 * `scripts/align-captions.mjs` imprime les vraies dès qu'elle arrive.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 1800

export const SHOTS = [
  // Acte I — le problème, en trois plans dont deux très courts.
  { id: 'open', len: 212, sfx: 'riser' },
  { id: 'worth', len: 56, sfx: 'whoosh' },
  { id: 'black-box', len: 124, sfx: 'thud' },

  // Acte II — le produit. Un plan par chose qu'il fait, et rien d'autre dessus.
  { id: 'enter', len: 53, sfx: 'boom' },
  { id: 'home', len: 98, sfx: 'whoosh' },
  { id: 'valuation', len: 117, sfx: 'click' },
  /*
   * Le seul plan où deux états réels de l'app se succèdent : les prix montent,
   * la valorisation suit. Les crans accompagnent la montée des trois curseurs,
   * et le dernier tombe sur le basculement — voir `video/motion.mjs`.
   */
  { id: 'levers', len: 191, sfx: 'whoosh', ticks: { sound: 'click', from: 10, count: 12, spread: 74, ease: 'outCubic' } },
  { id: 'health', len: 162, sfx: 'riser', ticks: { sound: 'tick', from: 12, count: 10, spread: 86, ease: 'linear' } },
  { id: 'tiers', len: 152, sfx: 'whoosh', ticks: { sound: 'tick', from: 10, count: 5, spread: 70, ease: 'linear' } },
  { id: 'learn', len: 119, sfx: 'click' },
  { id: 'pad', len: 125, sfx: 'boom' },

  // Acte III — ce qu'il n'y a pas, puis ce qu'on demande.
  { id: 'free', len: 73, sfx: 'whoosh', ticks: { sound: 'tick', from: 6, count: 3, spread: 44, ease: 'linear' } },
  { id: 'cta', len: 318, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
