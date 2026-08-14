/**
 * Toucher ou glisser : la différence, et pourquoi elle mérite son fichier.
 *
 * Un doigt ne se pose jamais deux fois au même pixel. Entre le contact et le
 * relâchement il parcourt toujours un ou deux points, si bien qu'un code qui
 * dit « il a bougé, donc il glisse » conclut que **rien n'est jamais un
 * contact** — et sur un téléphone, plus rien ne s'ouvre. Une souris pardonne ce
 * défaut, un doigt non, et c'est exactement le genre de bogue qu'on ne voit pas
 * en développant sur un écran d'ordinateur.
 *
 * D'où cette fonction de trois lignes, sortie du composant : c'est une décision,
 * elle se teste, et sa valeur de seuil se discute au grand jour. Huit pixels
 * correspondent au tremblement ordinaire d'un pouce ; en deçà, l'intention
 * était de désigner.
 */

export interface Point {
  x: number
  y: number
}

/** Le tremblement admis avant qu'un contact devienne un glissement, en pixels. */
export const TAP_SLOP = 8

export function isTap(from: Point, to: Point, slop = TAP_SLOP): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) < slop
}
