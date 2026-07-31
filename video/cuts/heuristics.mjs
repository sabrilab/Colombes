/**
 * « Six rules of thumb » — soixante-dix secondes adressées à quelqu'un.
 *
 * Le montage suit une progression précise, et c'est elle qui explique les durées :
 *
 *  — sept secondes d'accroche sans une coupe, où l'on survole un relief et où le
 *    spectateur se voit posé dessus avant qu'un mot soit dit. « Tu es ici » est la
 *    première chose lisible du film, et ce n'est pas un hasard : ce qui intéresse
 *    le plus quelqu'un, c'est lui ;
 *  — puis une descente rapide vers le silence devant la question — trois plans
 *    courts, dont un de cinquante images. Le film ne s'attarde pas sur le malaise,
 *    il l'annule ;
 *  — six plans d'une à trois secondes pour les six règles, enchaînés au son. C'est
 *    la partie la plus rapide du film parce que c'est celle qui donne : on ne fait
 *    pas attendre quelqu'un à qui on offre quelque chose ;
 *  — et un seul plan long, la carte, où l'on s'arrête. Il porte deux répliques et
 *    c'est le seul du film : le retournement a besoin d'un endroit où se poser.
 *
 * Les durées viennent de la voix off, pas d'un jugement à l'œil. Elles sont pour
 * l'instant *estimées* — 215 mots au débit mesuré sur les deux voix précédentes —
 * parce que le fichier n'est pas encore là. `scripts/align-captions.mjs` imprime
 * ces dix-neuf durées ; le jour où l'onde arrive, il imprime les vraies et il n'y
 * a qu'à les recopier. L'écart constaté sur le film précédent était de six
 * dixièmes en moyenne : suffisant pour livrer, pas pour prétendre que c'est calé.
 *
 * Voir `ladder.mjs` pour la forme de `ticks`.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 2100

export const SHOTS = [
  /*
   * L'accroche : un relief de nuit, et une bille de lumière posée dessus.
   *
   * Sept secondes en un seul mouvement de caméra. La voix n'entre qu'à la
   * quatrième : les trois premières ne servent qu'à donner envie de rester.
   */
  { id: 'you', len: 216, sfx: 'riser' },

  // Le silence devant la question, et son démenti immédiat.
  { id: 'quiet', len: 85, sfx: 'whoosh' },
  { id: 'not-a-gap', len: 50, sfx: 'click' },
  { id: 'nobody-computes', len: 108, sfx: 'thud' },
  { id: 'estimate', len: 61, sfx: 'whoosh' },

  // Les six règles, annoncées puis données une par une.
  { id: 'six', len: 79, sfx: 'riser', ticks: { sound: 'tick', from: 6, count: 6, spread: 44, ease: 'linear' } },
  { id: 'churn', len: 56, sfx: 'click', ticks: { sound: 'click', from: 5, count: 10, spread: 34, ease: 'outCubic' } },
  { id: 'nrr', len: 94, sfx: 'tick', ticks: { sound: 'tick', from: 8, count: 12, spread: 48, ease: 'outCubic' } },
  { id: 'ltv-cac', len: 81, sfx: 'click', ticks: { sound: 'click', from: 6, count: 9, spread: 42, ease: 'outCubic' } },
  { id: 'payback', len: 67, sfx: 'tick', ticks: { sound: 'tick', from: 6, count: 12, spread: 38, ease: 'outCubic' } },
  { id: 'margin', len: 48, sfx: 'click', ticks: { sound: 'click', from: 4, count: 8, spread: 28, ease: 'outCubic' } },
  { id: 'rule-of-40', len: 58, sfx: 'tick', ticks: { sound: 'tick', from: 5, count: 10, spread: 36, ease: 'outCubic' } },

  // Ce que les six changent, sur la même entreprise.
  { id: 'worth-twice', len: 139, sfx: 'boom', ticks: { sound: 'thud', from: 16, count: 2, spread: 56, ease: 'linear' } },

  // Le conseil qu'on lui a donné, et le soupçon qu'il avait raison d'avoir.
  { id: 'lazy-advice', len: 125, sfx: 'whoosh' },
  { id: 'you-were-right', len: 132, sfx: 'riser' },

  // La peur, puis la carte : le seul plan long du film.
  { id: 'fear', len: 127, sfx: 'thud' },
  { id: 'map', len: 152, sfx: 'riser' },

  // L'app, et ce qu'on lui demande de faire ensuite.
  { id: 'pad', len: 118, sfx: 'boom' },
  { id: 'today', len: 88, sfx: 'whoosh' },
  { id: 'closing', len: 216, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
