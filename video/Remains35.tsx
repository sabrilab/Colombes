import React, { useRef } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency, formatMultiple } from '../src/lib/format'
import { Closing, Eyebrow, Film, Leader, LetterLine, SliderBar } from './kit'
import { Scene3D } from './Scene3D'
import { lume, plaster, project, standardLights, type CameraSpec } from './three'
import { DIM, INK, LUME, RED, centred, display, mono } from './tokens'
import { stepsPassed, ticksOf } from './motion.mjs'
import { TIMELINE, TOTAL_FRAMES } from './cuts/remains.mjs'

/**
 * « What actually remains » — trente-cinq secondes sur la cascade et le multiple.
 *
 * Le sujet le plus contre-intuitif de l'app : quatorze mille euros de revenu ne
 * font pas quatorze mille euros de revenu pour vous. Un paragraphe le dit mal ; une
 * colonne dont on retire des tranches le dit tout seul.
 *
 * Comme le film de l'échelle, il n'a pas de voix off. Les deux plans de volume — la
 * colonne, puis les neuf barres — sont là parce qu'un empilement et un relief se
 * comprennent d'un coup d'œil, alors que les mêmes valeurs en tableau demandent
 * qu'on les lise.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Le cas, calculé une fois par le moteur de l'app
   ──────────────────────────────────────────────────────────────────────────── */

const CASE = compute({
  ...DEFAULT_INPUTS,
  tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
  customers: 500,
  newCustomersPerMonth: 25,
})

/**
 * Les quatre tranches de la colonne, empilées du bas vers le haut.
 *
 * L'ordre compte, et il est l'inverse de celui qu'on écrirait spontanément : ce qui
 * reste est la tranche du *bas*, et les prélèvements s'entassent au-dessus. C'est
 * ainsi qu'on les retire par le haut, et que le fond du bassin est ce qu'on garde —
 * la métaphore de la cascade, qui est celle de l'app.
 *
 * Rien n'est inventé : `variableCost`, `acquisitionCost` et `fixedCosts` sortent du
 * même calcul que le simulateur, et la dernière tranche est ce qu'il reste — donc la
 * somme retombe exactement sur le revenu. Un schéma dont les parts ne s'additionnent
 * pas est un mensonge, même joli.
 */
const SLICES = [
  { key: 'remains', label: 'What remains', value: CASE.revenue.sdeMonthly, sign: '' },
  { key: 'fixed', label: 'Fixed costs', value: DEFAULT_INPUTS.fixedCosts, sign: '−' },
  { key: 'acquisition', label: 'Acquisition', value: CASE.revenue.acquisitionCost, sign: '−' },
  { key: 'direct', label: 'Direct costs', value: CASE.revenue.variableCost, sign: '−' },
]

/* Les parts doivent retomber sur le revenu, sinon le schéma raconte n'importe quoi. */
const SUM = SLICES.reduce((total, slice) => total + slice.value, 0)
if (Math.abs(SUM - CASE.revenue.mrr) > 1) {
  throw new Error(`Les tranches font ${Math.round(SUM)} € au lieu de ${Math.round(CASE.revenue.mrr)} €.`)
}

const MRR = CASE.revenue.mrr
const COLUMN_HEIGHT = 2.1
const COLUMN_WIDTH = 0.82
const COLUMN_DEPTH = 0.82

/** Chaque tranche occupe la part du revenu qu'elle prend, empilée depuis le bas. */
const STACK = SLICES.reduce<
  { key: string; label: string; value: number; sign: string; height: number; y: number }[]
>((list, slice) => {
  const height = (Math.max(slice.value, 0) / MRR) * COLUMN_HEIGHT
  const below = list.reduce((total, item) => total + item.height, 0)
  list.push({ ...slice, height, y: below + height / 2 })
  return list
}, [])

const COLUMN_CAMERA: CameraSpec = { position: [1.9, 1.9, 3.5], target: [0, 1.05, 0], fov: 32 }
/**
 * La colonne est décalée à droite dans la scène.
 *
 * Les étiquettes se posent sur sa face gauche, et centrée elle ne leur laissait pas
 * la place : le texte passait par-dessus le volume. Déplacer l'objet plutôt que la
 * caméra garde la perspective telle quelle.
 */
const COLUMN_X = 0.34
const COLUMN_SIZE = { width: 1020, height: 1180 }
const COLUMN_TICKS = ticksOf(TIMELINE, 'column')

function Column() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const built = useRef<THREE.Mesh[] | null>(null)
  const taken = stepsPassed(frame, COLUMN_TICKS)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={12}>{formatCurrency(Math.round(MRR))} a month, in</Eyebrow>

      <div style={{ position: 'relative', ...COLUMN_SIZE }}>
        <Scene3D
          {...COLUMN_SIZE}
          camera={COLUMN_CAMERA}
          build={(scene) => {
            standardLights(scene)

            built.current = STACK.map((slice, index) => {
              // La tranche du bas est ce qui reste : c'est la seule en citron.
              const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(COLUMN_WIDTH, Math.max(slice.height, 0.02), COLUMN_DEPTH),
                index === 0 ? lume(0.32) : plaster(0xe6e6df),
              )
              mesh.position.set(COLUMN_X, slice.y, 0)
              scene.add(mesh)
              return mesh
            })
          }}
          update={(shotFrame) => {
            const meshes = built.current
            if (!meshes) return
            const passed = stepsPassed(shotFrame, COLUMN_TICKS)

            // Les prélèvements partent du haut vers le bas, chacun sur son cran.
            // La tranche du bas — ce qui reste — ne part jamais : c'est le propos.
            STACK.forEach((slice, index) => {
              const order = STACK.length - 1 - index
              const going = order >= 0 ? Math.min(1, Math.max(0, passed - order)) : 0
              const eased = going ** 2

              meshes[index].position.x = COLUMN_X + eased * 3.2
              meshes[index].position.y = slice.y - eased * 1.5
              meshes[index].rotation.z = -eased * 0.9
              meshes[index].material.opacity = 1 - eased
              meshes[index].material.transparent = eased > 0
            })
          }}
        />

        {STACK.map((slice, index) => {
          const order = STACK.length - 1 - index
          const gone = order < COLUMN_TICKS.count && taken > order
          const enter = spring({ frame: frame - 8 - index * 6, fps, config: { damping: 200, mass: 0.5 } })

          const edge = project(
            [COLUMN_X - COLUMN_WIDTH / 2, slice.y, COLUMN_DEPTH / 2],
            COLUMN_CAMERA,
            COLUMN_SIZE.width,
            COLUMN_SIZE.height,
          )
          const rail = 300

          return (
            <React.Fragment key={slice.key}>
              <Leader from={{ x: rail, y: edge.y }} to={{ x: edge.x - 14, y: edge.y }} opacity={gone ? 0.18 : enter} />
              <span
                style={{
                  position: 'absolute',
                  left: rail - 16,
                  top: edge.y,
                  transform: 'translate(-100%, -50%)',
                  textAlign: 'right',
                  opacity: gone ? 0.22 : enter,
                }}
              >
                <span
                  style={{
                    ...display,
                    display: 'block',
                    fontSize: 27,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: index === 0 ? LUME : DIM,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {slice.label}
                </span>
                <span style={{ ...mono, display: 'block', fontSize: 32, color: INK, whiteSpace: 'nowrap' }}>
                  {slice.sign}
                  {formatCurrency(Math.round(slice.value))}
                </span>
              </span>
            </React.Fragment>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Les neuf lignes, en relief
   ──────────────────────────────────────────────────────────────────────────── */

const LINES = CASE.valuation.lines
const BARS_CAMERA: CameraSpec = { position: [0, 1.35, 3.35], target: [0, 0.05, 0], fov: 34 }
const BARS_SIZE = { width: 1030, height: 940 }
const BARS_TICKS = ticksOf(TIMELINE, 'multiple')

/** L'amplitude qui fixe l'échelle des barres. */
const WIDEST = Math.max(0.1, ...LINES.map((line) => Math.abs(line.deltaMultiple)))

/**
 * Les neuf lignes du multiple, montées en volume.
 *
 * Une barre par ligne, alignée sur un axe : ce qui pousse vers le haut est en
 * citron, ce qui tire vers le bas en rouge, et une ligne qui pèse zéro reste une
 * dalle plate — elle existe, elle ne bouge simplement pas pour ce cas-là. C'est le
 * plan où le son porte le sens : neuf crans, et on entend qu'il y en a neuf sans
 * les compter.
 */
function MultipleBars() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const built = useRef<THREE.Mesh[] | null>(null)
  const risen = stepsPassed(frame, BARS_TICKS)
  const total = spring({
    frame: frame - BARS_TICKS.from - BARS_TICKS.spread + 10,
    fps,
    config: { damping: 200 },
  })

  // 1,95 et non 2,5 : à neuf barres, les extrêmes sortaient du cadre, et une barre
  // coupée dans un plan qui promet d'en montrer neuf est un contresens.
  const span = 1.95
  const gap = span / (LINES.length - 1)
  const xOf = (index: number) => -span / 2 + index * gap

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={6}>Nine lines build your multiple</Eyebrow>

      <div style={{ position: 'relative', ...BARS_SIZE }}>
        <Scene3D
          {...BARS_SIZE}
          camera={BARS_CAMERA}
          build={(scene) => {
            standardLights(scene)

            // Le plateau : sans lui, les barres flottent et l'axe zéro se perd.
            const deck = new THREE.Mesh(
              new THREE.BoxGeometry(span + 0.42, 0.015, 0.5),
              plaster(0x3a3a34),
            )
            scene.add(deck)

            built.current = LINES.map((line, index) => {
              const positive = line.deltaMultiple >= 0
              const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 1, 0.24),
                positive ? lume(0.3) : plaster(0xc86a5a),
              )
              mesh.position.x = xOf(index)
              scene.add(mesh)
              return mesh
            })
          }}
          update={(shotFrame) => {
            const meshes = built.current
            if (!meshes) return
            const passed = stepsPassed(shotFrame, BARS_TICKS)

            LINES.forEach((line, index) => {
              const grow = Math.min(1, Math.max(0, passed - index))
              // Un minimum de deux centimètres : une ligne à zéro doit rester
              // visible, parce qu'elle fait partie des neuf.
              const height = Math.max(0.02, (Math.abs(line.deltaMultiple) / WIDEST) * 0.95 * grow)
              const up = line.deltaMultiple >= 0 ? 1 : -1

              meshes[index].scale.y = height
              meshes[index].position.y = (up * height) / 2
            })
          }}
        />

        {LINES.map((line, index) => {
          if (index >= risen) return null
          const up = line.deltaMultiple >= 0
          const height = Math.max(0.02, (Math.abs(line.deltaMultiple) / WIDEST) * 0.95)
          const tip = project(
            [xOf(index), up ? height + 0.1 : -height - 0.14, 0],
            BARS_CAMERA,
            BARS_SIZE.width,
            BARS_SIZE.height,
          )

          return (
            <span
              key={line.key}
              style={{
                ...display,
                position: 'absolute',
                left: tip.x,
                top: tip.y,
                // Les intitulés sont longs et les barres serrées : à la verticale,
                // ils se lisent sans se chevaucher.
                transform: 'translate(-50%, -100%) rotate(-90deg) translate(-50%, 0)',
                transformOrigin: '50% 100%',
                whiteSpace: 'nowrap',
                fontSize: 22,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: up ? DIM : RED,
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
          margin: '4px 0 0',
          fontSize: 126,
          fontWeight: 600,
          color: INK,
          opacity: total,
          transform: `scale(${interpolate(total, [0, 1], [0.82, 1])})`,
        }}
      >
        {formatMultiple(CASE.valuation.multiple)}
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Les plans à plat
   ──────────────────────────────────────────────────────────────────────────── */

/** L'accroche : le revenu, énorme et rassurant. */
function HookMrr() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.7 } })
  const doubt = interpolate(frame, [64, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Your app makes</Eyebrow>

      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 176,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          color: INK,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.86, 1])})`,
          textShadow: `0 0 70px oklch(0.92 0.145 112 / ${0.3 * enter})`,
          filter: `blur(${doubt * 14}px)`,
        }}
      >
        {formatCurrency(Math.round(MRR))}
      </p>
      <p style={{ ...display, margin: '10px 0 0', fontSize: 30, letterSpacing: '0.24em', color: DIM }}>
        EVERY MONTH
      </p>

      <p
        style={{
          ...display,
          margin: '46px 0 0',
          fontSize: 132,
          fontWeight: 700,
          color: LUME,
          opacity: doubt,
          transform: `scale(${interpolate(doubt, [0, 1], [0.6, 1])})`,
        }}
      >
        ?
      </p>
    </AbsoluteFill>
  )
}

const SLIDER_TICKS = ticksOf(TIMELINE, 'sliders')

/**
 * Les barres de réglage de l'app, poussées par crans audibles.
 *
 * Les valeurs avancent par paliers de 1/24 et non continûment : chaque position
 * correspond donc à un grésillement entendu. C'est la même fonction que le mixage —
 * une barre qui glisserait sans crans rendrait le son arbitraire.
 */
function Sliders() {
  const frame = useCurrentFrame()
  const notch = stepsPassed(frame, SLIDER_TICKS)
  const progress = notch / SLIDER_TICKS.count

  const rows = [
    { label: 'Gross margin', from: 0.62, to: 0.85, format: (v: number) => `${Math.round(v * 100)} %` },
    { label: 'Fixed costs', from: 9_000, to: 3_500, format: (v: number) => formatCurrency(Math.round(v)) },
    { label: 'Acquisition', from: 340, to: 180, format: (v: number) => `${formatCurrency(Math.round(v))} / client` },
  ]

  const settings = rows.map((row) => row.from + (row.to - row.from) * progress)
  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
    customers: 500,
    newCustomersPerMonth: 25,
    grossMargin: settings[0],
    fixedCosts: settings[1],
    cac: settings[2],
  })
  const losing = results.revenue.sdeMonthly < 0

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 90px' }}>
      <Eyebrow>Three dials, one bottom line</Eyebrow>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 56 }}>
        {rows.map((row, index) => {
          const span = Math.abs(row.to - row.from)
          const share = span === 0 ? 0 : Math.abs(settings[index] - row.from) / span

          return (
            <SliderBar
              key={row.label}
              label={row.label}
              value={row.format(settings[index])}
              progress={0.1 + share * 0.82}
            />
          )
        })}
      </div>

      <p
        style={{
          ...mono,
          margin: '78px 0 0',
          fontSize: 106,
          fontWeight: 600,
          color: losing ? RED : LUME,
        }}
      >
        {formatCurrency(Math.round(results.revenue.sdeMonthly))}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 27, letterSpacing: '0.22em', color: DIM }}>
        WHAT REMAINS
      </p>
    </AbsoluteFill>
  )
}

/** Ce qui reste au fond, seul à l'image. */
function Remains() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.6 } })
  const share = CASE.revenue.sdeMonthly / MRR

  return (
    <AbsoluteFill style={centred}>
      <div
        style={{
          width: 660,
          padding: '54px 0',
          borderRadius: 30,
          border: '1px solid oklch(0.92 0.145 112 / 0.38)',
          background: 'linear-gradient(180deg, oklch(0.92 0.145 112 / 0.2), oklch(0.92 0.145 112 / 0.05))',
          textAlign: 'center',
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        }}
      >
        <p style={{ ...display, margin: 0, fontSize: 28, letterSpacing: '0.22em', color: DIM }}>
          WHAT REMAINS
        </p>
        <p style={{ ...mono, margin: '18px 0 0', fontSize: 128, fontWeight: 600, color: INK }}>
          {formatCurrency(Math.round(CASE.revenue.sdeMonthly))}
        </p>
        <p style={{ ...mono, margin: '10px 0 0', fontSize: 40, color: LUME }}>
          {Math.round(share * 100)} % of {formatCurrency(Math.round(MRR))}
        </p>
      </div>

      <p
        style={{
          ...display,
          margin: '56px 0 0',
          textAlign: 'center',
          fontSize: 40,
          lineHeight: 1.25,
          color: DIM,
          opacity: interpolate(frame, [26, 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        This is what a buyer pays for.
        <br />
        Never the top of the waterfall.
      </p>
    </AbsoluteFill>
  )
}

const SHOT_NODES: Record<string, React.ReactNode> = {
  'hook-mrr': <HookMrr />,
  title: <LetterLine text="That is not your money" accent="your money" size={104} />,
  column: <Column />,
  sliders: <Sliders />,
  remains: <Remains />,
  multiple: <MultipleBars />,
  closing: <Closing halo={180} />,
}

export function Remains35({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-remains.mp3"
      sound={sound}
    />
  )
}
