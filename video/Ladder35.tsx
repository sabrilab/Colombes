import React, { useRef } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { formatCurrency } from '../src/lib/format'
import { PRICING_ANIMALS, animalFor } from '../src/lib/pricePad'
import { AnimalBeat, Closing, DialFace, Eyebrow, Film, Leader, LetterLine } from './kit'
import { landmarkMonthly } from './data'
import { Scene3D } from './Scene3D'
import { lume, plaster, project, standardLights, type CameraSpec } from './three'
import { DIM, INK, LUME, centred, display, mono } from './tokens'
import { stepsPassed, ticksOf } from './motion.mjs'
import { TIMELINE, TOTAL_FRAMES } from './cuts/ladder.mjs'

/**
 * « Which animal are you » — trente-cinq secondes sur l'échelle des prix.
 *
 * Pas de voix off : le film se tient par le rythme, la typographie et le son. Cela
 * change la façon d'écrire chaque plan — il doit se comprendre sans commentaire,
 * donc il montre une seule chose, et le bruitage dit qu'il se passe quelque chose
 * là où la parole le dirait.
 *
 * Deux plans sont de vrais volumes et non des dessins à plat, parce que la
 * démonstration EST géométrique : un escalier dont la marche monte en prix et se
 * resserre en clientèle, et deux blocs de même contenance aux proportions
 * opposées. À plat, il faudrait l'expliquer ; en volume, on le voit.
 */

/* ────────────────────────────────────────────────────────────────────────────
   L'escalier, dérivé des paliers de l'app
   ──────────────────────────────────────────────────────────────────────────── */

/** Le revenu qu'on garde constant d'une marche à l'autre. */
const TARGET_MRR = 10_000
/** Le sommet de l'échelle, comme sur le pad. */
const SCALE_MAX = 30_000

const STEP_DEPTH = 0.55
const STEP_THICKNESS = 0.09

/**
 * Une marche par palier.
 *
 * La hauteur porte le prix, la largeur le nombre de clients, les deux en échelle
 * logarithmique — c'est exactement l'axe du pad. Le résultat n'est pas décoratif :
 * puisque prix × clients reste égal à `TARGET_MRR`, toutes les marches représentent
 * le même revenu. L'escalier monte donc en se resserrant, et cette forme est la
 * démonstration elle-même.
 */
const STEPS = PRICING_ANIMALS.map((animal, index) => {
  const top = Math.min(animal.maxPrice, SCALE_MAX)
  // Moyenne géométrique : sur une échelle logarithmique, c'est le milieu.
  const price = Math.sqrt(animal.minPrice * top)
  const customers = TARGET_MRR / price

  return {
    name: animal.name,
    price,
    customers,
    y: (Math.log(price) / Math.log(SCALE_MAX)) * 1.95,
    width: 0.34 + 1.5 * (Math.log(customers) / Math.log(TARGET_MRR)),
    z: -index * 0.52,
  }
})

const STAIRS_CAMERA: CameraSpec = { position: [2.3, 2.5, 3.3], target: [0, 0.86, -0.9], fov: 34 }
const STAIRS_SIZE = { width: 1030, height: 1120 }
/**
 * Les étiquettes tiennent dans une colonne alignée à droite, et ce sont les traits
 * de rappel qui s'allongent pour rejoindre chaque marche.
 *
 * Posées à distance fixe du bord de la marche, elles débordaient du cadre pour les
 * marches hautes et étroites, que la perspective renvoie vers la droite. Une
 * colonne fixe ne peut pas déborder, et l'alignement se lit comme voulu.
 */
const LABEL_RAIL = STAIRS_SIZE.width - 8
const LEADER_START = LABEL_RAIL - 250

/** Les crans viennent du montage, seul endroit où ils sont écrits. */
const STAIRS_TICKS = ticksOf(TIMELINE, 'stairs')

if (STAIRS_TICKS.count !== STEPS.length) {
  // Le montage ne peut pas lire les paliers — il est chargé par Node pour le
  // mixage — donc c'est ici qu'on vérifie qu'il en annonce le bon nombre.
  throw new Error(`Le montage annonce ${STAIRS_TICKS.count} marches, il y en a ${STEPS.length}.`)
}

function Stairs() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const built = useRef<{ steps: THREE.Mesh[]; marker: THREE.Mesh } | null>(null)

  const risen = stepsPassed(frame, STAIRS_TICKS)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={18}>Same revenue, five trades</Eyebrow>

      <div style={{ position: 'relative', ...STAIRS_SIZE }}>
        <Scene3D
          {...STAIRS_SIZE}
          camera={STAIRS_CAMERA}
          build={(scene) => {
            standardLights(scene)

            const steps = STEPS.map((step) => {
              const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(step.width, STEP_THICKNESS, STEP_DEPTH),
                plaster(0xe9e9e2),
              )
              mesh.position.set(0, step.y, step.z)
              scene.add(mesh)
              return mesh
            })

            // Le repère citron : ce qu'on est, posé sur sa marche.
            const marker = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), lume(0.5))
            scene.add(marker)

            built.current = { steps, marker }
          }}
          update={(shotFrame) => {
            const rig = built.current
            if (!rig) return
            const passed = stepsPassed(shotFrame, STAIRS_TICKS)

            rig.steps.forEach((mesh, index) => {
              // Chaque marche tombe à sa place au moment de son cran, et le son
              // sort de la même fonction : l'impact ne peut pas glisser.
              const landing = Math.min(1, Math.max(0, passed - index))
              mesh.visible = landing > 0
              mesh.position.y = STEPS[index].y + (1 - landing) * 0.9
              mesh.scale.setScalar(0.9 + landing * 0.1)
            })

            const current = Math.max(0, passed - 1)
            const step = STEPS[Math.min(current, STEPS.length - 1)]
            rig.marker.visible = passed > 0
            rig.marker.position.set(0, step.y + STEP_THICKNESS / 2 + 0.12, step.z)
          }}
        />

        {/* Les étiquettes sont du HTML posé sur la 3D : la typographie reste nette,
            et c'est la position qui vient de la scène. */}
        {STEPS.map((step, index) => {
          if (index >= risen) return null
          const enter = spring({
            frame: frame - STAIRS_TICKS.from - index * 12,
            fps,
            config: { damping: 200, mass: 0.5 },
          })
          const edge = project(
            [step.width / 2, step.y, step.z],
            STAIRS_CAMERA,
            STAIRS_SIZE.width,
            STAIRS_SIZE.height,
          )
          const anchor = { x: edge.x + 22, y: edge.y }

          return (
            <React.Fragment key={step.name}>
              {anchor.x < LEADER_START - 10 && (
                <Leader from={anchor} to={{ x: LEADER_START, y: anchor.y }} opacity={enter} />
              )}
              <span
                style={{
                  position: 'absolute',
                  left: LABEL_RAIL,
                  top: anchor.y,
                  transform: 'translate(-100%, -50%)',
                  textAlign: 'right',
                  opacity: enter,
                }}
              >
                <span
                  style={{
                    ...display,
                    display: 'block',
                    fontSize: 30,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: index === risen - 1 ? LUME : DIM,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.name}
                </span>
                <span style={{ ...mono, display: 'block', fontSize: 27, color: INK, whiteSpace: 'nowrap' }}>
                  {formatCurrency(Math.round(step.price))} × {Math.round(step.customers).toLocaleString('en-US')}
                </span>
              </span>
            </React.Fragment>
          )
        })}
      </div>

      <p style={{ ...mono, margin: '26px 0 0', fontSize: 62, fontWeight: 600, color: INK }}>
        {formatCurrency(TARGET_MRR)}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 26, letterSpacing: '0.22em', color: DIM }}>
        EVERY SINGLE STEP
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Deux blocs de même contenance
   ──────────────────────────────────────────────────────────────────────────── */

const SAME_CAMERA: CameraSpec = { position: [0, 1.25, 4.7], target: [0, 0.4, 0], fov: 32 }
const SAME_SIZE = { width: 1040, height: 860 }

/**
 * Le schéma qui justifie le film : deux volumes de contenance identique.
 *
 * Le volume vaut le revenu. Le premier bloc est large et plat — beaucoup de petits
 * clients ; le second étroit et haut — quelques gros. Ils contiennent la même chose
 * et ne décrivent pas la même entreprise. C'est intenable à dire en une phrase, et
 * évident dès qu'on tourne autour.
 */
const BLOCKS = [
  { key: 'flat', width: 1.5, height: 0.2, price: 2, customers: 5_000, x: -0.78 },
  { key: 'tall', width: 0.38, height: 0.79, price: 833, customers: 12, x: 0.78 },
]
const BLOCK_DEPTH = 0.8

/*
 * Les deux contenances doivent être égales à la virgule près, sinon la
 * démonstration est fausse : 1,5 × 0,2 × 0,8 = 0,240 et 0,38 × 0,79 × 0,8 = 0,240.
 */
const [flat, tall] = BLOCKS
if (Math.abs(flat.width * flat.height - tall.width * tall.height) > 0.002) {
  throw new Error('Les deux blocs ne contiennent pas la même chose.')
}

function SameMoney() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pivotRef = useRef<THREE.Group | null>(null)
  const enter = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.8 } })

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={10}>Same money</Eyebrow>

      <div style={{ position: 'relative', ...SAME_SIZE }}>
        <Scene3D
          {...SAME_SIZE}
          camera={SAME_CAMERA}
          build={(scene) => {
            standardLights(scene)
            const pivot = new THREE.Group()

            for (const block of BLOCKS) {
              const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(block.width, block.height, BLOCK_DEPTH),
                block.key === 'tall' ? lume(0.3) : plaster(0xe9e9e2),
              )
              mesh.position.set(block.x, block.height / 2, 0)
              pivot.add(mesh)
            }

            scene.add(pivot)
            pivotRef.current = pivot
          }}
          update={(_shotFrame, progress) => {
            // Un aller-retour lent : le volume se lit dans le mouvement, et une
            // rotation complète ferait perdre la comparaison de face.
            if (pivotRef.current) pivotRef.current.rotation.y = Math.sin(progress * Math.PI) * 0.42 - 0.18
          }}
        />

        {BLOCKS.map((block) => {
          const foot = project([block.x, 0, BLOCK_DEPTH / 2], SAME_CAMERA, SAME_SIZE.width, SAME_SIZE.height)

          return (
            <span
              key={block.key}
              style={{
                position: 'absolute',
                left: foot.x,
                top: foot.y + 40,
                transform: 'translateX(-50%)',
                textAlign: 'center',
                opacity: enter,
              }}
            >
              <span style={{ ...mono, display: 'block', fontSize: 38, color: INK, whiteSpace: 'nowrap' }}>
                {block.customers.toLocaleString('en-US')} × {formatCurrency(block.price)}
              </span>
              <span
                style={{
                  ...display,
                  display: 'block',
                  marginTop: 6,
                  fontSize: 25,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: block.key === 'tall' ? LUME : DIM,
                  whiteSpace: 'nowrap',
                }}
              >
                {animalFor(block.price).name}
              </span>
            </span>
          )
        })}
      </div>

      <p
        style={{
          ...display,
          margin: '54px 0 0',
          fontSize: 68,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
          opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Different <span style={{ color: LUME }}>company</span>
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Les plans à plat
   ──────────────────────────────────────────────────────────────────────────── */

const DIAL_TICKS = ticksOf(TIMELINE, 'hook-dial')

/**
 * L'accroche : la molette, lancée d'un coup.
 *
 * Le prix avance par crans et non continûment, précisément pour que chaque
 * position corresponde à un clic entendu. `stepsPassed` donne le cran, la même
 * fonction que le mixage — l'image et le son ne peuvent pas se désynchroniser.
 */
function HookDial() {
  const frame = useCurrentFrame()
  const notch = stepsPassed(frame, DIAL_TICKS)
  const progress = notch / DIAL_TICKS.count

  // Deux euros au premier cran, dix-neuf mille au dernier : l'échelle est
  // logarithmique, comme le prix par client dans l'app.
  const price = Math.round(2 * (19_389 / 2) ** progress)
  const animal = animalFor(price)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Price per customer</Eyebrow>

      <DialFace value={formatCurrency(price)} progress={progress} size={470} label="Per month" />

      <p
        style={{
          ...display,
          margin: '52px 0 0',
          fontSize: 82,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: LUME,
        }}
      >
        {animal.name}
      </p>
    </AbsoluteFill>
  )
}

const TRADE_TICKS = ticksOf(TIMELINE, 'trade')

/** Ce que le prix décide vraiment. Une ligne s'allume par cran. */
function Trade() {
  const frame = useCurrentFrame()
  const shown = stepsPassed(frame, TRADE_TICKS)

  const rows = [
    { label: 'Who sells', mouse: 'Nobody', whale: 'A sales team' },
    { label: 'Who onboards', mouse: 'A tooltip', whale: 'Three weeks' },
    { label: 'Customers needed', mouse: '5,000', whale: '12' },
  ]

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 70px' }}>
      <Eyebrow>What the price decides</Eyebrow>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rows.map((row, index) => {
          const lit = index < shown

          return (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: 28,
                padding: '30px 36px',
                borderRadius: 24,
                border: `1px solid ${lit ? 'oklch(0.92 0.145 112 / 0.34)' : 'oklch(1 0 0 / 0.08)'}`,
                backgroundColor: 'oklch(0.16 0.006 110)',
                opacity: lit ? 1 : 0.22,
                transform: `translateX(${lit ? 0 : -34}px)`,
              }}
            >
              <span
                style={{
                  ...display,
                  fontSize: 32,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: DIM,
                }}
              >
                {row.label}
              </span>
              <span style={{ ...display, fontSize: 40, fontWeight: 700, color: INK }}>{row.mouse}</span>
              <span
                style={{
                  ...display,
                  fontSize: 40,
                  fontWeight: 700,
                  color: LUME,
                  paddingLeft: 28,
                  borderLeft: '1px solid oklch(1 0 0 / 0.12)',
                }}
              >
                {row.whale}
              </span>
            </div>
          )
        })}
      </div>

      <p style={{ ...display, margin: '44px 0 0', fontSize: 30, letterSpacing: '0.2em', color: DIM }}>
        MOUSE · WHALE
      </p>
    </AbsoluteFill>
  )
}

const SHOT_NODES: Record<string, React.ReactNode> = {
  'hook-dial': <HookDial />,
  title: <LetterLine text="Which animal are you" accent="animal" />,
  stairs: <Stairs />,
  mouse: <AnimalBeat animal="Mice" title="Spotify" note={landmarkMonthly('spotify')} turns={0.28} />,
  whale: <AnimalBeat animal="Whales" title="Salesforce" note={landmarkMonthly('salesforce')} turns={0.24} />,
  trade: <Trade />,
  'same-money': <SameMoney />,
  closing: <Closing halo={150} />,
}

export function Ladder35({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-ladder.mp3"
      sound={sound}
    />
  )
}
