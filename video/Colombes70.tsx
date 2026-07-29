import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { DoveLogo, ColombesWordmark } from '../src/components/DoveLogo'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency, formatMultiple } from '../src/lib/format'
import { PRICING_ANIMALS } from '../src/lib/pricePad'
import { LANDMARKS, landmarkAcv } from '../src/lib/landmarks'

/**
 * Soixante-dix secondes, en anglais, montées pour le fil d'actualité.
 *
 * Trois règles :
 *  — le hook occupe les trois premières secondes et ne montre rien d'autre ;
 *  — un seul objet à l'image, jamais une capture d'interface ;
 *  — tous les chiffres sortent de `compute()`, le moteur de production, donc
 *    ce qu'on voit est reproductible dans l'app.
 *
 * La voix off est optionnelle : `voiceOver` la branche quand le fichier est
 * déposé dans `public/`. Sans elle, la typographie porte le récit — c'est de
 * toute façon ainsi qu'on regarde une vidéo dans un fil, sans le son.
 */

const LUME = 'oklch(0.92 0.145 112)'
const INK = 'oklch(0.98 0.005 110)'
const DIM = 'oklch(0.68 0 0)'
const RED = 'oklch(0.7 0.2 25)'
const BG = 'oklch(0.125 0.006 110)'

const display = { fontFamily: "'Chakra Petch', system-ui, sans-serif" } as const
const mono = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontVariantNumeric: 'tabular-nums',
} as const

/** Le fond dérive très lentement : une image parfaitement fixe paraît figée. */
function Ground() {
  const frame = useCurrentFrame()
  const drift = interpolate(frame, [0, 2100], [0, 60])

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${-drift}px)`,
          background:
            'radial-gradient(60rem 40rem at 12% -6%, oklch(0.72 0.11 112 / 0.2), transparent 62%),' +
            'radial-gradient(50rem 34rem at 96% 106%, oklch(0.68 0.06 235 / 0.13), transparent 60%)',
        }}
      />
    </AbsoluteFill>
  )
}

/**
 * Un titre seul. L'échelle part légèrement au-dessus de 1 et se resserre :
 * ce très léger recul donne l'impact d'une coupe franche sans bouger la caméra.
 */
function Line({
  text,
  accent,
  size = 118,
}: {
  text: string
  accent?: string
  size?: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 200, mass: 0.5 } })
  const punch = interpolate(s, [0, 1], [1.07, 1])

  const parts = accent ? text.split(accent) : [text]

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <p
        style={{
          ...display,
          margin: 0,
          textAlign: 'center',
          fontSize: size,
          lineHeight: 1.02,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.025em',
          color: INK,
          opacity: s,
          transform: `scale(${punch})`,
        }}
      >
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && <span style={{ color: LUME }}>{accent}</span>}
          </React.Fragment>
        ))}
      </p>
    </AbsoluteFill>
  )
}

/** 01 — Le hook : la colombe, et quatre mots. */
function Hook() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 200, mass: 1 } })
  const spin = interpolate(frame, [0, 50], [-80, 0], { extrapolateRight: 'clamp' })
  const text = spring({ frame: frame - 22, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1400 }}>
      <div
        style={{
          width: 260,
          color: LUME,
          opacity: s,
          transform: `rotateY(${spin}deg) scale(${0.7 + s * 0.3})`,
          filter: `drop-shadow(0 0 ${44 * s}px oklch(0.92 0.145 112 / 0.55))`,
        }}
      >
        <DoveLogo className="" />
      </div>
      <p
        style={{
          ...display,
          marginTop: 80,
          fontSize: 112,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
          opacity: text,
          transform: `translateY(${(1 - text) * 30}px)`,
        }}
      >
        You built an app.
      </p>
    </AbsoluteFill>
  )
}

/**
 * 03 — Le faux chiffre : ce que font les autres calculateurs. Il apparaît net,
 * gros, rassurant — puis se brouille, parce que rien ne l'explique.
 */
function BorrowedNumber() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 200 } })
  const blur = interpolate(frame, [70, 125], [0, 26], { extrapolateLeft: 'clamp' })
  const fade = interpolate(frame, [70, 125], [1, 0.25], { extrapolateLeft: 'clamp' })
  const mark = spring({ frame: frame - 88, fps, config: { damping: 180 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p
        style={{
          ...display,
          margin: 0,
          fontSize: 34,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: DIM,
          opacity: s,
        }}
      >
        Most calculators say
      </p>
      <p
        style={{
          ...mono,
          margin: '28px 0 0',
          fontSize: 150,
          fontWeight: 600,
          color: INK,
          opacity: s * fade,
          filter: `blur(${blur}px)`,
        }}
      >
        €412,000
      </p>
      <p
        style={{
          ...display,
          marginTop: 40,
          fontSize: 150,
          fontWeight: 700,
          color: LUME,
          opacity: mark,
          transform: `scale(${interpolate(mark, [0, 1], [0.6, 1])})`,
        }}
      >
        ?
      </p>
    </AbsoluteFill>
  )
}

/** 05 — Le revenu est une surface : prix en hauteur, clients en largeur. */
function Surface() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const grow = spring({ frame: frame - 8, fps, config: { damping: 200, mass: 0.9 } })

  const price = Math.round(5 + grow * 24)
  const customers = Math.round(30 + grow * 470)
  const mrr = price * customers

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p
        style={{
          ...display,
          margin: '0 0 46px',
          fontSize: 32,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        Revenue is a surface
      </p>

      <div
        style={{
          position: 'relative',
          width: 840,
          height: 640,
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
              'linear-gradient(to top right, oklch(0.92 0.145 112 / 0.06), oklch(0.92 0.145 112 / 0.36))',
            borderRight: '2px solid oklch(0.92 0.145 112 / 0.75)',
            borderTop: '2px solid oklch(0.92 0.145 112 / 0.75)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${(customers / 700) * 100}%`,
            bottom: `${(price / 44) * 100}%`,
            transform: 'translate(-50%, 50%)',
            width: 88,
            height: 88,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid oklch(0.92 0.145 112 / 0.5)',
            background: 'radial-gradient(circle at 32% 26%, oklch(1 0 0 / 0.18), oklch(0.13 0 0))',
            boxShadow: '0 0 44px -6px oklch(0.92 0.145 112 / 0.85)',
          }}
        >
          <div style={{ width: 38, color: LUME }}>
            <DoveLogo className="" />
          </div>
        </div>

        <span
          style={{
            ...mono,
            position: 'absolute',
            left: 24,
            top: 20,
            fontSize: 26,
            color: 'oklch(1 0 0 / 0.4)',
          }}
        >
          {formatCurrency(price)}/mo
        </span>
        <span
          style={{
            ...mono,
            position: 'absolute',
            right: 24,
            bottom: 18,
            fontSize: 26,
            color: 'oklch(1 0 0 / 0.4)',
          }}
        >
          {customers.toLocaleString('en-US')} customers
        </span>
      </div>

      <p style={{ ...mono, marginTop: 52, fontSize: 108, fontWeight: 600, color: INK }}>
        {formatCurrency(mrr)}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 28, letterSpacing: '0.2em', color: DIM }}>
        PER MONTH
      </p>
    </AbsoluteFill>
  )
}

/** 06 — Les deux leviers : deux chemins, la même aire. */
function TwoLevers() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const flip = spring({ frame: frame - 45, fps, config: { damping: 200 } })

  const cards = [
    { label: 'Double the price', a: '€58', b: '500', hint: 'costs nothing' },
    { label: 'Double the customers', a: '€29', b: '1,000', hint: 'costs everything' },
  ]

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 34 }}>
      {cards.map((card, index) => {
        const enter = spring({ frame: frame - index * 12, fps, config: { damping: 200 } })
        const lit = index === 0 ? flip : 1 - flip * 0.6

        return (
          <div
            key={card.label}
            style={{
              width: 800,
              padding: '38px 44px',
              borderRadius: 26,
              border: `1px solid ${index === 0 ? 'oklch(0.92 0.145 112 / 0.4)' : 'oklch(1 0 0 / 0.12)'}`,
              backgroundColor: index === 0 ? 'oklch(0.92 0.145 112 / 0.07)' : 'oklch(0.16 0.006 110)',
              opacity: enter * (0.55 + lit * 0.45),
              transform: `translateY(${(1 - enter) * 40}px)`,
            }}
          >
            <p
              style={{
                ...display,
                margin: 0,
                fontSize: 40,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                color: index === 0 ? LUME : INK,
              }}
            >
              {card.label}
            </p>
            <p style={{ ...mono, margin: '14px 0 0', fontSize: 52, color: INK }}>
              {card.a} × {card.b} = €29,000
            </p>
            <p style={{ ...display, margin: '10px 0 0', fontSize: 28, color: DIM }}>{card.hint}</p>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/** 08 — L'échelle habitée. Les marques se posent sur leur barreau. */
function Ladder() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = { min: 1, max: 30_000 }
  const yOf = (price: number) =>
    1 -
    Math.log(Math.min(scale.max, Math.max(scale.min, price)) / scale.min) /
      Math.log(scale.max / scale.min)

  const shown = ['spotify', 'shopify', 'salesforce']

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 880,
          height: 1240,
          borderRadius: 28,
          border: '1px solid oklch(1 0 0 / 0.1)',
          backgroundColor: 'oklch(0.155 0.006 110)',
          overflow: 'hidden',
        }}
      >
        {PRICING_ANIMALS.map((animal, index) => {
          const top = yOf(Math.min(animal.maxPrice, scale.max))
          const bottom = yOf(animal.minPrice)
          const appear = spring({ frame: frame - index * 4, fps, config: { damping: 200 } })

          return (
            <div
              key={animal.name}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${top * 100}%`,
                height: `${(bottom - top) * 100}%`,
                borderTop: '1px dashed oklch(1 0 0 / 0.12)',
                opacity: appear,
              }}
            >
              <span
                style={{
                  ...display,
                  position: 'absolute',
                  left: 30,
                  top: 16,
                  fontSize: 30,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: DIM,
                }}
              >
                {animal.name}
              </span>
            </div>
          )
        })}

        {LANDMARKS.filter((c) => shown.includes(c.id)).map((company, index) => {
          const monthly = landmarkAcv(company) / 12
          const land = spring({ frame: frame - 34 - index * 20, fps, config: { damping: 170 } })

          return (
            <div
              key={company.id}
              style={{
                position: 'absolute',
                right: 30,
                top: `${yOf(monthly) * 100}%`,
                transform: `translate(${(1 - land) * 220}px, -50%)`,
                opacity: land,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 26px',
                borderRadius: 999,
                border: '1px solid oklch(1 0 0 / 0.18)',
                backgroundColor: 'oklch(0.1 0 0 / 0.92)',
              }}
            >
              <span style={{ ...display, fontSize: 34, fontWeight: 700, color: INK }}>
                {company.name}
              </span>
              <span style={{ ...mono, fontSize: 28, color: LUME }}>
                {formatCurrency(Math.round(monthly))}
              </span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/** 10 — La cascade : ce qui reste, et ce que ça vaut. */
function Cascade() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drain = spring({ frame: frame - 26, fps, config: { damping: 200, mass: 1.2 } })

  const fixedCosts = Math.round(1_200 + drain * 11_500)
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
          width: 620,
          height: 880,
          borderRadius: 28,
          border: '1px solid oklch(1 0 0 / 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'oklch(0.155 0.006 110)',
        }}
      >
        <div
          style={{
            flex: 1 - share,
            backgroundColor: 'oklch(1 0 0 / 0.05)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 26,
          }}
        >
          <span style={{ ...mono, fontSize: 34, color: DIM }}>
            {formatCurrency(mrr)} in
          </span>
        </div>
        <div
          style={{
            flex: Math.max(share, 0.18),
            backgroundColor: losing ? 'oklch(0.62 0.19 25 / 0.3)' : 'oklch(0.92 0.145 112 / 0.28)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span style={{ ...display, fontSize: 26, letterSpacing: '0.2em', color: DIM }}>
            WHAT REMAINS
          </span>
          <span style={{ ...mono, fontSize: 92, fontWeight: 600, color: losing ? RED : LUME }}>
            {formatCurrency(Math.round(sdeMonthly))}
          </span>
        </div>
      </div>

      <p style={{ ...display, marginTop: 40, fontSize: 34, color: DIM }}>
        Fixed costs {formatCurrency(fixedCosts)}
      </p>
      {losing && (
        <p style={{ ...display, margin: '14px 0 0', fontSize: 42, fontWeight: 700, color: RED }}>
          No profit, no multiple.
        </p>
      )}
    </AbsoluteFill>
  )
}

/** 11 — Le multiple se construit, ligne à ligne. */
function Buildup() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
    customers: 500,
    newCustomersPerMonth: 25,
  })
  // Les neuf lignes, toutes : le titre en annonce neuf, et une ligne à zéro
  // dit quelque chose de vrai — celle-là ne bouge pas pour vous.
  const lines = results.valuation.lines
  const widest = Math.max(0.1, ...lines.map((l) => Math.abs(l.deltaMultiple)))
  const total = spring({ frame: frame - lines.length * 7 - 10, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <p
        style={{
          ...display,
          margin: '0 0 44px',
          fontSize: 32,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        Nine lines build your multiple
      </p>

      <div style={{ width: '100%' }}>
        {lines.map((line, index) => {
          const grow = spring({ frame: frame - index * 7, fps, config: { damping: 200 } })
          const positive = line.deltaMultiple > 0
          const flat = Math.abs(line.deltaMultiple) <= 0.001
          const width = (Math.abs(line.deltaMultiple) / widest) * 50 * grow

          return (
            <div
              key={line.key}
              style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}
            >
              <span
                style={{
                  ...display,
                  width: 320,
                  fontSize: 24,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: DIM,
                  opacity: grow,
                }}
              >
                {line.label}
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end' }}>
                  {!positive && !flat && (
                    <span
                      style={{
                        height: 24,
                        width: `${width * 2}%`,
                        borderRadius: '999px 0 0 999px',
                        backgroundColor: 'oklch(0.62 0.19 25 / 0.8)',
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    width: flat ? 10 : 2,
                    height: flat ? 10 : 36,
                    borderRadius: flat ? '50%' : 0,
                    opacity: flat ? grow * 0.5 : 1,
                    backgroundColor: 'oklch(1 0 0 / 0.25)',
                  }}
                />
                <div style={{ width: '50%' }}>
                  {positive && !flat && (
                    <span
                      style={{
                        display: 'block',
                        height: 24,
                        width: `${width * 2}%`,
                        borderRadius: '0 999px 999px 0',
                        backgroundColor: 'oklch(0.92 0.145 112 / 0.85)',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p
        style={{
          ...mono,
          marginTop: 50,
          fontSize: 132,
          fontWeight: 600,
          color: INK,
          opacity: total,
          transform: `scale(${interpolate(total, [0, 1], [0.8, 1])})`,
        }}
      >
        {formatMultiple(results.valuation.multiple)}
      </p>
    </AbsoluteFill>
  )
}

/** 14 — La chute. */
function Closing() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 200 } })
  const url = spring({ frame: frame - 26, fps, config: { damping: 200 } })
  const note = spring({ frame: frame - 44, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
      <div
        style={{
          width: 640,
          color: INK,
          opacity: s,
          transform: `translateY(${(1 - s) * 34}px) rotateX(${(1 - s) * 26}deg)`,
        }}
      >
        <ColombesWordmark className="" />
      </div>
      <p
        style={{
          ...display,
          marginTop: 46,
          fontSize: 38,
          letterSpacing: '0.05em',
          color: LUME,
          opacity: url,
        }}
      >
        colombes-three.vercel.app
      </p>
      <p
        style={{
          ...display,
          marginTop: 18,
          fontSize: 28,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: DIM,
          opacity: note,
        }}
      >
        Free · No sign-up
      </p>
    </AbsoluteFill>
  )
}


/**
 * Les sous-titres, calés sur le texte de la voix off.
 *
 * Ils sautent volontairement les plans qui SONT une phrase en très grand : les
 * afficher deux fois encombrerait l'image sans rien ajouter. Partout ailleurs
 * ils tournent en continu — c'est ainsi qu'on regarde une vidéo dans un fil,
 * sans le son, et c'est aussi ce qui la rend accessible.
 */
const CAPTIONS: { at: number; len: number; text: string }[] = [
  { at: 195, len: 135, text: 'Most calculators hand you a number.' },
  { at: 450, len: 110, text: 'Your revenue is a surface.' },
  { at: 560, len: 100, text: 'Price on one side, customers on the other.' },
  { at: 660, len: 80, text: 'Double either one, and you double the area.' },
  { at: 740, len: 70, text: 'But only one of them is free.' },
  { at: 900, len: 100, text: 'Spotify is a mouse: €2 a month per user.' },
  { at: 1000, len: 70, text: 'Shopify is a deer, at €75.' },
  { at: 1070, len: 70, text: 'Salesforce is a whale.' },
  { at: 1350, len: 100, text: 'Direct costs, acquisition, fixed costs.' },
  { at: 1450, len: 70, text: 'Each one takes its share.' },
  { at: 1520, len: 70, text: 'No profit, no multiple.' },
  { at: 1590, len: 110, text: 'Then nine lines build that multiple.' },
  { at: 1700, len: 90, text: 'Churn. Growth. Retention. Concentration.' },
  { at: 1790, len: 70, text: 'And how much walks out of the door with you.' },
  { at: 1950, len: 150, text: 'Free. No sign-up.' },
]

/**
 * Un sous-titre. Fond sourd et flouté derrière le texte : sur un fond qui
 * change de plan en plan, une ligne posée nue devient illisible dès qu'elle
 * croise une zone claire.
 */
function Caption({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.4 } })
  const leave = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 150,
        paddingLeft: 70,
        paddingRight: 70,
      }}
    >
      <p
        style={{
          ...display,
          margin: 0,
          textAlign: 'center',
          fontSize: 46,
          lineHeight: 1.25,
          fontWeight: 600,
          color: INK,
          padding: '18px 30px',
          borderRadius: 18,
          backgroundColor: 'oklch(0.1 0 0 / 0.62)',
          backdropFilter: 'blur(14px)',
          border: '1px solid oklch(1 0 0 / 0.09)',
          opacity: enter * leave,
          transform: `translateY(${(1 - enter) * 18}px)`,
        }}
      >
        {text}
      </p>
    </AbsoluteFill>
  )
}

/** Le montage : 2100 images, 30 par seconde, soixante-dix secondes pile. */
const SHOTS: { at: number; len: number; node: React.ReactNode }[] = [
  { at: 0, len: 90, node: <Hook /> },
  { at: 90, len: 105, node: <Line text="Nobody told you what it's worth." accent="worth" /> },
  { at: 195, len: 135, node: <BorrowedNumber /> },
  { at: 330, len: 120, node: <Line text="They give you a number. And keep the reasoning." accent="number" size={96} /> },
  { at: 450, len: 210, node: <Surface /> },
  { at: 660, len: 150, node: <TwoLevers /> },
  { at: 810, len: 90, node: <Line text="So what animal are you?" accent="animal" /> },
  { at: 900, len: 240, node: <Ladder /> },
  { at: 1140, len: 120, node: <Line text="Spotify is a mouse." accent="mouse" /> },
  { at: 1260, len: 90, node: <Line text="Growing is not enough." accent="not" /> },
  { at: 1350, len: 240, node: <Cascade /> },
  { at: 1590, len: 270, node: <Buildup /> },
  { at: 1860, len: 90, node: <Line text="You can name every one of them." accent="every one" size={100} /> },
  { at: 1950, len: 150, node: <Closing /> },
]

export function Colombes70({ voiceOver = false }: { voiceOver?: boolean }) {
  return (
    <AbsoluteFill>
      <Ground />
      {voiceOver && <Audio src={staticFile('voice-en.wav')} />}
      {SHOTS.map((shot) => (
        <Sequence key={shot.at} from={shot.at} durationInFrames={shot.len}>
          <Fade>{shot.node}</Fade>
        </Sequence>
      ))}

      {/* Les sous-titres passent au-dessus de tous les plans. */}
      {CAPTIONS.map((caption) => (
        <Sequence key={caption.at} from={caption.at} durationInFrames={caption.len}>
          <Caption text={caption.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

/** Fondu court : les coupes doivent claquer sans jamais sauter. */
function Fade({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const opacity = Math.min(
    interpolate(frame, [0, 7], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
    }),
  )
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
}
