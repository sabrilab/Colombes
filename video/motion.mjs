/**
 * Le mouvement cranté, décrit une fois pour l'image et pour le son.
 *
 * Une molette qui claque, une barre qui monte par paliers : le bruit doit tomber
 * sur le cran qu'on voit, pas à côté. Poser les sons à la main marche pour trois
 * crans et se décale dès qu'on change l'accélération — et l'erreur ne s'entend
 * qu'après dix minutes de rendu.
 *
 * D'où ces deux fonctions, lues des deux côtés : `stepsPassed` donne à l'image le
 * nombre de crans franchis à une image donnée, `stepFrames` donne au mixage les
 * images où ils tombent. Les deux dérivent de la même formule, donc elles ne
 * peuvent pas se contredire.
 */

export const EASINGS = {
  linear: (t) => t,
  /** L'accélération signature de l'app : départ franc, arrivée posée. */
  outCubic: (t) => 1 - (1 - t) ** 3,
  outQuint: (t) => 1 - (1 - t) ** 5,
  inOutCubic: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  /** Un départ lent puis une ruée : pour une rampe qui doit surprendre. */
  inCubic: (t) => t ** 3,
}

/**
 * Le nombre de crans franchis, vu de l'image `frame` du plan.
 *
 * `from` est l'image de départ dans le plan, `spread` la durée de la rampe,
 * `count` le nombre de crans.
 */
export function stepsPassed(frame, { from = 0, count, spread, ease = 'outCubic' }) {
  const progress = Math.min(1, Math.max(0, (frame - from) / spread))
  return Math.min(count, Math.floor(EASINGS[ease](progress) * count))
}

/**
 * La rampe crantée d'un plan, lue dans le montage.
 *
 * Les plans la déclaraient de leur côté, à l'identique du fichier de montage : deux
 * écritures du même réglage, donc une désynchronisation qui n'attendait qu'une
 * retouche. Ici le montage est seul à en décider, et un plan qui l'oublierait refuse
 * de se construire plutôt que de sonner à côté.
 */
export function ticksOf(timeline, id) {
  const shot = timeline.find((candidate) => candidate.id === id)
  if (!shot) throw new Error(`Aucun plan « ${id} » dans ce montage.`)
  if (!shot.ticks) throw new Error(`Le plan « ${id} » n'a pas de rampe crantée.`)
  return shot.ticks
}

/**
 * Les images auxquelles les crans tombent, dans le repère du plan.
 *
 * On échantillonne la rampe image par image et on relève les franchissements plutôt
 * que d'inverser l'accélération : c'est exactement ce que `stepsPassed` calcule, donc
 * les deux listes coïncident par construction. Un cran sauté par l'image ne peut pas
 * produire de son, et l'inverse non plus.
 */
export function stepFrames(spec) {
  const { from = 0, spread } = spec
  const frames = []
  let passed = 0

  for (let frame = from; frame <= from + spread; frame++) {
    const target = stepsPassed(frame, spec)
    while (passed < target) {
      passed++
      frames.push(frame)
    }
  }

  return frames
}
