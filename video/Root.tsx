import React from 'react'
import { Composition } from 'remotion'
import { Colombes40 } from './Colombes40'
import './assets/fonts.css'
import './assets/base.css'

/**
 * 1080×1920 à 30 images par seconde, 1200 images : quarante secondes pile,
 * au format vertical des réseaux.
 */
export function RemotionRoot() {
  return (
    <Composition
      id="Colombes40"
      component={Colombes40}
      durationInFrames={1200}
      fps={30}
      width={1080}
      height={1920}
    />
  )
}
