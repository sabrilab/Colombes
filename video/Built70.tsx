import React, { useRef } from 'react'
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency, formatMultiple } from '../src/lib/format'
import { animalFor } from '../src/lib/pricePad'
import { LANDMARKS, landmarkAcv } from '../src/lib/landmarks'
import {
  AnimalBeat,
  Closing,
  DialFace,
  Emoji,
  Eyebrow,
  Film,
  LetterLine,
  PricePad,
  SpeedLines,
  Whip,
} from './kit'
import { landmarkMonthly } from './data'
import { Scene3D } from './Scene3D'
import { loadAnimal, lume, plaster, project, standardLights, type CameraMove } from './three'
import { DIM, INK, LUME, RED, centred, display, mono } from './tokens'
import { stepsPassed, ticksOf } from './motion.mjs'
import { TIMELINE, TOTAL_FRAMES } from './cuts/built.mjs'
import captions from './captions-built.json'

/**
 * « Anyone can build it now » — soixante-dix secondes, la version rapide.
 *
 * Les autres films expliquent une mécanique. Celui-ci part de ce qui vient de
 * basculer — écrire du code n'est plus le verrou — et amène la question qui le
 * remplace : ce que ça vaut. Le propos impose la forme : si l'on prétend que tout
 * va plus vite, le montage doit aller plus vite.
 *
 * Trois plans sont des traversées : la caméra descend un couloir, fend un nuage de
 * tuiles, longe une allée d'animaux. C'est ce que `Scene3D` sait faire depuis
 * qu'on lui décrit la caméra comme une fonction du temps — la pose reste déduite
 * du numéro d'image, donc reproductible, mais elle bouge.
 *
 * Sur les logos : ceux qui sont à l'image viennent de `public/logos`, sous licence
 * CC0, et l'usage est nominatif — on situe des entreprises connues sur une échelle
 * de prix pour expliquer l'échelle. Aucune marque n'est redessinée de mémoire, y
 * compris celle de Claude : le nom est composé en typographie, ce qui est exact et
 * n'invente rien. Voir `public/logos/README.md`.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Acte I — le monde d'après
   ──────────────────────────────────────────────────────────────────────────── */

const TUNNEL_SIZE = { width: 1080, height: 1920 }
const TUNNEL_RINGS = 30
const RING_GAP = 1.5

/**
 * Une traversée de couloir, sans un mot.
 *
 * Trois secondes et demie de mouvement pur pour ouvrir : le spectateur n'a rien à
 * lire, il n'a qu'à se laisser emmener. La caméra recule d'un anneau et demi par
 * dizaine d'images et roule très légèrement — c'est ce roulis, presque invisible,
 * qui empêche la traversée de ressembler à un zoom.
 */
const tunnelCamera: CameraMove = (progress) => ({
  position: [
    Math.sin(progress * Math.PI * 2) * 0.55,
    Math.cos(progress * Math.PI * 1.4) * 0.4,
    5 - progress * TUNNEL_RINGS * RING_GAP * 0.92,
  ],
  target: [0, 0, 5 - progress * TUNNEL_RINGS * RING_GAP * 0.92 - 8],
  fov: 62,
})

function Tunnel() {
  const frame = useCurrentFrame()
  const ringsRef = useRef<THREE.Mesh[]>([])

  return (
    <AbsoluteFill style={centred}>
      <Scene3D
        {...TUNNEL_SIZE}
        camera={tunnelCamera}
        build={(scene) => {
          standardLights(scene)

          ringsRef.current = Array.from({ length: TUNNEL_RINGS }, (_, index) => {
            // Un anneau sur quatre est en citron : le couloir garde un tempo visuel
            // même quand la vitesse rend les autres indistincts.
            const mesh = new THREE.Mesh(
              new THREE.TorusGeometry(1.5 + (index % 3) * 0.12, 0.028, 8, 48),
              index % 4 === 0 ? lume(0.75) : plaster(0x6a6a62),
            )
            mesh.position.set(0, 0, -index * RING_GAP)
            mesh.rotation.z = index * 0.21
            scene.add(mesh)
            return mesh
          })
        }}
        update={(shotFrame) => {
          ringsRef.current.forEach((mesh, index) => {
            mesh.rotation.z = index * 0.21 + shotFrame * 0.006
          })
        }}
      />

      {/* Le voile s'ouvre sur les premières images : la traversée démarre déjà
          lancée au lieu d'apparaître d'un coup. */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, oklch(0.125 0.006 110) 78%)',
          opacity: interpolate(frame, [0, 26], [1, 0.55], { extrapolateRight: 'clamp' }),
        }}
      />
      <SpeedLines delay={0} count={18} />
    </AbsoluteFill>
  )
}

/**
 * Le nom de Claude, composé et non dessiné.
 *
 * Redessiner une marque de mémoire produit un faux : les proportions sont fausses,
 * la lettre est fausse, et le résultat prétend à l'officiel. Le nom en typographie
 * dit exactement la même chose et n'invente rien.
 */
function ClaudeBeat() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.6 } })
  const line = spring({ frame: frame - 16, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={centred}>
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: `radial-gradient(circle, oklch(0.92 0.145 112 / ${0.14 * enter}), transparent 62%)`,
        }}
      />

      <p
        style={{
          ...display,
          margin: 0,
          fontSize: 176,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: INK,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [1.28, 1])})`,
          filter: `blur(${(1 - enter) * 26}px)`,
        }}
      >
        Claude
      </p>

      <p
        style={{
          ...display,
          margin: '30px 0 0',
          fontSize: 58,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textAlign: 'center',
          color: LUME,
          opacity: line,
          transform: `translateY(${(1 - line) * 26}px)`,
        }}
      >
        writes the code now
      </p>
    </AbsoluteFill>
  )
}

const PLATFORM_TICKS = ticksOf(TIMELINE, 'platforms')

/** Cinq écrans, cinq crans. L'app n'a plus de forme imposée. */
function Platforms() {
  const frame = useCurrentFrame()
  const shown = stepsPassed(frame, PLATFORM_TICKS)

  const screens = [
    { emoji: '📱', label: 'Mobile' },
    { emoji: '💻', label: 'Desktop' },
    { emoji: '🥽', label: 'VR' },
    { emoji: '⌚', label: 'Watch' },
    { emoji: '📺', label: 'TV' },
  ]

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={64}>Whatever the screen</Eyebrow>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 46, width: 940 }}>
        {screens.map((screen, index) => {
          const lit = index < shown

          return (
            <div
              key={screen.label}
              style={{
                width: 268,
                padding: '34px 0 26px',
                borderRadius: 30,
                textAlign: 'center',
                border: `1px solid ${lit ? 'oklch(0.92 0.145 112 / 0.36)' : 'oklch(1 0 0 / 0.07)'}`,
                backgroundColor: 'oklch(0.165 0.006 110)',
                opacity: lit ? 1 : 0.12,
                transform: `scale(${lit ? 1 : 0.86})`,
              }}
            >
              <Emoji size={104}>{screen.emoji}</Emoji>
              <p
                style={{
                  ...display,
                  margin: '18px 0 0',
                  fontSize: 27,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: DIM,
                }}
              >
                {screen.label}
              </p>
            </div>
          )
        })}
      </div>

      <p
        style={{
          ...display,
          margin: '58px 0 0',
          fontSize: 62,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
          opacity: shown >= screens.length ? 1 : 0.2,
        }}
      >
        It&apos;s all an <span style={{ color: LUME }}>app</span>
      </p>
    </AbsoluteFill>
  )
}

const SWARM_SIZE = { width: 1080, height: 1920 }
const SWARM_COUNT = 90

/**
 * Un nuage de tuiles que la caméra traverse.
 *
 * Les positions viennent d'une suite déterministe et non d'un tirage : Remotion
 * capture parfois deux fois la même image, dans deux onglets différents, et un
 * `Math.random()` donnerait deux nuages différents — le plan scintillerait.
 */
const TILES = Array.from({ length: SWARM_COUNT }, (_, index) => ({
  x: (((index * 73) % 100) / 100 - 0.5) * 7.5,
  y: (((index * 149) % 100) / 100 - 0.5) * 9,
  z: -((index * 0.42) % 28) - 1,
  spin: ((index * 37) % 100) / 100,
  lit: index % 7 === 0,
}))

const swarmCamera: CameraMove = (progress) => ({
  position: [0, 0, 4 - progress * 26],
  target: [0, 0, 4 - progress * 26 - 6],
  fov: 58,
})

function Swarm() {
  const frame = useCurrentFrame()
  const tilesRef = useRef<THREE.Mesh[]>([])

  return (
    <AbsoluteFill style={centred}>
      <Scene3D
        {...SWARM_SIZE}
        camera={swarmCamera}
        build={(scene) => {
          standardLights(scene)

          tilesRef.current = TILES.map((tile) => {
            const mesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.42, 0.42, 0.06),
              tile.lit ? lume(0.5) : plaster(0xdedeD6),
            )
            mesh.position.set(tile.x, tile.y, tile.z)
            scene.add(mesh)
            return mesh
          })
        }}
        update={(shotFrame) => {
          tilesRef.current.forEach((mesh, index) => {
            mesh.rotation.y = TILES[index].spin * 6 + shotFrame * 0.02
            mesh.rotation.x = TILES[index].spin * 3
          })
        }}
      />

      <AbsoluteFill style={{ ...centred, paddingBottom: 120 }}>
        <p
          style={{
            ...display,
            margin: 0,
            fontSize: 92,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            textAlign: 'center',
            color: INK,
            textShadow: '0 8px 60px oklch(0 0 0 / 0.9)',
            opacity: interpolate(frame, [14, 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          Everyone
          <br />
          ships now
        </p>
      </AbsoluteFill>
      <SpeedLines delay={2} count={20} />
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte II — le retournement
   ──────────────────────────────────────────────────────────────────────────── */

/** Un faux chiffre : net, gros, rassurant — puis brouillé, faute d'explication. */
function Borrowed() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200 } })
  const blur = interpolate(frame, [44, 88], [0, 34], { extrapolateLeft: 'clamp' })
  const fade = interpolate(frame, [44, 88], [1, 0.18], { extrapolateLeft: 'clamp' })
  const mark = spring({ frame: frame - 54, fps, config: { damping: 170 } })

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Every calculator says</Eyebrow>
      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 158,
          fontWeight: 600,
          color: INK,
          opacity: enter * fade,
          filter: `blur(${blur}px)`,
        }}
      >
        €412,000
      </p>
      <p
        style={{
          ...display,
          marginTop: 30,
          fontSize: 160,
          fontWeight: 700,
          color: LUME,
          opacity: mark,
          transform: `scale(${interpolate(mark, [0, 1], [0.5, 1])})`,
        }}
      >
        ?
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte III — le revenu, en volume
   ──────────────────────────────────────────────────────────────────────────── */

const SURFACE_SIZE = { width: 1040, height: 900 }

/** La caméra tourne pendant que la dalle grandit : le volume, c'est le revenu. */
const surfaceCamera: CameraMove = (progress) => {
  const angle = -0.5 + progress * 1.0
  return {
    position: [Math.sin(angle) * 4.4, 2.1 + progress * 0.5, Math.cos(angle) * 4.4],
    target: [0, 0.25, 0],
    fov: 34,
  }
}

function Surface3D() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slabRef = useRef<THREE.Mesh | null>(null)
  const grow = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.9 } })

  const price = Math.round(5 + grow * 24)
  const customers = Math.round(30 + grow * 470)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={8}>Revenue is a surface</Eyebrow>

      <Scene3D
        {...SURFACE_SIZE}
        camera={surfaceCamera}
        build={(scene) => {
          standardLights(scene)
          const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lume(0.28))
          scene.add(slab)

          // La grille au sol donne l'échelle : sans elle, une dalle qui grandit
          // ressemble à une dalle dont on s'approche.
          const grid = new THREE.GridHelper(6, 12, 0x4a4a44, 0x2e2e2a)
          grid.position.y = -0.002
          scene.add(grid)

          slabRef.current = slab
        }}
        update={(shotFrame) => {
          const slab = slabRef.current
          if (!slab) return
          const pushed = Math.min(1, Math.max(0, (shotFrame - 6) / 46))
          const eased = 1 - (1 - pushed) ** 3

          const width = 0.5 + eased * 2.5
          const depth = 0.5 + eased * 1.5
          slab.scale.set(width, 0.34, depth)
          slab.position.set(0, 0.17, 0)
        }}
      />

      <p style={{ ...mono, margin: '18px 0 0', fontSize: 104, fontWeight: 600, color: INK }}>
        {formatCurrency(price * customers)}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 27, letterSpacing: '0.22em', color: DIM }}>
        {formatCurrency(price)} × {customers.toLocaleString('en-US')} CUSTOMERS
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte IV — la volière
   ──────────────────────────────────────────────────────────────────────────── */

const AVIARY_SIZE = { width: 1080, height: 1500 }
/**
 * Quatre postes le long de l'allée.
 *
 * L'écart latéral est faible — trente centimètres — et ce n'est pas un choix
 * esthétique : à 52 degrés d'ouverture et en cadre vertical, la demi-largeur
 * visible ne fait qu'un tiers de la distance. Un animal placé à cinquante
 * centimètres de l'axe sortait du cadre dès un mètre cinquante, c'est-à-dire au
 * moment précis où la caméra arrivait sur lui, et le plan ne montrait plus qu'un
 * sol qui défile. À trente, il ne s'échappe que dans le dernier mètre — le coup de
 * fouet qu'on cherchait — et le suivant, quatre mètres devant, est déjà là.
 *
 * La course s'arrête avant la baleine : elle grandit dans la dernière seconde au
 * lieu d'être dépassée, ce qui donne au plan une fin plutôt qu'un arrêt.
 */
const AVIARY = [
  { animal: 'Mice', z: -3, x: -0.3 },
  { animal: 'Rabbits', z: -7, x: 0.3 },
  { animal: 'Deer', z: -11, x: -0.3 },
  { animal: 'Whales', z: -15, x: 0.3 },
]

/**
 * La caméra descend l'allée, et regarde toujours un peu devant elle.
 *
 * Viser exactement l'animal suivant donnerait un mouvement de tête à chaque
 * passage ; viser droit devant, à distance constante, donne une caméra portée qui
 * les découvre au passage. C'est la différence entre un travelling et un carrousel.
 */
const aviaryCamera: CameraMove = (progress) => {
  const eased = progress < 0.5 ? 2 * progress ** 2 : 1 - (-2 * progress + 2) ** 2 / 2
  const z = 2.5 - eased * 14.3
  return {
    position: [Math.sin(progress * Math.PI * 1.6) * 0.25, 0.7, z],
    target: [0, 0.35, z - 5],
    fov: 52,
  }
}

function Aviary() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const holders = useRef<THREE.Group[]>([])

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0
  const pose = aviaryCamera(progress, frame)

  return (
    <AbsoluteFill style={centred}>
      <div style={{ position: 'relative', ...AVIARY_SIZE }}>
        <Scene3D
          {...AVIARY_SIZE}
          camera={aviaryCamera}
          build={async (scene) => {
            standardLights(scene)

            // Chargés en parallèle : quatre attentes en série tripleraient le
            // temps de construction du plan, et la capture attend la plus longue.
            const loaded = await Promise.all(AVIARY.map((post) => loadAnimal(post.animal, 0.62)))

            holders.current = loaded.map((pivot, index) => {
              pivot.position.set(AVIARY[index].x, 0.35, AVIARY[index].z)
              scene.add(pivot)
              return pivot
            })

            const floor = new THREE.GridHelper(40, 40, 0x3c3c36, 0x232320)
            scene.add(floor)
          }}
          update={(shotFrame) => {
            holders.current.forEach((pivot, index) => {
              // Chacun tourne à sa vitesse : au même rythme, les quatre auraient
              // l'air d'être posés sur le même plateau tournant.
              pivot.rotation.y = 0.4 + shotFrame * (0.004 + index * 0.0012)
            })
          }}
        />

        {/* Les noms suivent leur animal, projetés avec la caméra du moment. */}
        {AVIARY.map((post) => {
          const anchor = project([post.x, 1.05, post.z], pose, AVIARY_SIZE.width, AVIARY_SIZE.height)
          // Derrière la caméra, la projection se retourne : on ne dessine que ce
          // qui est devant, sinon l'étiquette réapparaît à l'envers dans le cadre.
          if (anchor.depth > 1 || post.z > pose.position[2] - 0.5) return null
          // L'étiquette ne vit que le temps du passage : au-delà de cinq mètres
          // devant la caméra, quatre noms seraient lisibles à la fois.
          const near = Math.max(0, 1 - Math.abs(post.z - pose.position[2] + 3.2) / 4.5)

          return (
            <span
              key={post.animal}
              style={{
                ...display,
                position: 'absolute',
                left: anchor.x,
                top: anchor.y,
                transform: 'translate(-50%, 0)',
                fontSize: 34,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: LUME,
                opacity: near,
                whiteSpace: 'nowrap',
              }}
            >
              {post.animal}
            </span>
          )
        })}
      </div>

      <p
        style={{
          ...display,
          margin: '10px 0 0',
          fontSize: 70,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
          opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Which <span style={{ color: LUME }}>animal</span> are you
      </p>
    </AbsoluteFill>
  )
}

const LOGO_TICKS = ticksOf(TIMELINE, 'logos')

/**
 * Quatre repères, avec leur vrai logo et leur vrai prix par client.
 *
 * Les fichiers viennent de Simple Icons, en CC0, et l'usage est nominatif : on
 * situe des entreprises connues sur une échelle pour expliquer l'échelle. Deux
 * repères de l'app n'ont volontairement pas de fichier — leurs marques ont demandé
 * le retrait — et ils n'apparaissent donc pas ici.
 */
const LOGO_IDS = ['spotify', 'shopify', 'hubspot', 'netflix']

function Logos() {
  const frame = useCurrentFrame()
  const shown = stepsPassed(frame, LOGO_TICKS)

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 80px' }}>
      <Eyebrow>Everyone sits somewhere</Eyebrow>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {LOGO_IDS.map((id, index) => {
          const company = LANDMARKS.find((candidate) => candidate.id === id)
          if (!company) return null
          const monthly = landmarkAcv(company) / 12
          const lit = index < shown

          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                padding: '26px 34px',
                borderRadius: 26,
                border: `1px solid ${lit ? 'oklch(0.92 0.145 112 / 0.3)' : 'oklch(1 0 0 / 0.07)'}`,
                backgroundColor: 'oklch(0.165 0.006 110)',
                opacity: lit ? 1 : 0.14,
                transform: `translateX(${lit ? 0 : 40}px)`,
              }}
            >
              {/* La pastille blanche, comme dans l'app : les logos officiels sont
                  dessinés pour un fond clair et disparaîtraient sur le nôtre. */}
              <span
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  display: 'flex',
                  ...centred,
                  flex: '0 0 auto',
                }}
              >
                <Img src={staticFile(`logos/${id}.svg`)} style={{ width: 52, height: 52 }} />
              </span>

              <span style={{ ...display, flex: 1, fontSize: 44, fontWeight: 700, color: INK }}>
                {company.name}
              </span>

              <span style={{ textAlign: 'right' }}>
                <span style={{ ...mono, display: 'block', fontSize: 44, color: LUME }}>
                  {formatCurrency(Math.round(monthly))}
                </span>
                <span
                  style={{
                    ...display,
                    display: 'block',
                    fontSize: 23,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: DIM,
                  }}
                >
                  {animalFor(monthly).name}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte V — ce qui reste
   ──────────────────────────────────────────────────────────────────────────── */

const DIAL_TICKS = ticksOf(TIMELINE, 'dial')

/** La molette, dix-huit crans, du plus petit prix au plus grand. */
function Dial() {
  const frame = useCurrentFrame()
  const notch = stepsPassed(frame, DIAL_TICKS)
  const progress = notch / DIAL_TICKS.count
  const price = Math.round(2 * (19_389 / 2) ** progress)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Your price per customer</Eyebrow>
      <DialFace value={formatCurrency(price)} progress={progress} size={460} label="Per month" />
      <p
        style={{
          ...display,
          margin: '50px 0 0',
          fontSize: 78,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: LUME,
        }}
      >
        {animalFor(price).name}
      </p>
    </AbsoluteFill>
  )
}

const CASE = compute({
  ...DEFAULT_INPUTS,
  tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
  customers: 500,
  newCustomersPerMonth: 25,
})

const CASCADE_TICKS = ticksOf(TIMELINE, 'cascade')
const CASCADE_SIZE = { width: 1040, height: 1160 }

const CUTS = [
  { key: 'remains', label: 'Yours', value: CASE.revenue.sdeMonthly },
  { key: 'fixed', label: 'Fixed costs', value: DEFAULT_INPUTS.fixedCosts },
  { key: 'acquisition', label: 'Acquisition', value: CASE.revenue.acquisitionCost },
  { key: 'direct', label: 'Direct costs', value: CASE.revenue.variableCost },
]

/* Les parts doivent retomber sur le revenu, sinon le schéma raconte n'importe quoi. */
const CUT_SUM = CUTS.reduce((total, cut) => total + cut.value, 0)
if (Math.abs(CUT_SUM - CASE.revenue.mrr) > 1) {
  throw new Error(`Les tranches font ${Math.round(CUT_SUM)} € au lieu de ${Math.round(CASE.revenue.mrr)} €.`)
}

const COLUMN_HEIGHT = 2.2
const STACK = CUTS.reduce<{ key: string; label: string; value: number; height: number; y: number }[]>(
  (list, cut) => {
    const height = (Math.max(cut.value, 0) / CASE.revenue.mrr) * COLUMN_HEIGHT
    const below = list.reduce((total, item) => total + item.height, 0)
    list.push({ ...cut, height, y: below + height / 2 })
    return list
  },
  [],
)

/** La caméra tourne autour de la colonne pendant qu'on la vide. */
const cascadeCamera: CameraMove = (progress) => {
  const angle = 0.5 + progress * 0.85
  return {
    position: [Math.sin(angle) * 4.2, 1.6 + progress * 0.7, Math.cos(angle) * 4.2],
    target: [0, 1.05, 0],
    fov: 34,
  }
}

function Cascade() {
  const frame = useCurrentFrame()
  const meshes = useRef<THREE.Mesh[]>([])
  const taken = stepsPassed(frame, CASCADE_TICKS)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={10}>{formatCurrency(Math.round(CASE.revenue.mrr))} a month, in</Eyebrow>

      <Scene3D
        {...CASCADE_SIZE}
        camera={cascadeCamera}
        build={(scene) => {
          standardLights(scene)
          meshes.current = STACK.map((slice, index) => {
            const mesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.9, Math.max(slice.height, 0.02), 0.9),
              index === 0 ? lume(0.34) : plaster(0xe6e6df),
            )
            mesh.position.set(0, slice.y, 0)
            scene.add(mesh)
            return mesh
          })
        }}
        update={(shotFrame) => {
          const passed = stepsPassed(shotFrame, CASCADE_TICKS)
          STACK.forEach((slice, index) => {
            // Les prélèvements partent par le haut. Celui du bas ne part jamais :
            // c'est tout le propos.
            const order = STACK.length - 1 - index
            const going = Math.min(1, Math.max(0, passed - order))
            const eased = going ** 2
            const mesh = meshes.current[index]
            if (!mesh) return

            mesh.position.set(eased * 3.6, slice.y - eased * 1.8, 0)
            mesh.rotation.z = -eased * 1.1
            mesh.material.opacity = 1 - eased
            mesh.material.transparent = eased > 0
          })
        }}
      />

      <p
        style={{
          ...mono,
          margin: '6px 0 0',
          fontSize: 96,
          fontWeight: 600,
          color: taken >= CASCADE_TICKS.count ? LUME : INK,
        }}
      >
        {formatCurrency(Math.round(CASE.revenue.sdeMonthly))}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 27, letterSpacing: '0.22em', color: DIM }}>
        WHAT ACTUALLY REMAINS
      </p>
    </AbsoluteFill>
  )
}

const MULTIPLE_TICKS = ticksOf(TIMELINE, 'multiple')
const LINES = CASE.valuation.lines

/**
 * Les neuf lignes en pastilles qui éclatent autour du multiple.
 *
 * Le film de la cascade les montre en barres, posément. Ici on n'a que quatre
 * secondes : on ne cherche pas à les faire lire une par une, mais à faire sentir
 * qu'il y en a neuf et qu'elles portent chacune un nom. Le cran sonore fait le
 * comptage à la place de l'œil.
 */
function Multiple() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const shown = stepsPassed(frame, MULTIPLE_TICKS)
  const total = spring({
    frame: frame - MULTIPLE_TICKS.from - MULTIPLE_TICKS.spread + 6,
    fps,
    config: { damping: 200 },
  })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 70px' }}>
      <Eyebrow>Nine lines build it</Eyebrow>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 16,
          width: '100%',
          marginBottom: 54,
        }}
      >
        {LINES.map((line, index) => {
          const lit = index < shown
          const positive = line.deltaMultiple >= 0

          return (
            <span
              key={line.key}
              style={{
                ...display,
                padding: '16px 26px',
                borderRadius: 999,
                fontSize: 28,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: positive ? INK : RED,
                border: `1px solid ${positive ? 'oklch(0.92 0.145 112 / 0.4)' : 'oklch(0.7 0.2 25 / 0.5)'}`,
                backgroundColor: positive ? 'oklch(0.92 0.145 112 / 0.1)' : 'oklch(0.7 0.2 25 / 0.1)',
                opacity: lit ? 1 : 0,
                transform: `scale(${lit ? 1 : 0.6})`,
              }}
            >
              {line.label}
            </span>
          )
        })}
      </div>

      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 168,
          fontWeight: 600,
          color: INK,
          opacity: total,
          transform: `scale(${interpolate(total, [0, 1], [0.72, 1])})`,
          textShadow: `0 0 80px oklch(0.92 0.145 112 / ${0.4 * total})`,
        }}
      >
        {formatMultiple(CASE.valuation.multiple)}
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le montage
   ──────────────────────────────────────────────────────────────────────────── */

const SHOT_NODES: Record<string, React.ReactNode> = {
  tunnel: <Tunnel />,
  claude: <ClaudeBeat />,
  anything: (
    <Whip from="in" blur={34}>
      <LetterLine text="Anyone can ship it" accent="Anyone" />
    </Whip>
  ),
  platforms: <Platforms />,
  swarm: <Swarm />,
  easy: (
    <>
      <SpeedLines count={22} />
      <Whip from="left" distance={340}>
        <LetterLine text="Shipping was the easy part" accent="easy" size={98} />
      </Whip>
    </>
  ),
  worth: <LetterLine text="What is it worth" accent="worth" size={132} />,
  borrowed: <Borrowed />,
  pad: <PricePad caption="What the app is worth" />,
  surface: <Surface3D />,
  aviary: <Aviary />,
  mouse: <AnimalBeat animal="Mice" title="Spotify" note={landmarkMonthly('spotify')} turns={0.28} />,
  whale: <AnimalBeat animal="Whales" title="Salesforce" note={landmarkMonthly('salesforce')} turns={0.24} />,
  logos: <Logos />,
  dial: <Dial />,
  cascade: <Cascade />,
  multiple: <Multiple />,
  hard: (
    <Whip from="up" distance={220}>
      <LetterLine text="Knowing what it's worth is the hard part" accent="hard" size={82} />
    </Whip>
  ),
  closing: <Closing halo={220} />,
}

export function Built70({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-built.mp3"
      captions={captions}
      sound={sound}
    />
  )
}
