/**
 * Le montage, en un seul endroit.
 *
 * L'image et le son se lisent ici tous les deux : `Colombes70.tsx` associe un
 * composant à chaque `id`, `scripts/build-mix.mjs` place les effets sonores sur
 * les mêmes coupes. Tant que ce fichier reste l'unique source, un plan rallongé
 * déplace le bruit de coupe avec lui — l'erreur classique du montage à la main,
 * où le son reste sur l'ancienne image, devient impossible.
 *
 * Les durées sont en images, jamais en secondes : à 30 images par seconde une
 * coupe à 2,37 s n'existe pas, et arrondir deux fois fait dériver la fin.
 */

export const FPS = 30
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

/** Le plan avec son image de départ, pour ne l'additionner qu'une fois. */
export const TIMELINE = SHOTS.reduce((list, shot) => {
  const previous = list[list.length - 1]
  list.push({ ...shot, at: previous ? previous.at + previous.len : 0 })
  return list
}, [])

const measured = TIMELINE[TIMELINE.length - 1]
const end = measured.at + measured.len
if (end !== TOTAL_FRAMES) {
  // Un montage qui ne tombe pas juste laisse du noir ou coupe la chute : mieux
  // vaut refuser de construire que livrer une fin tronquée.
  throw new Error(`Le montage fait ${end} images au lieu de ${TOTAL_FRAMES}.`)
}
