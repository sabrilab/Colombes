import React from 'react'
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { DoveLogo, ColombesWordmark } from '../src/components/DoveLogo'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency, formatMultiple } from '../src/lib/format'
import { PRICING_ANIMALS } from '../src/lib/pricePad'
import { LANDMARKS, landmarkAcv } from '../src/lib/landmarks'

/**
 * Quarante secondes de présentation, jouées par le design system lui-même.
 *
 * Deux règles tenues d'un bout à l'autre :
 *  — un seul objet à l'écran à la fois, jamais une capture d'interface ;
 *  — tous les chiffres sortent de `compute()`, le moteur de production, donc
 *    ce que le spectateur voit est reproductible dans l'app à la seconde près.
 */

const LUME = 'oklch(0.92 0.145 112)'
const INK = 'oklch(0.98 0.005 110)'
const DIM = 'oklch(0.72 0 0)'
const BG = 'oklch(0.125 0.006 110)'

const display = { fontFamily: "'Chakra Petch', system-ui, sans-serif" } as const

/** Les paliers en français : la vidéo l'est, ils doivent l'être. */
const TIERS_FR: Record<string, string> = {
  Mice: 'Souris',
  Rabbits: 'Lapins',
  Deer: 'Cerfs',
  Elephants: 'Éléphants',
  Whales: 'Baleines',
}
const mono = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontVariantNumeric: 'tabular-nums',
} as const

/** Le fond commun : les halos de la marque, plus un grain très fin. */
function Ground() {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(60rem 40rem at 12% -8%, oklch(0.72 0.11 112 / 0.18), transparent 62%),' +
            'radial-gradient(50rem 34rem at 96% 108%, oklch(0.68 0.06 235 / 0.12), transparent 60%)',
        }}
      />
    </AbsoluteFill>
  )
}

/** Entrée standard d'un plan : monte et se pose, sur le ressort de la marque. */
function useRise(delay = 0) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } })
  return { opacity: s, transform: `translateY(${(1 - s) * 40}px)` }
}

/** 01 — La marque. La colombe tourne dans l'espace, le logotype se pose. */
function OpenBrand() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 200, mass: 1.2 } })
  const spin = interpolate(frame, [0, 60], [-70, 0], { extrapolateRight: 'clamp' })
  const wordmark = spring({ frame: frame - 34, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1400 }}>
      <div
        style={{
          width: 300,
          color: LUME,
          transform: `rotateY(${spin}deg) scale(${0.6 + s * 0.4})`,
          opacity: s,
          filter: `drop-shadow(0 0 ${40 * s}px oklch(0.92 0.145 112 / 0.5))`,
        }}
      >
        <DoveLogo className="" />
      </div>
      <div style={{ height: 70 }} />
      <div
        style={{
          width: 560,
          color: INK,
          opacity: wordmark,
          transform: `translateY(${(1 - wordmark) * 24}px)`,
        }}
      >
        <ColombesWordmark className="" />
      </div>
    </AbsoluteFill>
  )
}

/** Un titre seul sur le fond. Le plan le plus simple, et le plus efficace. */
function Statement({ lines, accent }: { lines: string[]; accent?: number }) {
  const rise = useRise()

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '0 90px' }}>
      <div style={{ ...rise, textAlign: 'center' }}>
        {lines.map((line, index) => (
          <p
            key={line}
            style={{
              ...display,
              margin: 0,
              fontSize: 96,
              lineHeight: 1.05,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: index === accent ? LUME : INK,
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </AbsoluteFill>
  )
}

/** 03 — Le revenu est une surface. Le seul plan qui montre le geste du pad. */
function Surface() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const grow = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.9 } })

  const price = Math.round(6 + grow * 23)
  const customers = Math.round(40 + grow * 460)
  const mrr = price * customers

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 820,
          height: 620,
          borderRadius: 28,
          border: '1px solid oklch(1 0 0 / 0.12)',
          backgroundColor: 'oklch(0.16 0.006 110)',
          boxShadow: 'inset 0 0 80px -10px oklch(0 0 0 / 0.6)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: `${(customers / 700) * 100}%`,
            height: `${(price / 44) * 100}%`,
            background:
              'linear-gradient(to top right, oklch(0.92 0.145 112 / 0.06), oklch(0.92 0.145 112 / 0.34))',
            borderRight: '2px solid oklch(0.92 0.145 112 / 0.7)',
            borderTop: '2px solid oklch(0.92 0.145 112 / 0.7)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${(customers / 700) * 100}%`,
            bottom: `${(price / 44) * 100}%`,
            transform: 'translate(-50%, 50%)',
            width: 92,
            height: 92,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid oklch(0.92 0.145 112 / 0.5)',
            background: 'radial-gradient(circle at 32% 26%, oklch(1 0 0 / 0.18), oklch(0.13 0 0))',
            boxShadow: '0 0 44px -6px oklch(0.92 0.145 112 / 0.8)',
          }}
        >
          <div style={{ width: 40, color: LUME }}>
            <DoveLogo className="" />
          </div>
        </div>
      </div>

      <p style={{ ...mono, marginTop: 56, fontSize: 104, fontWeight: 600, color: INK }}>
        {formatCurrency(mrr)}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 28, letterSpacing: '0.2em', color: DIM }}>
        MRR
      </p>
    </AbsoluteFill>
  )
}

/** 04 — L'échelle habitée : les paliers, et une marque connue qui s'y pose. */
function Ladder() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = { min: 1, max: 30_000 }
  const yOf = (price: number) =>
    1 - Math.log(Math.min(scale.max, Math.max(scale.min, price)) / scale.min) / Math.log(scale.max / scale.min)

  const shown = ['spotify', 'shopify', 'salesforce']

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 860,
          height: 1180,
          borderRadius: 28,
          border: '1px solid oklch(1 0 0 / 0.1)',
          backgroundColor: 'oklch(0.155 0.006 110)',
          overflow: 'hidden',
        }}
      >
        {PRICING_ANIMALS.map((animal, index) => {
          const top = yOf(Math.min(animal.maxPrice, scale.max))
          const bottom = yOf(animal.minPrice)
          const appear = spring({ frame: frame - index * 5, fps, config: { damping: 200 } })

          return (
            <div
              key={animal.name}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${top * 100}%`,
                height: `${(bottom - top) * 100}%`,
                borderTop: '1px dashed oklch(1 0 0 / 0.1)',
                opacity: appear,
              }}
            >
              <span
                style={{
                  ...display,
                  position: 'absolute',
                  left: 28,
                  top: 14,
                  fontSize: 26,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: DIM,
                }}
              >
                {TIERS_FR[animal.name] ?? animal.name}
              </span>
            </div>
          )
        })}

        {LANDMARKS.filter((c) => shown.includes(c.id)).map((company, index) => {
          const monthly = landmarkAcv(company) / 12
          const land = spring({ frame: frame - 30 - index * 14, fps, config: { damping: 180 } })

          return (
            <div
              key={company.id}
              style={{
                position: 'absolute',
                right: 28,
                top: `${yOf(monthly) * 100}%`,
                transform: `translate(${(1 - land) * 180}px, -50%)`,
                opacity: land,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 22px',
                borderRadius: 999,
                border: '1px solid oklch(1 0 0 / 0.16)',
                backgroundColor: 'oklch(0.11 0 0 / 0.9)',
              }}
            >
              <span style={{ ...display, fontSize: 30, fontWeight: 700, color: INK }}>
                {company.name}
              </span>
              <span style={{ ...mono, fontSize: 26, color: LUME }}>
                {formatCurrency(Math.round(monthly))}
              </span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/** 05 — Ce qui reste : la cascade, et le bassin qui décide de tout. */
function Cascade() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drain = spring({ frame: frame - 20, fps, config: { damping: 200, mass: 1.1 } })

  const fixedCosts = Math.round(1_500 + drain * 11_000)
  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
    customers: 500,
    newCustomersPerMonth: 25,
    fixedCosts,
  })
  const { mrr, sdeMonthly } = results.revenue
  const losing = sdeMonthly < 0
  const share = Math.max(0, Math.min(1, sdeMonthly / mrr))

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 660,
          height: 900,
          borderRadius: 28,
          border: '1px solid oklch(1 0 0 / 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'oklch(0.155 0.006 110)',
        }}
      >
        <div style={{ flex: 1 - share, backgroundColor: 'oklch(1 0 0 / 0.05)' }} />
        <div
          style={{
            flex: Math.max(share, 0.16),
            backgroundColor: losing ? 'oklch(0.62 0.19 25 / 0.28)' : 'oklch(0.92 0.145 112 / 0.28)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span style={{ ...display, fontSize: 24, letterSpacing: '0.2em', color: DIM }}>
            CE QUI RESTE
          </span>
          <span
            style={{
              ...mono,
              fontSize: 86,
              fontWeight: 600,
              color: losing ? 'oklch(0.7 0.2 25)' : LUME,
            }}
          >
            {formatCurrency(Math.round(sdeMonthly))}
          </span>
        </div>
      </div>

      <p style={{ ...mono, marginTop: 44, fontSize: 34, color: DIM }}>
        Charges fixes {formatCurrency(fixedCosts)}
      </p>
    </AbsoluteFill>
  )
}

/** 06 — Le multiple se construit : neuf lignes, aucune cachée. */
function Buildup() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
    customers: 500,
    newCustomersPerMonth: 25,
  })
  const lines = results.valuation.lines.filter((l) => Math.abs(l.deltaMultiple) > 0.001)
  const widest = Math.max(0.1, ...lines.map((l) => Math.abs(l.deltaMultiple)))

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '0 90px' }}>
      <div style={{ width: '100%' }}>
        {lines.map((line, index) => {
          const grow = spring({ frame: frame - index * 6, fps, config: { damping: 200 } })
          const positive = line.deltaMultiple > 0
          const width = (Math.abs(line.deltaMultiple) / widest) * 50 * grow

          return (
            <div
              key={line.key}
              style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 20 }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end' }}>
                  {!positive && (
                    <span
                      style={{
                        height: 22,
                        width: `${width * 2}%`,
                        borderRadius: '999px 0 0 999px',
                        backgroundColor: 'oklch(0.62 0.19 25 / 0.75)',
                      }}
                    />
                  )}
                </div>
                <span style={{ width: 2, height: 34, backgroundColor: 'oklch(1 0 0 / 0.18)' }} />
                <div style={{ width: '50%' }}>
                  {positive && (
                    <span
                      style={{
                        display: 'block',
                        height: 22,
                        width: `${width * 2}%`,
                        borderRadius: '0 999px 999px 0',
                        backgroundColor: 'oklch(0.92 0.145 112 / 0.8)',
                      }}
                    />
                  )}
                </div>
              </div>
              <span style={{ ...mono, width: 150, fontSize: 26, color: DIM, textAlign: 'right' }}>
                {formatMultiple(line.deltaMultiple, true)}
              </span>
            </div>
          )
        })}

        <p
          style={{
            ...mono,
            marginTop: 56,
            textAlign: 'center',
            fontSize: 120,
            fontWeight: 600,
            color: INK,
          }}
        >
          {formatMultiple(results.valuation.multiple)}
        </p>
        <p
          style={{
            ...display,
            margin: 0,
            textAlign: 'center',
            fontSize: 26,
            letterSpacing: '0.2em',
            color: DIM,
          }}
        >
          MULTIPLE AJUSTÉ
        </p>
      </div>
    </AbsoluteFill>
  )
}

/** 07 — La chute : la marque, et où aller. */
function Closing() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 200 } })
  const url = spring({ frame: frame - 24, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
      <div
        style={{
          opacity: s,
          transform: `translateY(${(1 - s) * 30}px) rotateX(${(1 - s) * 24}deg)`,
          width: 620,
          color: INK,
        }}
      >
        <ColombesWordmark className="" />
      </div>
      <p
        style={{
          ...display,
          marginTop: 44,
          fontSize: 34,
          letterSpacing: '0.06em',
          color: LUME,
          opacity: url,
        }}
      >
        colombes-three.vercel.app
      </p>
    </AbsoluteFill>
  )
}

/** Le montage. Les durées sont en images : 30 par seconde. */
const SHOTS = [
  { at: 0, len: 105, node: <OpenBrand /> },
  { at: 105, len: 135, node: <Statement lines={['Votre app', 'vaut combien ?']} accent={1} /> },
  { at: 240, len: 195, node: <Surface /> },
  { at: 435, len: 105, node: <Statement lines={['Et vous êtes', 'quel animal ?']} accent={1} /> },
  { at: 540, len: 195, node: <Ladder /> },
  { at: 735, len: 105, node: <Statement lines={['Grossir', 'ne suffit pas.']} accent={1} /> },
  { at: 840, len: 165, node: <Cascade /> },
  { at: 1005, len: 135, node: <Buildup /> },
  { at: 1140, len: 60, node: <Closing /> },
]

export function Colombes40() {
  return (
    <AbsoluteFill>
      <Ground />
      {SHOTS.map((shot) => (
        <Sequence key={shot.at} from={shot.at} durationInFrames={shot.len}>
          <Fade>{shot.node}</Fade>
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

/** Fondu d'entrée et de sortie, pour qu'aucun plan ne coupe sec. */
function Fade({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const opacity = Math.min(
    interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
    }),
  )
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
}
