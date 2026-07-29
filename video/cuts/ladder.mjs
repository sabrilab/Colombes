/**
 * « Which animal are you » — trente-cinq secondes sur l'échelle des prix.
 *
 * Pas de voix off ici : le film se tient par le rythme, la typographie et le son.
 * C'est ce qui change tout dans l'écriture — chaque plan doit se comprendre sans
 * commentaire, donc il montre une seule chose, et les `ticks` remplacent la parole
 * pour dire qu'il se passe quelque chose.
 *
 * `ticks` sonorise une rampe crantée : `from` l'image de départ dans le plan,
 * `count` le nombre de crans, `spread` la durée de la rampe, `ease` son
 * accélération. `../motion.mjs` en déduit les images exactes, et le plan lit la
 * même fonction pour savoir combien de crans sont franchis — le clic tombe donc
 * sur le cran qu'on voit.
 */

import { FPS, timeline } from './shared.mjs'

export { FPS }
export const TOTAL_FRAMES = 1050

export const SHOTS = [
  /*
   * L'accroche est la molette, lancée d'un coup.
   *
   * Dix-huit crans en deux secondes et demie, accélération sortante : ça part
   * vite et ça se pose. Le prix traverse les cinq paliers pendant que le nom de
   * l'animal change sous lui — la démonstration entière est là, avant qu'un mot
   * soit lu.
   */
  { id: 'hook-dial', len: 130, sfx: 'boom', ticks: { sound: 'click', from: 10, count: 18, spread: 76, ease: 'outCubic' } },
  { id: 'title', len: 60, sfx: 'whoosh' },

  /*
   * L'escalier en volume, marche par marche : cinq impacts, un par palier.
   *
   * Le compte est écrit en clair et non déduit de `PRICING_ANIMALS` : ce fichier est
   * lu par Node pour construire le mixage, et Node ne sait pas charger un module
   * TypeScript. `Ladder35.tsx` vérifie de son côté que les deux concordent.
   */
  { id: 'stairs', len: 190, sfx: 'riser', ticks: { sound: 'thud', from: 14, count: 5, spread: 70, ease: 'outCubic' } },

  // Les deux extrêmes, en vraie 3D.
  { id: 'mouse', len: 110, sfx: 'thud' },
  { id: 'whale', len: 110, sfx: 'thud' },

  // Ce que le prix décide vraiment. Un cran par ligne du tableau.
  { id: 'trade', len: 150, sfx: 'whoosh', ticks: { sound: 'tick', from: 6, count: 3, spread: 30, ease: 'linear' } },

  /*
   * Le schéma qui justifie tout le film : deux volumes de même contenance, l'un
   * large et plat, l'autre étroit et haut. Même revenu, pas la même entreprise.
   */
  { id: 'same-money', len: 140, sfx: 'riser' },

  { id: 'closing', len: 160, sfx: 'riser' },
]

export const TIMELINE = timeline(SHOTS, TOTAL_FRAMES)
