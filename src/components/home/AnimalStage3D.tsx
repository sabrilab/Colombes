import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * La scène des animaux de Janz. Une vue trois-quarts plongeante, identique
 * pour chaque espèce : le modèle est recentré et mis à l'échelle sur sa
 * sphère englobante, si bien qu'une souris et une baleine occupent le même
 * cadre. Rendu en plâtre mat — la texture d'origine n'apporterait rien à
 * cette taille, et le blanc colle à l'identité.
 */

const MODEL_URLS: Record<string, string> = {
  Mice: '/models/mouse.glb',
  Rabbits: '/models/rabbit.glb',
  Deer: '/models/deer.glb',
  Elephants: '/models/elephant.glb',
  Whales: '/models/whale.glb',
}

/**
 * Caméra dans le plan YZ : l'axe X du monde tombe donc exactement sur
 * l'horizontale de l'écran. Un modèle couché sur X se lit tête à gauche,
 * corps à droite. L'élévation (~32°) donne le trois-quarts plongeant.
 */
const CAMERA_POSITION = new THREE.Vector3(0, 1.05, 2.8)

/** Le quart de tour qui fait le trois-quarts : le sujet s'ouvre vers nous. */
const THREE_QUARTER_YAW = Math.PI / 7

/** Vitesse du tour sur soi-même : une révolution en quatorze secondes. */
const SPIN_SPEED = (2 * Math.PI) / 14

/**
 * Quart de tour qui couche la bête sur l'axe X, tête à gauche. Aucune
 * heuristique ne devine où est la tête — les bois d'un cerf élargissent sa
 * boîte autant que son corps l'allonge —, la valeur est donc constatée à
 * l'œil. Les cinq modèles fournis partagent la même convention ; un modèle
 * qui s'en écarterait se corrige par une entrée dans BASE_YAW_OVERRIDES.
 */
const DEFAULT_BASE_YAW = (3 * Math.PI) / 2
const BASE_YAW_OVERRIDES: Record<string, number> = {
  // Le cerf est authored d'équerre par rapport aux autres : le quart de tour
  // commun le laisse face caméra, il lui faut un demi-tour.
  Deer: Math.PI,
}

/**
 * Le plus gros maillage donne le cadre. Certains modèles traînent un nœud
 * parasite très loin de la bête : s'y fier ferait rétrécir le sujet à un
 * point. On mesure donc chaque maillage et on garde le plus volumineux.
 */
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

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function AnimalStage3D({ animal }: { animal: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  // La scène vit hors du cycle de rendu React : on la monte une fois.
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    current: THREE.Group | null
  } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      // Pas de WebGL : la carte reste lisible sans l'animal.
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.copy(CAMERA_POSITION)
    camera.lookAt(0, 0, 0)

    // Clé chaude, contre-jour citron : le volume se lit sans décor.
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(3, 5, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xd9f27a, 1.8)
    rim.position.set(-4, 2, -3)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))

    sceneRef.current = { renderer, scene, camera, current: null }

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      if (!clientWidth || !clientHeight) return
      renderer.setSize(clientWidth, clientHeight)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    let frame = 0
    const still = prefersReducedMotion()
    const start = performance.now()
    const animate = (now: number) => {
      const group = sceneRef.current?.current
      if (group && !still) {
        const t = (now - start) / 1000
        // Tour complet en quatorze secondes, plus une respiration : la bête
        // se présente sous toutes ses faces et repasse par sa pose de départ.
        group.position.y = group.userData.baseY + Math.sin(t * 0.9) * 0.035
        group.rotation.y = group.userData.baseRotation + t * SPIN_SPEED
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const url = MODEL_URLS[animal]
    if (!url) return

    let cancelled = false
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)

    loader.load(url, (gltf) => {
      const context = sceneRef.current
      if (cancelled || !context) return

      const group = gltf.scene

      // Plâtre mat : on remplace chaque matériau, textures comprises.
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xf4f6ee,
            roughness: 0.72,
            metalness: 0.04,
          })
        }
      })

      group.rotateY(BASE_YAW_OVERRIDES[animal] ?? DEFAULT_BASE_YAW)
      group.updateWorldMatrix(true, true)

      // Mise à l'échelle sur la sphère englobante : une souris et une baleine
      // occupent exactement le même cadre.
      const box = framingBox(group)
      const sphere = box.getBoundingSphere(new THREE.Sphere())
      const scale = 1 / (sphere.radius || 1)
      group.scale.setScalar(scale)

      // Recentré, à peine posé bas : le sujet remplit le cadre.
      const center = sphere.center.clone().multiplyScalar(scale)
      group.position.set(-center.x, -center.y - 0.12, -center.z)

      // Trois-quarts : on tourne le sujet, jamais la caméra.
      group.rotation.y += THREE_QUARTER_YAW
      group.userData.baseRotation = group.rotation.y
      group.userData.baseY = group.position.y

      if (context.current) context.scene.remove(context.current)
      context.scene.add(group)
      context.current = group
    })

    return () => {
      cancelled = true
    }
  }, [animal])

  return <div ref={mountRef} className="h-full w-full" />
}
