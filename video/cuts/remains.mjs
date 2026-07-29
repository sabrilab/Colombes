/**
 * « What actually remains » — trente-cinq secondes sur la cascade et le multiple.
 *
 * Le sujet le plus contre-intuitif de l'app : douze mille euros de revenu ne font
 * pas douze mille euros de revenu pour vous. Un texte le dit mal ; un volume qu'on
 * découpe le dit tout seul, et le son fait le reste — chaque prélèvement tombe
 * avec son impact, chaque ligne du multiple avec son cran.
 *
 * Voir `ladder.mjs` pour la forme de `ticks`.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 1050

export const SHOTS = [
  // L'accroche : le revenu, énorme et rassurant. Puis le doute.
  { id: 'hook-mrr', len: 120, sfx: 'boom' },
  { id: 'title', len: 55, sfx: 'whoosh' },

  /*
   * La colonne en volume, dont trois tranches s'échappent.
   *
   * Trois impacts seulement, mais espacés : un prélèvement doit avoir le temps de
   * se lire avant le suivant, sinon les trois n'en font qu'un et le spectateur
   * retient « il en reste peu » au lieu de « voilà qui prend quoi ».
   */
  { id: 'column', len: 210, sfx: 'riser', ticks: { sound: 'thud', from: 26, count: 3, spread: 96, ease: 'linear' } },

  // Les barres de réglage de l'app, poussées par crans audibles.
  { id: 'sliders', len: 150, sfx: 'click', ticks: { sound: 'tick', from: 8, count: 24, spread: 96, ease: 'outCubic' } },

  // Ce qui reste au fond, seul à l'image.
  { id: 'remains', len: 120, sfx: 'thud' },

  /*
   * Les neuf lignes en volume, qui montent une à une. Neuf crans : c'est le plan
   * où le son porte le sens — on entend qu'il y en a neuf sans les compter.
   */
  { id: 'multiple', len: 205, sfx: 'riser', ticks: { sound: 'tick', from: 12, count: 9, spread: 108, ease: 'linear' } },

  { id: 'closing', len: 190, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
