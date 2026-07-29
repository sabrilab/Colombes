import { staticFile } from 'remotion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * Le vocabulaire des scènes en trois dimensions : caméras, matières, projection,
 * chargement des animaux. Le composant qui les rend vit dans `Scene3D.tsx`.
 *
 * Tout ce qui est ici est du calcul pur ou de la construction d'objets Three, et
 * se lit donc aussi bien depuis un plan que depuis un test.
 */

/** La caméra d'une scène, en données : de quoi la reproduire pour projeter. */
export interface CameraSpec {
  position: [number, number, number]
  target?: [number, number, number]
  fov?: number
}

export const DEFAULT_TARGET: [number, number, number] = [0, 0, 0]

/**
 * Où un point de la scène se trouve à l'écran, en pixels.
 *
 * C'est ce qui permet d'étiqueter un schéma en trois dimensions avec du texte
 * HTML — la typographie de l'app, nette, plutôt qu'une texture floue collée sur
 * un plan. La caméra est reconstruite à partir de la même description que la
 * scène : les deux ne peuvent donc pas divergerpour un même plan.
 */
export function project(
  point: [number, number, number],
  camera: CameraSpec,
  width: number,
  height: number,
): { x: number; y: number; depth: number } {
  const lens = new THREE.PerspectiveCamera(camera.fov ?? 35, width / height, 0.1, 100)
  lens.position.set(...camera.position)
  lens.lookAt(new THREE.Vector3(...(camera.target ?? DEFAULT_TARGET)))
  lens.updateMatrixWorld()
  lens.updateProjectionMatrix()

  const projected = new THREE.Vector3(...point).project(lens)
  return {
    x: ((projected.x + 1) / 2) * width,
    y: ((1 - projected.y) / 2) * height,
    depth: projected.z,
  }
}

/** L'éclairage de l'app : clé chaude, contre-jour citron, ambiance discrète. */
export function standardLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffffff, 2.6)
  key.position.set(3, 5, 4)
  scene.add(key)

  const rim = new THREE.DirectionalLight(0xd9f27a, 2.1)
  rim.position.set(-4, 2, -3)
  scene.add(rim)

  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
}

/** Le plâtre mat des animaux, et des volumes du même monde. */
export function plaster(tint = 0xf2f2ee) {
  return new THREE.MeshStandardMaterial({ color: tint, roughness: 0.72, metalness: 0.05 })
}

/** Le citron de la marque, en volume : légèrement émissif pour tenir dans le noir. */
export function lume(intensity = 0.35) {
  return new THREE.MeshStandardMaterial({
    color: 0xd6ee6b,
    roughness: 0.42,
    metalness: 0.1,
    emissive: 0xd6ee6b,
    emissiveIntensity: intensity,
  })
}

const MODEL_FILES: Record<string, string> = {
  Mice: 'models/mouse.glb',
  Rabbits: 'models/rabbit.glb',
  Deer: 'models/deer.glb',
  Elephants: 'models/elephant.glb',
  Whales: 'models/whale.glb',
}

/** L'orientation de repos des modèles, reprise de la scène de l'app. */
const DEFAULT_BASE_YAW = (3 * Math.PI) / 2
const BASE_YAW_OVERRIDES: Record<string, number> = { Deer: Math.PI }
/** La souris a une longue queue qui gonfle sa sphère englobante. */
const SIZE_TWEAK: Record<string, number> = { Mice: 1.15 }

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

/**
 * Un animal de Janz, recentré et mis à l'échelle sur sa sphère englobante : une
 * souris et une baleine occupent donc le même volume, ce qui est tout le propos
 * des paliers.
 *
 * Les modèles sont compressés en meshopt. Sans ce décodeur, le chargement échoue
 * par le rappel d'erreur — donc sans rien interrompre — et l'animal n'apparaît
 * jamais.
 */
export function loadAnimal(animal: string, radius = 0.75): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)

    loader.load(
      staticFile(MODEL_FILES[animal] ?? MODEL_FILES.Mice),
      (gltf) => {
        const model = gltf.scene
        model.traverse((child) => {
          // Plâtre mat : la texture d'origine n'apporte rien à cette taille.
          if (child instanceof THREE.Mesh) child.material = plaster()
        })

        const box = framingBox(model)
        model.position.sub(box.getCenter(new THREE.Vector3()))

        const holder = new THREE.Group()
        holder.add(model)
        holder.scale.setScalar(((SIZE_TWEAK[animal] ?? 1) * radius) / (box.getSize(new THREE.Vector3()).length() / 2))
        holder.rotation.y = BASE_YAW_OVERRIDES[animal] ?? DEFAULT_BASE_YAW

        const pivot = new THREE.Group()
        pivot.add(holder)
        resolve(pivot)
      },
      undefined,
      (error) => reject(error),
    )
  })
}
