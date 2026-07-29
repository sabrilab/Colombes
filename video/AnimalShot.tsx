import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * Un animal de Janz en vraie 3D, mais rendu image par image.
 *
 * La scène de l'app pilote sa rotation par `requestAnimationFrame` : dans
 * Remotion, qui capture des instants isolés, cette horloge donnerait une pose
 * aléatoire à chaque image et l'animal tremblerait. Ici la rotation est une
 * fonction du numéro d'image, et le rendu est déclenché à la main — deux
 * captures du même instant donnent donc exactement la même pose.
 *
 * Le chargement du modèle suspend la capture via `delayRender` : sans ça
 * Remotion photographierait une toile vide et on ne s'en apercevrait qu'au
 * bout des dix minutes de rendu.
 */

/**
 * Les modèles passent par `staticFile` et non par un chemin absolu : au rendu,
 * Remotion sert `public/` derrière une origine qui lui est propre, et un
 * `/models/...` écrit à la main tombe à côté — le chargement échoue en silence,
 * et la toile reste vide sans qu'aucune erreur ne remonte.
 */
const MODEL_FILES: Record<string, string> = {
  Mice: 'models/mouse.glb',
  Rabbits: 'models/rabbit.glb',
  Deer: 'models/deer.glb',
  Elephants: 'models/elephant.glb',
  Whales: 'models/whale.glb',
}

/** Reprises exactes de la scène de l'app, pour que l'animal soit le même. */
const CAMERA_POSITION = new THREE.Vector3(0, 1.05, 2.8)
const THREE_QUARTER_YAW = Math.PI / 7
const DEFAULT_BASE_YAW = (3 * Math.PI) / 2
const BASE_YAW_OVERRIDES: Record<string, number> = { Deer: Math.PI }

/**
 * Le rayon visé dans le cadre.
 *
 * À cette caméra, la demi-hauteur visible vaut 0,94 unité : au-delà, l'animal
 * sort de l'image. L'app monte à 1,15 parce que sa scène est rognée par la
 * carte qui l'accueille ; ici le plan est plein écran et l'animal doit tenir en
 * entier, queue comprise.
 */
const FIT_RADIUS = 0.75

/** La souris a une longue queue qui gonfle sa sphère englobante : le corps
    paraîtrait deux fois trop petit sans ce rattrapage. */
const SIZE_TWEAK: Record<string, number> = { Mice: 1.15 }

/**
 * La pose de l'animal à une image donnée : une fonction, pas une horloge.
 *
 * C'est tout l'écart avec la scène de l'app, qui tourne au `requestAnimationFrame` :
 * Remotion capture des instants isolés, souvent dans plusieurs onglets à la fois,
 * et une pose tirée du temps réel donnerait une image différente à chaque capture.
 */
function poseAt(frame: number, duration: number, turns: number): number {
  const progress = duration > 1 ? frame / (duration - 1) : 0
  // Le balayage est centré sur la vue trois-quarts de l'app : l'animal la
  // traverse au milieu du plan au lieu de partir d'elle et de finir de dos.
  return THREE_QUARTER_YAW + (progress - 0.5) * turns * Math.PI * 2
}

/** Le plus gros maillage donne le cadre : un nœud parasite lointain le fausserait. */
function framingBox(group: THREE.Object3D): THREE.Box3 {
  let box: THREE.Box3 | null = null
  let biggest = -1

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) return
    const candidate = new THREE.Box3().setFromObject(child)
    const size = candidate.getSize(new THREE.Vector3())
    const volume = size.x * size.y * size.z
    if (volume > biggest) {
      biggest = volume
      box = candidate
    }
  })

  return box ?? new THREE.Box3().setFromObject(group)
}

interface Stage {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  pivot: THREE.Group
  /** La toile 2D visible, sur laquelle on recopie le rendu. */
  paint: CanvasRenderingContext2D
  /** La toile WebGL, hors du document. */
  source: HTMLCanvasElement
}

/** Pose, rendu, puis recopie sur la toile visible — dans cet ordre, à chaque image. */
function draw(stage: Stage, frame: number, duration: number, turns: number) {
  stage.pivot.rotation.y = poseAt(frame, duration, turns)
  stage.renderer.render(stage.scene, stage.camera)
  stage.paint.clearRect(0, 0, stage.source.width, stage.source.height)
  stage.paint.drawImage(stage.source, 0, 0)
}

export function AnimalShot({
  animal,
  size = 900,
  /** Fraction de tour parcourue sur la durée du plan, à cheval sur la pose héros. */
  turns = 0.3,
}: {
  animal: string
  size?: number
  turns?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<Stage | null>(null)
  const [ready, setReady] = useState(false)
  const frame = useCurrentFrame()
  // `Sequence` redéfinit cette durée : on obtient donc la longueur du plan, pas
  // celle du film, et la rotation se répartit sur le plan.
  const { durationInFrames } = useVideoConfig()

  /** L'image courante, lisible depuis le rappel de chargement. */
  const frameRef = useRef(frame)
  frameRef.current = frame

  // Montage de la scène et chargement du modèle, une fois.
  useEffect(() => {
    const visible = canvasRef.current
    if (!visible) return
    const paint = visible.getContext('2d')
    if (!paint) return
    const handle = delayRender(`chargement du modèle ${animal}`)

    /*
     * Trois dispositions pour que l'animal survive à la capture.
     *
     * Remotion photographie la page une fois qu'elle est stable, et une toile
     * WebGL posée dans le document revient vide de cette photo : le
     * compositeur a déjà rendu sa mémoire. C'est le piège de ce plan — le
     * rendu a bien lieu, aucune erreur n'apparaît, et le film sort noir.
     *
     * On rend donc dans une toile WebGL gardée hors du document, avec
     * `preserveDrawingBuffer` pour que son contenu reste lisible après le
     * tracé, puis on la recopie sur une toile 2D visible. Une toile 2D est
     * peinte comme n'importe quel élément et se photographie toujours.
     */
    const source = document.createElement('canvas')
    source.width = size
    source.height = size

    const renderer = new THREE.WebGLRenderer({
      canvas: source,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(1)
    renderer.setSize(size, size, false)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.copy(CAMERA_POSITION)
    camera.lookAt(0, 0, 0)

    // Clé chaude, contre-jour citron : le volume se lit sans décor.
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(3, 5, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xd9f27a, 2.1)
    rim.position.set(-4, 2, -3)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))

    const pivot = new THREE.Group()
    scene.add(pivot)


    // Les modèles sont compressés en meshopt, comme dans l'app : sans ce
    // décodeur le chargement échoue par le rappel d'erreur, donc sans rien
    // interrompre, et le plan sort vide.
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)

    loader.load(
      staticFile(MODEL_FILES[animal] ?? MODEL_FILES.Mice),
      (gltf) => {
        const model = gltf.scene
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Plâtre mat : la texture d'origine n'apporte rien à cette taille.
            child.material = new THREE.MeshStandardMaterial({
              color: 0xf2f2ee,
              roughness: 0.72,
              metalness: 0.05,
            })
          }
        })

        const box = framingBox(model)
        const centre = box.getCenter(new THREE.Vector3())
        const radius = box.getSize(new THREE.Vector3()).length() / 2
        const scale = ((SIZE_TWEAK[animal] ?? 1) * FIT_RADIUS) / radius

        model.position.sub(centre)
        const holder = new THREE.Group()
        holder.add(model)
        holder.scale.setScalar(scale)
        holder.rotation.y = BASE_YAW_OVERRIDES[animal] ?? DEFAULT_BASE_YAW
        pivot.add(holder)

        stageRef.current = { renderer, scene, camera, pivot, paint, source }

        // Premier tracé ici, avant de libérer la capture : `setReady` est
        // asynchrone, et Remotion photographierait la toile encore vide.
        draw(stageRef.current, frameRef.current, durationInFrames, turns)
        setReady(true)
        continueRender(handle)
      },
      undefined,
      (error) => {
        // Un échec silencieux donnerait un plan noir qu'on ne remarquerait qu'au
        // montage final : on le dit, puis on libère la capture.
        console.error(`modèle ${animal} illisible`, error)
        continueRender(handle)
      },
    )

    return () => {
      renderer.dispose()
    }
  }, [animal, size, durationInFrames, turns])

  /**
   * Le rendu se fait pendant la phase de layout, pas dans un effet différé :
   * Remotion capture dès que la page est peinte, et un effet passif peut tomber
   * après — l'animal aurait alors une image de retard sur tout le reste.
   */
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || !ready) return
    draw(stage, frame, durationInFrames, turns)
  })

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
