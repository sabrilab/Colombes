import React from 'react'
import { Composition } from 'remotion'
import { Colombes40 } from './Colombes40'
import { Colombes70 } from './Colombes70'
import { Ladder35 } from './Ladder35'
import { Remains35 } from './Remains35'
import { Built70 } from './Built70'
import { FPS, TOTAL_FRAMES } from './cuts/film70.mjs'
import { TOTAL_FRAMES as LADDER_FRAMES } from './cuts/ladder.mjs'
import { TOTAL_FRAMES as REMAINS_FRAMES } from './cuts/remains.mjs'
import { TOTAL_FRAMES as BUILT_FRAMES } from './cuts/built.mjs'
import './assets/fonts.css'
import './assets/base.css'

/**
 * 1080×1920 à 30 images par seconde, 1200 images : quarante secondes pile,
 * au format vertical des réseaux.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Colombes40"
        component={Colombes40}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Soixante-dix secondes, en anglais, montées pour le fil.

          Le son est un seul fichier, `public/film/mix-70s.mp3`, construit par
          `scripts/build-mix.mjs` : la voix off y est déjà compressée et mise au
          niveau, la musique s'écarte quand elle parle, et le bruitage tombe sur
          les coupes du montage. Empiler trois pistes ici les laisserait se
          masquer entre elles, et il faudrait rendre le film pour l'entendre. */}
      <Composition
        id="Colombes70"
        component={Colombes70}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sound: true }}
      />
      {/* Deux films courts sans voix off, portés par le rythme et le bruitage. Le
          son de leurs commandes est cranté sur le mouvement : voir video/motion.mjs. */}
      <Composition
        id="Ladder35"
        component={Ladder35}
        durationInFrames={LADDER_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sound: true }}
      />

      {/* La version rapide : caméra mobile, emojis, logos. Même durée que le film
          d'une minute dix, deux fois plus de mouvement. */}
      <Composition
        id="Built70"
        component={Built70}
        durationInFrames={BUILT_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sound: true }}
      />

      <Composition
        id="Remains35"
        component={Remains35}
        durationInFrames={REMAINS_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sound: true }}
      />
    </>
  )
}
