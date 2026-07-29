import React from 'react'
import { Composition } from 'remotion'
import { Colombes40 } from './Colombes40'
import { Colombes70 } from './Colombes70'
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

      {/* Soixante-dix secondes, en anglais, montées pour le fil. La voix off
          se branche par `voiceOver` quand public/voice-en.mp3 existe. */}
      <Composition
        id="Colombes70"
        component={Colombes70}
        durationInFrames={2100}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ voiceOver: false }}
      />
    </>
  )
}
