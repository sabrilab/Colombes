/**
 * « The two levers » — soixante-dix secondes sur le premier grain de la bible.
 *
 * Le montage n'est pas choisi au jugé : il découle de la voix off, qui dure
 * 65,27 s. Chaque plan commence exactement là où sa phrase commence, et ces
 * durées-là sont mesurées, pas estimées — `scripts/align-captions.mjs` les
 * imprime à partir de l'onde, il n'y a qu'à les recopier.
 *
 * La première version les avait estimées avant que le fichier arrive. L'écart
 * était de six dixièmes en moyenne, mais d'une seconde sept sur le pire plan :
 * la voix annonçait « doubler ton prix prend un après-midi » pendant qu'on
 * regardait encore la facture d'acquisition. Une estimation suffit à livrer un
 * film sous-titré ; elle ne suffit pas à le monter.
 *
 * Deux conséquences valent d'être dites, parce qu'elles ont dicté le découpage :
 *
 *  — l'accroche tient 229 images, soit sept secondes et demie, en un seul
 *    mouvement sans coupe. C'est long pour une ouverture, et c'est le but : on ne
 *    donne rien à lire tant que la croyance n'est pas installée à l'image ;
 *  — aucun plan ne dépasse huit secondes. Là où la voix tenait un même sujet plus
 *    longtemps — la facture d'acquisition, ou ce qui ressemble à du travail — le
 *    plan est coupé en deux plutôt qu'étiré. Une idée par plan, sinon le film
 *    devient plat, ce qui est exactement ce qu'on cherche à éviter.
 *
 * Voir `ladder.mjs` pour la forme de `ticks`.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 2100

export const SHOTS = [
  /*
   * L'accroche : dix mille clients qui fusent, puis s'ordonnent en grille.
   *
   * La croyance du grain — « il me faut plus de clients » — rendue littérale, et
   * jouée avant qu'un mot soit lu. Le compteur monte pendant tout le plan ; le
   * rangement n'occupe que le dernier tiers, parce que le désordre a besoin
   * d'autant de temps que la grille pour se lire.
   */
  { id: 'storm', len: 210, sfx: 'boom' },

  // Le retournement, en deux temps sur un seul plan.
  { id: 'instinct', len: 82, sfx: 'whoosh' },
  { id: 'not-a-line', len: 72, sfx: 'whoosh' },

  // La démonstration : une surface, et ses deux côtés.
  { id: 'surface', len: 119, sfx: 'riser' },
  { id: 'more-customers', len: 91, sfx: 'thud' },
  { id: 'more-price', len: 71, sfx: 'click' },
  { id: 'compare', len: 93, sfx: 'riser' },

  // Ce que coûte la voie chère. Quatre corvées, quatre crans.
  { id: 'chores', len: 138, sfx: 'whoosh', ticks: { sound: 'tick', from: 8, count: 4, spread: 88, ease: 'linear' } },
  { id: 'bill', len: 144, sfx: 'thud' },
  { id: 'before', len: 65, sfx: 'whoosh' },

  // L'autre levier, et l'objection qu'on lui oppose toujours.
  { id: 'afternoon', len: 124, sfx: 'click', ticks: { sound: 'click', from: 6, count: 18, spread: 64, ease: 'outCubic' } },
  { id: 'even-then', len: 127, sfx: 'whoosh' },
  { id: 'one-is-free', len: 89, sfx: 'boom' },

  // Pourquoi on tire quand même le mauvais.
  { id: 'looks-like-work', len: 199, sfx: 'whoosh', ticks: { sound: 'tick', from: 10, count: 2, spread: 100, ease: 'linear' } },
  { id: 'does-not', len: 72, sfx: 'click' },

  // Le pad, où les deux leviers tiennent sur la même plaque.
  { id: 'pad', len: 224, sfx: 'boom' },
  { id: 'closing', len: 180, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
