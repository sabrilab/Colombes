import React, { useRef } from 'react'
import type * as THREE from 'three'
import { Scene3D } from './Scene3D'
import { loadAnimal, standardLights, type CameraSpec } from './three'

/**
 * Un animal de Janz qui tourne, cadré comme dans l'app.
 *
 * Toute la mécanique délicate — pose déduite du numéro d'image, toile gardée hors
 * du document, attente du modèle — vit dans `Scene3D`. Il ne reste ici que le
 * cadrage et le balayage.
 */

/** Reprise exacte de la scène de l'app, pour que l'animal soit le même. */
const CAMERA: CameraSpec = { position: [0, 1.05, 2.8], fov: 35 }
const THREE_QUARTER_YAW = Math.PI / 7

export function AnimalShot({
  animal,
  size = 880,
  /** Fraction de tour parcourue sur le plan, à cheval sur la pose héros. */
  turns = 0.3,
}: {
  animal: string
  size?: number
  turns?: number
}) {
  const pivotRef = useRef<THREE.Group | null>(null)

  return (
    <Scene3D
      width={size}
      height={size}
      camera={CAMERA}
      build={async (scene) => {
        standardLights(scene)
        const pivot = await loadAnimal(animal)
        pivotRef.current = pivot
        scene.add(pivot)
      }}
      update={(_frame, progress) => {
        // Le balayage est centré sur la vue trois-quarts : l'animal la traverse
        // au milieu du plan au lieu de partir d'elle et de finir de dos.
        if (pivotRef.current) {
          pivotRef.current.rotation.y = THREE_QUARTER_YAW + (progress - 0.5) * turns * Math.PI * 2
        }
      }}
    />
  )
}
