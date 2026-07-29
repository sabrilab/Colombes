/**
 * Le montage du film d'une minute dix, en un seul endroit.
 *
 * L'image et le son s'y lisent tous les deux : `Colombes70.tsx` associe un
 * composant à chaque `id`, `scripts/build-mix.mjs` place les effets sonores sur
 * les mêmes coupes. Tant que ce fichier reste l'unique source, un plan rallongé
 * déplace le bruit de coupe avec lui — l'erreur classique du montage à la main,
 * où le son reste sur l'ancienne image, devient impossible.
 *
 * Ce film-ci est porté par une voix off : les durées de plan sont donc calées sur
 * ses phrases, mesurées par `scripts/align-captions.mjs`. Les deux autres films
 * n'ont pas de voix et se règlent au rythme seul.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 2100

/**
 * `len` : durée du plan en images. `sfx` : l'effet joué sur sa coupe d'entrée.
 *
 * Le rythme est écrit dans ces nombres. Les plans de titre tiennent 40 à 60
 * images — le temps de lire, pas plus — et les plans de démonstration montent
 * à 110 : on ne comprend pas une mécanique en une seconde. Les plans d'animaux
 * servent de respiration entre deux actes, jamais de décoration.
 */
export const SHOTS = [
  // Acte 0 — l'accroche : le pad, tout de suite, rien d'autre.
  { id: 'pad', len: 96, sfx: 'boom' },
  { id: 'worth', len: 47, sfx: 'whoosh' },

  // Acte 1 — le chiffre emprunté, et le refus de l'expliquer.
  { id: 'borrowed', len: 107, sfx: 'thud' },
  { id: 'reasoning', len: 50, sfx: 'whoosh' },
  { id: 'animal-rabbit', len: 51, sfx: 'riser' },

  // Acte 2 — le revenu est une surface, et deux leviers la font grandir.
  { id: 'surface', len: 119, sfx: 'whoosh' },
  { id: 'sliders', len: 121, sfx: 'click' },
  { id: 'levers', len: 69, sfx: 'whoosh' },
  { id: 'which-animal', len: 64, sfx: 'riser' },

  // Acte 3 — l'échelle habitée, puis trois animaux nommés.
  { id: 'ladder', len: 106, sfx: 'whoosh' },
  { id: 'animal-mouse', len: 60, sfx: 'thud' },
  { id: 'animal-deer', len: 60, sfx: 'thud' },
  { id: 'animal-whale', len: 54, sfx: 'thud' },

  // Acte 4 — la molette : le prix décide du métier.
  { id: 'dial', len: 116, sfx: 'click' },
  { id: 'trade', len: 83, sfx: 'whoosh' },
  { id: 'not-enough', len: 67, sfx: 'whoosh' },

  // Acte 5 — la cascade : ce qui reste au fond.
  { id: 'cascade-dials', len: 130, sfx: 'click' },
  { id: 'remains', len: 89, sfx: 'thud' },
  { id: 'no-profit', len: 56, sfx: 'whoosh' },

  // Acte 6 — les neuf lignes, et tout ce qu'on peut nommer.
  { id: 'buildup', len: 155, sfx: 'riser' },
  { id: 'named-lines', len: 78, sfx: 'click' },
  { id: 'modules', len: 93, sfx: 'whoosh' },

  /*
   * Chute — 229 images, qui commencent à 62,37 s.
   *
   * Ce n'est pas un chiffre rond par hasard : c'est l'instant où la voix dit
   * « Colombes ». Le premier montage plaçait ici un cinquième animal, et le nom
   * de la marque tombait donc sur un éléphant pendant que le mot était
   * prononcé. Une chute qui ne coïncide pas avec sa phrase ne conclut rien.
   */
  { id: 'closing', len: 229, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
