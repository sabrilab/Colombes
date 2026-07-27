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

/** Vue trois-quarts du dessus, figée une fois pour toutes. */
const CAMERA_POSITION = new THREE.Vector3(2.1, 1.75, 2.5)

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
        // Respiration : l'animal flotte et oscille de quelques degrés, sans
        // jamais quitter sa vue trois-quarts.
        group.position.y = group.userData.baseY + Math.sin(t * 0.9) * 0.035
        group.rotation.y = group.userData.baseRotation + Math.sin(t * 0.45) * 0.07
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

      // Chaque modèle arrive dans son propre repère : on normalise d'abord
      // l'orientation en alignant sa longueur (museau-queue) sur l'axe X,
      // pour que tous adoptent réellement la même vue trois-quarts.
      const rawBox = new THREE.Box3().setFromObject(group)
      const size = rawBox.getSize(new THREE.Vector3())
      if (size.z > size.x) group.rotateY(Math.PI / 2)

      // Mise à l'échelle : une souris et une baleine occupent le même cadre.
      const box = new THREE.Box3().setFromObject(group)
      const sphere = box.getBoundingSphere(new THREE.Sphere())
      const scale = 1 / (sphere.radius || 1)
      group.scale.setScalar(scale)

      // Recentré horizontalement, mais posé bas : l'animal repose sur le
      // socle de la carte au lieu de flotter au milieu.
      const center = sphere.center.clone().multiplyScalar(scale)
      const floor = box.min.y * scale
      group.position.set(-center.x, -floor - 0.85, -center.z)

      // Trois-quarts : on tourne le sujet, pas la caméra.
      group.rotation.y -= Math.PI / 5
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
