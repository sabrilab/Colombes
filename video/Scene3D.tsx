import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { DEFAULT_TARGET, poseAt, type CameraMove } from './three'

/**
 * Une scène en trois dimensions, rendue image par image.
 *
 * Trois choses la distinguent d'un canevas Three ordinaire, et chacune répond à
 * un piège qui ne se signale pas :
 *
 *  — la pose est une fonction du numéro d'image, jamais d'une horloge. Remotion
 *    capture des instants isolés, souvent dans plusieurs onglets à la fois, et
 *    un `requestAnimationFrame` donnerait une image différente à chaque capture ;
 *  — le rendu va dans une toile gardée hors du document, puis est recopié sur une
 *    toile 2D visible. Une toile WebGL posée dans le document revient vide de la
 *    photo que prend Remotion : le compositeur a déjà rendu sa mémoire ;
 *  — la construction de la scène suspend la capture par `delayRender`. Sans ça
 *    Remotion photographie une scène vide, et on s'en aperçoit à la fin du rendu.
 *
 * `build` et `update` sont lus dans des références : ces fonctions sont écrites
 * en ligne à l'appel, donc leur identité change à chaque image, et les mettre en
 * dépendance reconstruirait la scène trente fois par seconde.
 */

interface Rig {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  lens: THREE.PerspectiveCamera
  paint: CanvasRenderingContext2D
  source: HTMLCanvasElement
}

export function Scene3D({
  width,
  height,
  camera,
  build,
  update,
  style,
}: {
  width: number
  height: number
  camera: CameraMove
  /** Construit la scène, une fois. La capture attend la promesse. */
  build: (scene: THREE.Scene) => void | Promise<void>
  /** Appelé avant chaque rendu. `progress` va de 0 à 1 sur la durée du plan. */
  update: (frame: number, progress: number, scene: THREE.Scene) => void
  style?: React.CSSProperties
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rigRef = useRef<Rig | null>(null)
  const [ready, setReady] = useState(false)

  const frame = useCurrentFrame()
  // `Sequence` redéfinit cette durée : on obtient celle du plan, pas du film.
  const { durationInFrames } = useVideoConfig()

  const buildRef = useRef(build)
  buildRef.current = build
  const updateRef = useRef(update)
  updateRef.current = update
  const frameRef = useRef(frame)
  frameRef.current = frame
  const cameraRef = useRef(camera)
  cameraRef.current = camera
  /** Lue dans l'effet de construction, qui ne doit pas se relancer quand elle change. */
  const durationRef = useRef(durationInFrames)
  durationRef.current = durationInFrames

  useEffect(() => {
    const visible = canvasRef.current
    if (!visible) return
    const paint = visible.getContext('2d')
    if (!paint) return

    const handle = delayRender('construction de la scène 3D')

    const source = document.createElement('canvas')
    source.width = width
    source.height = height

    const renderer = new THREE.WebGLRenderer({
      canvas: source,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(1)
    renderer.setSize(width, height, false)

    const scene = new THREE.Scene()
    // La focale de départ suffit à créer l'objectif : la pose complète est
    // réappliquée à chaque image, y compris la focale si le plan la fait varier.
    const lens = new THREE.PerspectiveCamera(35, width / height, 0.1, 200)

    const rig: Rig = { renderer, scene, lens, paint, source }

    void Promise.resolve(buildRef.current(scene))
      .then(() => {
        rigRef.current = rig
        // Premier tracé avant de libérer la capture : `setReady` est asynchrone,
        // et Remotion photographierait la toile encore vide.
        paintScene(rig, frameRef.current, durationRef.current, cameraRef.current, updateRef.current)
        setReady(true)
      })
      .catch((error) => {
        // Un échec silencieux donnerait un plan noir qu'on ne remarquerait qu'au
        // montage final.
        console.error('scène 3D inconstructible', error)
      })
      .finally(() => continueRender(handle))

    return () => {
      renderer.dispose()
    }
    // La scène ne se reconstruit que si la toile change de taille : tout le reste
    // — pose de caméra, contenu — est réappliqué image par image.
  }, [width, height])

  /**
   * Le tracé passe par un effet de mise en page, pas par un effet différé :
   * Remotion capture dès que la page est peinte, et un effet passif peut tomber
   * après — la scène aurait alors une image de retard sur tout le reste.
   */
  useLayoutEffect(() => {
    const rig = rigRef.current
    if (!rig || !ready) return
    paintScene(rig, frame, durationInFrames, cameraRef.current, updateRef.current)
  })

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: 'block', ...style }}
    />
  )
}

/** Pose de caméra, mise à jour, rendu, recopie — dans cet ordre, à chaque image. */
function paintScene(
  rig: Rig,
  frame: number,
  durationInFrames: number,
  camera: CameraMove,
  update: (frame: number, progress: number, scene: THREE.Scene) => void,
) {
  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0

  const pose = poseAt(camera, progress, frame)
  rig.lens.position.set(...pose.position)
  rig.lens.lookAt(new THREE.Vector3(...(pose.target ?? DEFAULT_TARGET)))
  if (rig.lens.fov !== (pose.fov ?? 35)) {
    rig.lens.fov = pose.fov ?? 35
    rig.lens.updateProjectionMatrix()
  }

  update(frame, progress, rig.scene)
  rig.renderer.render(rig.scene, rig.lens)
  rig.paint.clearRect(0, 0, rig.source.width, rig.source.height)
  rig.paint.drawImage(rig.source, 0, 0)
}
