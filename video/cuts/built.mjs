/**
 * « Anyone can build it now » — soixante-dix secondes, la version rapide.
 *
 * Le récit a changé d'angle. Les autres films expliquent une mécanique ; celui-ci
 * part de ce qui vient de basculer — écrire du code n'est plus le verrou — et
 * amène la question qui le remplace : ce que ça vaut.
 *
 * D'où un montage nettement plus court en moyenne : dix-neuf plans pour 2 100
 * images, contre vingt-trois au film précédent mais avec trois plans de caméra
 * mobile qui portent le mouvement à eux seuls. Un plan de titre tient 70 à 95
 * images — le temps de lire, pas plus.
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
   * On ouvre sur du mouvement pur, sans un mot : la caméra traverse un couloir
   * d'anneaux. Trois secondes pour installer le rythme du film, et rien à lire.
   */
  { id: 'tunnel', len: 115, sfx: 'riser' },
  { id: 'claude', len: 85, sfx: 'boom' },
  { id: 'anything', len: 70, sfx: 'whoosh' },
  // Cinq écrans, cinq crans : les emojis arrivent au rythme du son.
  { id: 'platforms', len: 105, sfx: 'whoosh', ticks: { sound: 'click', from: 12, count: 5, spread: 52, ease: 'linear' } },
  { id: 'swarm', len: 115, sfx: 'riser' },

  // Acte II — le retournement.
  { id: 'easy', len: 75, sfx: 'whoosh' },
  { id: 'worth', len: 95, sfx: 'boom' },
  { id: 'borrowed', len: 100, sfx: 'thud' },

  // Acte III — le pad, l'objet qu'on reconnaît en défilant.
  { id: 'pad', len: 140, sfx: 'boom' },
  { id: 'surface', len: 100, sfx: 'whoosh' },

  /*
   * Acte IV — la volière.
   *
   * Le plan le plus long du film, et le seul qui le mérite : la caméra descend
   * une allée d'animaux en volume. C'est ce qu'on retient d'un film, et ça ne se
   * lit pas en deux secondes.
   */
  { id: 'aviary', len: 170, sfx: 'riser' },
  { id: 'mouse', len: 75, sfx: 'thud' },
  { id: 'whale', len: 75, sfx: 'thud' },
  { id: 'logos', len: 100, sfx: 'whoosh', ticks: { sound: 'tick', from: 8, count: 4, spread: 40, ease: 'linear' } },

  // Acte V — ce qui reste, en trois plans au lieu de six.
  { id: 'dial', len: 110, sfx: 'click', ticks: { sound: 'click', from: 8, count: 18, spread: 66, ease: 'outCubic' } },
  { id: 'cascade', len: 130, sfx: 'thud', ticks: { sound: 'thud', from: 18, count: 3, spread: 66, ease: 'linear' } },
  { id: 'multiple', len: 120, sfx: 'riser', ticks: { sound: 'tick', from: 8, count: 9, spread: 62, ease: 'linear' } },

  // Acte VI — la chute.
  { id: 'hard', len: 90, sfx: 'boom' },
  { id: 'closing', len: 230, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
