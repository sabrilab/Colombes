import React, { useRef } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency } from '../src/lib/format'
import { Closing, DialFace, Emoji, Eyebrow, Film, LetterLine, PricePad, SpeedLines, Whip } from './kit'
import { Scene3D } from './Scene3D'
import { lume, plaster, project, standardLights, type CameraMove, type CameraSpec } from './three'
import { DIM, INK, LUME, RED, centred, display, mono, useCount } from './tokens'
import { stepsPassed, ticksOf } from './motion.mjs'
import { TIMELINE, TOTAL_FRAMES } from './cuts/levers.mjs'
import captions from './captions-levers.json'

/**
 * « The two levers » — le premier grain de la bible, en un film.
 *
 * Il corrige une croyance précise, et une seule : « il me faut plus de clients ».
 * Tout le montage est construit pour la rendre visible, puis la retourner — le
 * revenu est une surface, ses deux côtés la font grandir pareil, et un seul des
 * deux est gratuit.
 *
 * Les six premières secondes sont un seul mouvement, sans coupe : la caméra
 * traverse un nuage de dix mille cubes qui finissent par s'ordonner en mur. Le
 * désordre qui devient grille, c'est la croyance elle-même — dix mille personnes
 * qu'on imagine comme une masse et qu'il faudra trouver une par une. Rien à lire
 * pendant ce temps, seulement un compteur qui monte.
 *
 * Les chiffres du coût viennent de `compute()` et de `DEFAULT_INPUTS.cac` : le
 * million huit cent mille euros n'est pas une figure de style, c'est dix mille
 * clients au coût d'acquisition par défaut de l'app.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Le cas, calculé une fois
   ──────────────────────────────────────────────────────────────────────────── */

const START_CUSTOMERS = 1_000
const START_PRICE = 10
const TARGET_CUSTOMERS = 10_000

/**
 * Les deux factures d'acquisition, au tarif par défaut de l'app.
 *
 * Elles ne se confondent pas, et la première version du film les avait mélangées :
 * doubler de mille à deux mille clients coûte mille acquisitions, pas neuf mille.
 * `DOUBLING_BILL` est donc le coût du plan qui double, `FULL_BILL` celui d'un parc
 * de dix mille clients — chacun sur son plan, chacun avec son intitulé.
 */
const DOUBLING_BILL = START_CUSTOMERS * DEFAULT_INPUTS.cac
const FULL_BILL = TARGET_CUSTOMERS * DEFAULT_INPUTS.cac

/* ────────────────────────────────────────────────────────────────────────────
   L'accroche — six secondes, un seul mouvement
   ──────────────────────────────────────────────────────────────────────────── */

const STORM_SIZE = { width: 1080, height: 1920 }
const STORM_COUNT = 260
const GRID_COLUMNS = 20

/**
 * Les positions de départ et d'arrivée de chaque cube.
 *
 * Déterministes, comme partout : Remotion capture parfois deux fois la même
 * image dans deux onglets différents, et un tirage au sort donnerait deux nuages.
 * La suite est irrégulière sans être aléatoire — c'est tout ce qu'on demande à
 * une dispersion.
 */
const STORM = Array.from({ length: STORM_COUNT }, (_, index) => {
  const angle = index * 2.399
  const radius = 0.9 + ((index * 37) % 100) / 100 * 2.6

  return {
    chaos: [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      -1.5 - ((index * 53) % 100) / 100 * 26,
    ] as [number, number, number],
    order: [
      ((index % GRID_COLUMNS) - (GRID_COLUMNS - 1) / 2) * 0.26,
      (Math.floor(index / GRID_COLUMNS) - STORM_COUNT / GRID_COLUMNS / 2 + 0.5) * 0.26,
      -3.2,
    ] as [number, number, number],
    spin: ((index * 71) % 100) / 100,
    // Un cube sur onze passe en citron une fois rangé : la grille respire au lieu
    // d'être un mur uniforme.
    lit: index % 11 === 0,
  }
})

/**
 * La caméra recule en décélérant fort.
 *
 * Elle part au milieu du nuage — les cubes fusent de part et d'autre — et
 * s'immobilise devant la grille. Une seule course, sans coupe : c'est ce qui fait
 * la différence entre une ouverture qui accroche et une suite de plans.
 */
const stormCamera: CameraMove = (progress) => {
  const eased = 1 - (1 - progress) ** 3.4
  return {
    position: [Math.sin(progress * 3.1) * 0.4 * (1 - eased), 0.1, -22 + eased * 22.9],
    target: [0, 0, -3.2],
    fov: 68 - eased * 18,
  }
}

function CustomerStorm() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const cubes = useRef<THREE.Mesh[]>([])

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0
  // Le rangement n'occupe que le dernier tiers : avant, c'est le chaos qui doit
  // se lire, et il n'en a pas moins besoin de temps que la grille.
  const settled = interpolate(progress, [0.55, 0.95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })
  const counted = Math.round(TARGET_CUSTOMERS * interpolate(progress, [0.1, 0.92], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 2.2,
  }))

  return (
    <AbsoluteFill style={centred}>
      <Scene3D
        {...STORM_SIZE}
        camera={stormCamera}
        build={(scene) => {
          standardLights(scene)
          cubes.current = STORM.map((cube) => {
            const mesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.17, 0.17, 0.17),
              cube.lit ? lume(0.55) : plaster(0xdededa),
            )
            scene.add(mesh)
            return mesh
          })
        }}
        update={(shotFrame, shotProgress) => {
          const settle = interpolate(shotProgress, [0.55, 0.95], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: (t) => 1 - (1 - t) ** 3,
          })

          cubes.current.forEach((mesh, index) => {
            const cube = STORM[index]
            // Chaque cube rejoint sa case avec un décalage propre : rangés tous
            // ensemble, ils formeraient un bloc qui se translate, pas une foule
            // qui s'aligne.
            const own = Math.min(1, Math.max(0, settle * 1.6 - (cube.spin * 0.6)))
            const eased = own ** 1.6

            mesh.position.set(
              cube.chaos[0] + (cube.order[0] - cube.chaos[0]) * eased,
              cube.chaos[1] + (cube.order[1] - cube.chaos[1]) * eased,
              cube.chaos[2] + (cube.order[2] - cube.chaos[2]) * eased,
            )
            const spin = (1 - eased) * (2 + cube.spin * 6)
            mesh.rotation.set(shotFrame * 0.03 * spin, shotFrame * 0.02 * spin, cube.spin * 3 * (1 - eased))
          })
        }}
      />

      <AbsoluteFill style={{ ...centred, justifyContent: 'flex-end', paddingBottom: 300 }}>
        <p
          style={{
            ...mono,
            margin: 0,
            fontSize: 148,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: INK,
            textShadow: `0 0 60px oklch(0 0 0 / 0.9), 0 0 90px oklch(0.92 0.145 112 / ${0.3 * settled})`,
          }}
        >
          {counted.toLocaleString('en-US')}
        </p>
        <p
          style={{
            ...display,
            margin: '4px 0 0',
            fontSize: 34,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: DIM,
            opacity: settled,
          }}
        >
          Customers
        </p>
      </AbsoluteFill>

      <SpeedLines count={22} />
    </AbsoluteFill>
  )
}

/**
 * Le retournement, en deux temps sur un seul plan.
 *
 * La voix dit « c'est l'instinct » puis « et c'est le cher » en un souffle : deux
 * plans auraient imposé une coupe au milieu d'une phrase. Ici le premier mot
 * s'efface sous le second, qui arrive en rouge — la sanction est dans la couleur
 * avant d'être dans le texte.
 */
function Instinct() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const first = spring({ frame, fps, config: { damping: 200, mass: 0.5 } })
  const swap = spring({ frame: frame - 34, fps, config: { damping: 200, mass: 0.5 } })

  return (
    <AbsoluteFill style={centred}>
      <p
        style={{
          ...display,
          position: 'absolute',
          margin: 0,
          fontSize: 118,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          color: INK,
          opacity: first * (1 - swap),
          transform: `translateY(${(1 - first) * 40 - swap * 60}px)`,
          filter: `blur(${(1 - first) * 20 + swap * 24}px)`,
        }}
      >
        The instinct
      </p>

      <p
        style={{
          ...display,
          position: 'absolute',
          margin: 0,
          textAlign: 'center',
          fontSize: 104,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          lineHeight: 1.04,
          color: RED,
          opacity: swap,
          transform: `translateY(${(1 - swap) * 70}px) scale(${interpolate(swap, [0, 1], [1.2, 1])})`,
          filter: `blur(${(1 - swap) * 26}px)`,
        }}
      >
        And the
        <br />
        expensive one
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le revenu n'est pas une ligne
   ──────────────────────────────────────────────────────────────────────────── */

/** Une ligne qui se trace, puis se fait barrer : la fausse image du revenu. */
function NotALine() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const draw = spring({ frame: frame - 4, fps, config: { damping: 200, mass: 0.7 } })
  const strike = spring({ frame: frame - 34, fps, config: { damping: 200, mass: 0.5 } })

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Revenue is not</Eyebrow>

      <div style={{ position: 'relative', width: 880, height: 460 }}>
        <svg viewBox="0 0 880 460" style={{ position: 'absolute', inset: 0 }}>
          <path
            d="M 40 400 L 840 90"
            fill="none"
            stroke={LUME}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - draw}
          />
          {/* La barre qui l'annule part de l'autre côté : deux traits qui se
              croisent se lisent comme un refus, deux traits parallèles non. */}
          <path
            d="M 90 110 L 800 380"
            fill="none"
            stroke={RED}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - strike}
          />
        </svg>
      </div>

      <p
        style={{
          ...display,
          margin: '30px 0 0',
          fontSize: 96,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          color: INK,
          opacity: interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        A line
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   La surface, et ses deux côtés
   ──────────────────────────────────────────────────────────────────────────── */

const SURFACE_SIZE = { width: 1040, height: 1000 }

/** La caméra tourne autour de la dalle : c'est un volume, pas un dessin. */
const surfaceCamera: CameraMove = (progress) => {
  const angle = -0.75 + progress * 1.15
  return {
    position: [Math.sin(angle) * 4.6, 2.4 - progress * 0.4, Math.cos(angle) * 4.6],
    target: [0, 0.2, 0],
    fov: 34,
  }
}

/**
 * La dalle du revenu, avec ses deux côtés nommés.
 *
 * `axis` décide lequel des deux grandit : la largeur pour les clients, la
 * profondeur pour le prix. Le même composant sert donc les trois plans — la
 * surface qui s'installe, puis chacun des deux leviers — et les trois montrent
 * forcément le même objet, ce qui est tout l'argument.
 */
function Surface({
  axis,
  label,
  cost,
}: {
  axis: 'both' | 'customers' | 'price'
  label: string
  cost?: string
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slabRef = useRef<THREE.Mesh | null>(null)
  const grow = spring({ frame: frame - 8, fps, config: { damping: 200, mass: 1 } })

  const customers = axis === 'customers' ? START_CUSTOMERS * (1 + grow) : START_CUSTOMERS
  const price = axis === 'price' ? START_PRICE * (1 + grow) : START_PRICE

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={4}>{label}</Eyebrow>

      <Scene3D
        {...SURFACE_SIZE}
        camera={surfaceCamera}
        build={(scene) => {
          standardLights(scene)
          const slab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lume(0.3))
          scene.add(slab)

          // La grille donne l'échelle : sans elle, une dalle qui grandit
          // ressemble à une dalle dont on s'approche.
          const grid = new THREE.GridHelper(7, 14, 0x4a4a44, 0x2b2b28)
          grid.position.y = -0.003
          scene.add(grid)
          slabRef.current = slab
        }}
        update={(shotFrame) => {
          const slab = slabRef.current
          if (!slab) return
          const pushed = Math.min(1, Math.max(0, (shotFrame - 8) / 44))
          const eased = 1 - (1 - pushed) ** 3

          const base = axis === 'both' ? eased : 1
          const width = 1.5 * base * (axis === 'customers' ? 1 + eased : 1)
          const depth = 1.1 * base * (axis === 'price' ? 1 + eased : 1)

          slab.scale.set(Math.max(width, 0.02), 0.3, Math.max(depth, 0.02))
          slab.position.set(0, 0.15, 0)
        }}
      />

      <p style={{ ...mono, margin: '6px 0 0', fontSize: 96, fontWeight: 600, color: INK }}>
        {formatCurrency(Math.round(price * customers))}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 28, letterSpacing: '0.2em', color: DIM }}>
        {formatCurrency(Math.round(price))} × {Math.round(customers).toLocaleString('en-US')}
      </p>

      {cost && (
        <p
          style={{
            ...display,
            margin: '26px 0 0',
            fontSize: 38,
            fontWeight: 700,
            color: cost === 'free' ? LUME : RED,
            opacity: interpolate(frame, [46, 62], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {cost === 'free'
            ? 'Costs nothing'
            : `${START_CUSTOMERS.toLocaleString('en-US')} more to acquire · ${formatCurrency(DOUBLING_BILL)}`}
        </p>
      )}
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Ce que coûte la voie chère
   ──────────────────────────────────────────────────────────────────────────── */

const CHORE_TICKS = ticksOf(TIMELINE, 'chores')

/** Quatre corvées, quatre crans : trouver, convaincre, installer, garder. */
function Chores() {
  const frame = useCurrentFrame()
  const shown = stepsPassed(frame, CHORE_TICKS)

  const chores = [
    { emoji: '🔎', label: 'Find them' },
    { emoji: '💬', label: 'Convince them' },
    { emoji: '🧑‍🏫', label: 'Onboard them' },
    { emoji: '🔒', label: 'Keep them' },
  ]

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 80px' }}>
      <Eyebrow>{TARGET_CUSTOMERS.toLocaleString('en-US')} customers means</Eyebrow>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {chores.map((chore, index) => {
          const lit = index < shown

          return (
            <div
              key={chore.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                padding: '26px 36px',
                borderRadius: 26,
                border: `1px solid ${lit ? 'oklch(0.7 0.2 25 / 0.34)' : 'oklch(1 0 0 / 0.06)'}`,
                backgroundColor: 'oklch(0.165 0.006 110)',
                opacity: lit ? 1 : 0.1,
                transform: `translateX(${lit ? 0 : 52}px)`,
              }}
            >
              <Emoji size={68}>{chore.emoji}</Emoji>
              <span style={{ ...display, fontSize: 52, fontWeight: 700, color: INK }}>{chore.label}</span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/**
 * La facture, chiffre par chiffre.
 *
 * Le million huit cent mille euros n'est pas une figure de style : c'est neuf
 * mille clients au coût d'acquisition par défaut de l'app. Les deux facteurs sont
 * à l'image au-dessus du total, pour qu'on puisse refaire le calcul.
 */
function Bill() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const count = useCount(FULL_BILL, { delay: 16, duration: 44 })
  const punch = spring({ frame: frame - 62, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={centred}>
      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 62,
          color: DIM,
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        {TARGET_CUSTOMERS.toLocaleString('en-US')} × {formatCurrency(DEFAULT_INPUTS.cac)}
      </p>

      <p
        style={{
          ...mono,
          margin: '30px 0 0',
          fontSize: 134,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: RED,
          textShadow: `0 0 70px oklch(0.7 0.2 25 / ${0.35 + punch * 0.3})`,
          transform: `scale(${1 + punch * 0.04})`,
        }}
      >
        {formatCurrency(Math.round(count))}
      </p>

      <p
        style={{
          ...display,
          margin: '18px 0 0',
          fontSize: 30,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        To acquire, at {formatCurrency(DEFAULT_INPUTS.cac)} each
      </p>
    </AbsoluteFill>
  )
}

/**
 * L'objection qu'on oppose toujours au levier du prix : « ils vont partir ».
 *
 * Elle est fondée, et elle ne change pas la conclusion. Trois barres, toutes
 * sorties du moteur : ne rien faire, doubler le prix en perdant un cinquième des
 * clients, doubler la clientèle. La deuxième rapporte soixante pour cent de plus
 * que la première pour zéro euro — c'est ce que veut dire « l'arithmétique n'est
 * pas serrée ». La troisième rapporte un peu plus encore, et coûte cent quatre-
 * vingt mille euros.
 *
 * La première version de ce plan comparait le prix doublé à dix fois la clientèle
 * et montrait donc l'inverse de ce que la voix affirme. Une illustration qui
 * contredit son commentaire est pire qu'une absence d'illustration.
 */
const LEAVING = 0.2

function mrrOf(price, customers) {
  return compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price, mix: 1 }],
    customers,
    newCustomersPerMonth: 40,
  }).revenue.mrr
}

const OUTCOMES = [
  {
    key: 'today',
    label: 'Today',
    note: `${START_CUSTOMERS.toLocaleString('en-US')} × ${formatCurrency(START_PRICE)}`,
    value: mrrOf(START_PRICE, START_CUSTOMERS),
    bill: '—',
    tone: DIM,
  },
  {
    key: 'price',
    label: 'Double the price',
    note: `−${Math.round(LEAVING * 100)} % of them leave`,
    value: mrrOf(START_PRICE * 2, Math.round(START_CUSTOMERS * (1 - LEAVING))),
    bill: 'Costs nothing',
    tone: LUME,
  },
  {
    key: 'customers',
    label: 'Double the customers',
    note: 'Every one of them found',
    value: mrrOf(START_PRICE, START_CUSTOMERS * 2),
    bill: `Costs ${formatCurrency(DOUBLING_BILL)}`,
    tone: RED,
  },
]

function EvenThen() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const widest = Math.max(...OUTCOMES.map((outcome) => outcome.value))

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 80px' }}>
      <Eyebrow>Some of them will leave</Eyebrow>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 44 }}>
        {OUTCOMES.map((outcome, index) => {
          const grow = spring({ frame: frame - 8 - index * 12, fps, config: { damping: 200, mass: 0.9 } })

          return (
            <div key={outcome.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ ...display, fontSize: 34, fontWeight: 700, color: INK }}>
                  {outcome.label}
                </span>
                <span style={{ ...mono, fontSize: 48, fontWeight: 600, color: outcome.tone }}>
                  {formatCurrency(Math.round(outcome.value * grow))}
                </span>
              </div>

              <div
                style={{
                  marginTop: 14,
                  height: 30,
                  borderRadius: 999,
                  backgroundColor: 'oklch(0.1 0 0 / 0.7)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(outcome.value / widest) * 100 * grow}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, color-mix(in oklab, ${outcome.tone} 45%, transparent), ${outcome.tone})`,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ ...display, fontSize: 25, letterSpacing: '0.1em', color: DIM }}>
                  {outcome.note}
                </span>
                <span
                  style={{
                    ...display,
                    fontSize: 25,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: outcome.tone,
                  }}
                >
                  {outcome.bill}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

const DIAL_TICKS = ticksOf(TIMELINE, 'afternoon')

/** L'autre levier : une molette, un après-midi, zéro euro. */
function Afternoon() {
  const frame = useCurrentFrame()
  const notch = stepsPassed(frame, DIAL_TICKS)
  const progress = notch / DIAL_TICKS.count
  const price = Math.round(START_PRICE * (1 + progress))

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>The other lever</Eyebrow>

      <DialFace value={formatCurrency(price)} progress={progress} size={450} label="Price per month" />

      <p
        style={{
          ...display,
          margin: '48px 0 0',
          fontSize: 62,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: LUME,
        }}
      >
        One afternoon
      </p>
      <p style={{ ...mono, margin: '10px 0 0', fontSize: 54, color: DIM }}>{formatCurrency(0)}</p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Les deux leviers, côte à côte
   ──────────────────────────────────────────────────────────────────────────── */

const COMPARE_SIZE = { width: 1040, height: 860 }
const COMPARE_CAMERA: CameraSpec = { position: [0, 1.3, 4.8], target: [0, 0.42, 0], fov: 32 }

/**
 * Deux blocs de même contenance, et leur facture sous eux.
 *
 * C'est le plan qui conclut la démonstration : le volume — l'argent — est
 * identique, et tout le reste diffère. Les proportions sont vérifiées à la
 * construction, parce qu'un schéma dont les parts ne s'égalent pas ne prouve rien.
 */
const COMPARE = [
  {
    key: 'customers',
    width: 1.5,
    height: 0.2,
    x: -0.78,
    label: `2,000 × ${formatCurrency(START_PRICE)}`,
    bill: formatCurrency(DOUBLING_BILL),
  },
  {
    key: 'price',
    width: 0.38,
    height: 0.79,
    x: 0.78,
    label: `1,000 × ${formatCurrency(START_PRICE * 2)}`,
    bill: 'Free',
  },
]
const COMPARE_DEPTH = 0.8

const [wide, tall] = COMPARE
if (Math.abs(wide.width * wide.height - tall.width * tall.height) > 0.002) {
  throw new Error('Les deux leviers ne produisent pas la même chose.')
}

function Compare() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pivotRef = useRef<THREE.Group | null>(null)
  const enter = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.8 } })

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={8}>Exactly the same money</Eyebrow>

      <div style={{ position: 'relative', ...COMPARE_SIZE }}>
        <Scene3D
          {...COMPARE_SIZE}
          camera={COMPARE_CAMERA}
          build={(scene) => {
            standardLights(scene)
            const pivot = new THREE.Group()

            for (const block of COMPARE) {
              const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(block.width, block.height, COMPARE_DEPTH),
                block.key === 'price' ? lume(0.32) : plaster(0xe4e4dc),
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
            if (pivotRef.current) pivotRef.current.rotation.y = Math.sin(progress * Math.PI) * 0.4 - 0.16
          }}
        />

        {COMPARE.map((block) => {
          const foot = project([block.x, 0, COMPARE_DEPTH / 2], COMPARE_CAMERA, COMPARE_SIZE.width, COMPARE_SIZE.height)

          return (
            <span
              key={block.key}
              style={{
                position: 'absolute',
                left: foot.x,
                top: foot.y + 34,
                transform: 'translateX(-50%)',
                textAlign: 'center',
                opacity: enter,
              }}
            >
              <span style={{ ...mono, display: 'block', fontSize: 40, color: INK, whiteSpace: 'nowrap' }}>
                {block.label}
              </span>
              <span
                style={{
                  ...display,
                  display: 'block',
                  marginTop: 8,
                  fontSize: 30,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: block.bill === 'Free' ? LUME : RED,
                  whiteSpace: 'nowrap',
                }}
              >
                {block.bill}
              </span>
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

const WORK_TICKS = ticksOf(TIMELINE, 'looks-like-work')

/** Pourquoi on tire quand même le mauvais levier : il ressemble à du travail. */
function LooksLikeWork() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const rows = [
    { emoji: '🧑‍💼', label: 'Hiring' },
    { emoji: '📣', label: 'Advertising' },
  ]
  const shown = stepsPassed(frame, WORK_TICKS)

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 80px', gap: 26 }}>
      <Eyebrow>Why the expensive one wins</Eyebrow>

      {rows.map((row, index) => {
        const enter = spring({
          frame: frame - (index < shown ? 0 : 999),
          fps,
          config: { damping: 200, mass: 0.6 },
        })
        const last = false

        return (
          <div
            key={row.label}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '26px 32px',
              borderRadius: 26,
              border: `1px solid ${last ? 'oklch(0.92 0.145 112 / 0.4)' : 'oklch(1 0 0 / 0.08)'}`,
              background: last ? 'oklch(0.92 0.145 112 / 0.09)' : 'oklch(0.165 0.006 110)',
              opacity: enter,
              transform: `translateY(${(1 - enter) * 34}px)`,
            }}
          >
            <Emoji size={62}>{row.emoji}</Emoji>
            <span style={{ ...display, flex: 1, fontSize: 42, fontWeight: 700, color: INK }}>
              {row.label}
            </span>
            <span
              style={{
                ...display,
                fontSize: 28,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: DIM,
                textAlign: 'right',
              }}
            >
              looks like work
            </span>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le montage
   ──────────────────────────────────────────────────────────────────────────── */

const SHOT_NODES: Record<string, React.ReactNode> = {
  storm: <CustomerStorm />,
  instinct: <Instinct />,
  'not-a-line': <NotALine />,
  surface: <Surface axis="both" label="Revenue is a surface" />,
  'more-customers': <Surface axis="customers" label="Double the customers" cost="paid" />,
  'more-price': <Surface axis="price" label="Double the price" cost="free" />,
  compare: <Compare />,
  chores: <Chores />,
  bill: <Bill />,
  before: (
    <>
      <SpeedLines count={20} tone={RED} />
      <Whip from="left" distance={320}>
        <LetterLine text="Spent before anyone pays you back" accent="before" size={86} />
      </Whip>
    </>
  ),
  afternoon: <Afternoon />,
  'even-then': <EvenThen />,
  'one-is-free': (
    <Whip from="up" distance={240}>
      <LetterLine text="One lever is free" accent="free" size={128} />
    </Whip>
  ),
  'looks-like-work': <LooksLikeWork />,
  'does-not': (
    <Whip from="in" blur={30}>
      <LetterLine text="Changing one number does not" accent="does not" size={94} />
    </Whip>
  ),
  pad: <PricePad caption="Both levers, one plate" />,
  closing: <Closing halo={200} />,
}

export function Levers70({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-levers.mp3"
      captions={captions}
      sound={sound}
    />
  )
}
