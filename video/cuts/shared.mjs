/**
 * Ce que trois montages ont en commun.
 *
 * Un montage est une liste de plans avec leur durée en images — jamais en
 * secondes : à 30 images par seconde une coupe à 2,37 s n'existe pas, et arrondir
 * deux fois fait dériver la fin. Le fichier de chaque film déclare ses plans,
 * `timeline()` en calcule les instants une seule fois, et l'image comme le son y
 * lisent la même chose.
 *
 * Un plan porte :
 *   `id`    l'identifiant, auquel la composition associe un composant ;
 *   `len`   sa durée en images ;
 *   `sfx`   le bruit joué sur sa coupe d'entrée ;
 *   `ticks` une rampe crantée à sonoriser — voir `../motion.mjs`.
 */

export const FPS = 30

/**
 * Les plans avec leur image de départ, additionnée une seule fois.
 *
 * La vérification du total n'est pas un luxe : un montage qui ne tombe pas juste
 * laisse du noir en fin de film ou coupe la chute, et rien dans le rendu ne le
 * signale. Mieux vaut refuser de construire.
 */
export function timeline(shots, totalFrames) {
  const laid = shots.reduce((list, shot) => {
    const previous = list[list.length - 1]
    list.push({ ...shot, at: previous ? previous.at + previous.len : 0 })
    return list
  }, [])

  const last = laid[laid.length - 1]
  const end = last.at + last.len
  if (end !== totalFrames) {
    throw new Error(`Le montage fait ${end} images au lieu de ${totalFrames}.`)
  }

  return laid
}
