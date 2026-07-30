/**
 * « Anyone can build it now » — soixante-dix secondes, la version rapide.
 *
 * Le récit a changé d'angle. Les autres films expliquent une mécanique ; celui-ci
 * part de ce qui vient de basculer — écrire du code n'est plus le verrou — et
 * amène la question qui le remplace : ce que ça vaut.
 *
 * D'où un montage nettement plus court en moyenne : dix-neuf plans pour 2 100
 * images, avec trois plans de caméra mobile qui portent le mouvement à eux seuls.
 *
 * Les durées ne sont pas choisies au jugé : elles découlent de la voix off, qui
 * dure 57,75 secondes et entre à la quatrième. Chaque plan commence là où sa
 * phrase commence — les positions sont estimées au prorata des caractères
 * prononcés, la même règle que `scripts/align-captions.mjs` applique ensuite sur
 * l'onde réelle. La chute tombe donc sur le mot « Colombes », ce qui est le seul
 * calage qu'on n'a pas le droit de rater.
 *
 * Voir `ladder.mjs` pour la forme de `ticks`.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 2100

export const SHOTS = [
  /*
   * Acte I — le monde d'après.
   *
   * On ouvre sur du mouvement pur : la caméra traverse un couloir d'anneaux
   * pendant près de six secondes, et la voix n'entre qu'à la quatrième. Rien à
   * lire, rien à comprendre — juste le rythme du film qui s'installe.
   */
  { id: 'tunnel', len: 172, sfx: 'riser' },
  { id: 'claude', len: 56, sfx: 'boom' },
  { id: 'anything', len: 44, sfx: 'whoosh' },
  // Cinq écrans, cinq crans : les emojis arrivent au rythme du son.
  { id: 'platforms', len: 135, sfx: 'whoosh', ticks: { sound: 'click', from: 12, count: 5, spread: 62, ease: 'linear' } },
  { id: 'swarm', len: 54, sfx: 'riser' },

  // Acte II — le retournement.
  { id: 'easy', len: 64, sfx: 'whoosh' },
  { id: 'worth', len: 76, sfx: 'boom' },
  { id: 'borrowed', len: 128, sfx: 'thud' },

  // Acte III — le pad, l'objet qu'on reconnaît en défilant.
  { id: 'pad', len: 169, sfx: 'boom' },
  { id: 'surface', len: 140, sfx: 'whoosh' },

  /*
   * Acte IV — la volière.
   *
   * La caméra descend une allée d'animaux en volume. C'est ce qu'on retient d'un
   * film, et ça ne se lit pas en deux secondes.
   */
  { id: 'aviary', len: 127, sfx: 'riser' },
  { id: 'mouse', len: 62, sfx: 'thud' },
  { id: 'whale', len: 46, sfx: 'thud' },
  { id: 'logos', len: 54, sfx: 'whoosh', ticks: { sound: 'tick', from: 4, count: 4, spread: 30, ease: 'linear' } },

  // Acte V — ce qui reste.
  { id: 'dial', len: 91, sfx: 'click', ticks: { sound: 'click', from: 6, count: 18, spread: 56, ease: 'outCubic' } },
  { id: 'cascade', len: 145, sfx: 'thud', ticks: { sound: 'thud', from: 18, count: 3, spread: 74, ease: 'linear' } },
  { id: 'multiple', len: 103, sfx: 'riser', ticks: { sound: 'tick', from: 6, count: 9, spread: 56, ease: 'linear' } },

  /*
   * Acte VI — la chute.
   *
   * Dix secondes, et c'est assumé : la voix se tait à 61,75 s, la musique monte,
   * et la marque tient l'image jusqu'au bout. Une vidéo de fil se relance en
   * boucle, et c'est cette fin-là qu'on revoit à chaque tour.
   */
  { id: 'hard', len: 130, sfx: 'boom' },
  { id: 'closing', len: 304, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
