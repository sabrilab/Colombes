import React from 'react'
import { Composition } from 'remotion'
import { Colombes40 } from './Colombes40'
import { Colombes70 } from './Colombes70'
import { FPS, TOTAL_FRAMES } from './cut.mjs'
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
          les coupes de `cut.mjs`. Empiler trois pistes ici les laisserait se
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
    </>
  )
}
