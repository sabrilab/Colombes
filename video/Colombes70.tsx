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
import { PRICING_ANIMALS, animalFor } from '../src/lib/pricePad'
import { LANDMARKS, landmarkAcv } from '../src/lib/landmarks'
import { GRAINS } from '../src/lib/learn'
import { AnimalShot } from './AnimalShot'
import { TIMELINE } from './cut.mjs'
import captions from './captions.json'

/**
 * Soixante-dix secondes, en anglais, montées pour le fil d'actualité.
 *
 * Le montage vit dans `cut.mjs` — durées et bruits de coupe — et ce fichier ne
 * fait qu'associer un plan à chaque identifiant. Trois règles tiennent le reste :
 *
 *  — l'accroche montre le produit en marche, pas une promesse : le pad bouge
 *    avant qu'un mot soit lu, parce que c'est ce qu'on reconnaît en défilant ;
 *  — les commandes de l'app sont à l'image telles quelles, molettes de coffre
 *    et barres comprises : montrer l'objet vaut mieux que le décrire ;
 *  — tous les chiffres sortent de `compute()`, le moteur de production, donc ce
 *    qu'on voit se refait dans l'app.
 *
 * Le son est un seul fichier, mixé d'avance par `scripts/build-mix.mjs` : voix,
 * musique et bruitage y sont déjà d'accord entre eux.
 */

const LUME = 'oklch(0.92 0.145 112)'
const HAZE = 'oklch(0.78 0.13 305)'
const INK = 'oklch(0.98 0.005 110)'
const DIM = 'oklch(0.68 0 0)'
const RED = 'oklch(0.7 0.2 25)'
const BG = 'oklch(0.125 0.006 110)'

const display = { fontFamily: "'Chakra Petch', system-ui, sans-serif" } as const
const mono = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontVariantNumeric: 'tabular-nums',
} as const

const centred = { alignItems: 'center', justifyContent: 'center' } as const

/** Le fond dérive très lentement : une image parfaitement fixe paraît figée. */
function Ground() {
  const frame = useCurrentFrame()
  const drift = interpolate(frame, [0, 2100], [0, 70])

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

/* ────────────────────────────────────────────────────────────────────────────
   Le vocabulaire typographique
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Un titre qui s'écrit lettre par lettre, puis s'efface de la même façon.
 *
 * Chaque caractère entre avec son propre ressort, décalé de deux images sur son
 * voisin, et pivote autour de son bord haut : la ligne se déplie au lieu
 * d'apparaître. Le mot d'accent bascule en citron une fois la ligne posée —
 * l'œil lit d'abord la phrase, ensuite le mot qui compte.
 *
 * Les mots restent insécables : sans ça, une lettre isolée passerait à la ligne
 * suivante et la composition sauterait d'une image à l'autre.
 */
function LetterLine({
  text,
  accent,
  size = 116,
}: {
  text: string
  accent?: string
  size?: number
}) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const accented = new Set((accent ?? '').toLowerCase().split(' ').filter(Boolean))
  const words = text.split(' ')
  const letters = text.replace(/ /g, '').length
  // La sortie commence quand la dernière lettre est arrivée, jamais avant.
  const exitStart = Math.max(durationInFrames - 14, letters * 2 + 8)

  let index = 0

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 70px' }}>
      <p
        style={{
          ...display,
          margin: 0,
          textAlign: 'center',
          fontSize: size,
          lineHeight: 1.02,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          color: INK,
          perspective: 900,
        }}
      >
        {words.map((word, w) => {
          const lit = accented.has(word.toLowerCase().replace(/[^a-z0-9']/g, ''))

          return (
            <span key={`${word}-${w}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {[...word].map((character, c) => {
                const order = index++
                const enter = spring({
                  frame: frame - order * 2,
                  fps,
                  config: { damping: 200, mass: 0.42 },
                })
                const leave = spring({
                  frame: frame - exitStart - (letters - order) * 0.8,
                  fps,
                  config: { damping: 200, mass: 0.3 },
                })
                const shown = enter * (1 - leave)

                return (
                  <span
                    key={c}
                    style={{
                      display: 'inline-block',
                      transformOrigin: '50% 0%',
                      transform:
                        `translateY(${(1 - enter) * 0.55 + leave * -0.45}em) ` +
                        `rotateX(${(1 - enter) * 72 - leave * 50}deg)`,
                      filter: `blur(${(1 - enter) * 9 + leave * 12}px)`,
                      opacity: shown,
                      // Le citron n'arrive qu'après la lettre : la couleur
                      // souligne, elle n'annonce pas.
                      color: lit
                        ? `color-mix(in oklab, ${LUME} ${Math.round(
                            interpolate(frame - order * 2, [8, 20], [0, 100], {
                              extrapolateLeft: 'clamp',
                              extrapolateRight: 'clamp',
                            }),
                          )}%, ${INK})`
                        : INK,
                    }}
                  >
                    {character}
                  </span>
                )
              })}
              {w < words.length - 1 && <span style={{ display: 'inline-block', width: '0.28em' }} />}
            </span>
          )
        })}
      </p>
    </AbsoluteFill>
  )
}

/** Le sur-titre d'un plan de démonstration. Toujours au même endroit. */
function Eyebrow({ children, tone = DIM }: { children: React.ReactNode; tone?: string }) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <p
      style={{
        ...display,
        margin: '0 0 40px',
        fontSize: 31,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: tone,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 14}px)`,
      }}
    >
      {children}
    </p>
  )
}

/** Un nombre qui se pose : il monte vite, puis se cale sur sa valeur. */
function useCount(target: number, { delay = 0, duration = 26 } = {}) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })
  return target * progress
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 0 — l'accroche : le pad, en marche
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Le pad de tarification, tel qu'on le manipule dans l'app.
 *
 * C'est le plan d'ouverture parce que c'est le seul geste que personne d'autre
 * ne propose : on tire une bille sur une plaque, et une valorisation se fait.
 * La bille suit une courbe — un déplacement en ligne droite aurait l'air d'une
 * animation, pas d'un doigt. Le chiffre est recalculé à chaque image par le
 * moteur de l'app, ce qui interdit de tricher sur la démonstration.
 */
function PadHook() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const travel = spring({ frame: frame - 6, fps, config: { damping: 26, mass: 1.1, stiffness: 90 } })
  const x = interpolate(travel, [0, 1], [0.14, 0.74])
  const y = interpolate(travel, [0, 1], [0.82, 0.26]) - Math.sin(travel * Math.PI) * 0.06

  // Prix et clients lus sur la plaque, puis la valorisation qui en découle.
  const price = Math.round(4 + (1 - y) ** 2.1 * 190)
  const customers = Math.round(40 + x ** 2.3 * 3_400)
  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price, mix: 1 }],
    customers,
    newCustomersPerMonth: Math.max(4, Math.round(customers * 0.05)),
  })

  const grid = 11

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 60px' }}>
      {/* La valorisation, en haut, comme sur la page d'accueil. */}
      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 138,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: INK,
          textShadow: `0 0 60px oklch(0.92 0.145 112 / ${0.15 + travel * 0.3})`,
        }}
      >
        {formatCurrency(Math.round(results.valuation.value))}
      </p>
      <p
        style={{
          ...display,
          margin: '6px 0 44px',
          fontSize: 29,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        What the app is worth
      </p>

      <div
        style={{
          position: 'relative',
          width: 960,
          height: 1060,
          borderRadius: 34,
          border: '1px solid oklch(1 0 0 / 0.12)',
          backgroundColor: 'oklch(0.16 0.006 110)',
          boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.07), inset 0 0 90px -10px oklch(0 0 0 / 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* La trame gravée. */}
        {Array.from({ length: grid }, (_, i) => (
          <React.Fragment key={i}>
            <span
              style={{
                position: 'absolute',
                left: `${(i / (grid - 1)) * 100}%`,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: 'oklch(1 0 0 / 0.05)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: `${(i / (grid - 1)) * 100}%`,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'oklch(1 0 0 / 0.05)',
              }}
            />
          </React.Fragment>
        ))}

        {/* La surface parcourue : l'aire, c'est le revenu. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: `${x * 100}%`,
            height: `${(1 - y) * 100}%`,
            background:
              'linear-gradient(to top right, oklch(0.92 0.145 112 / 0.05), oklch(0.92 0.145 112 / 0.3))',
            borderRight: '2px solid oklch(0.92 0.145 112 / 0.6)',
            borderTop: '2px solid oklch(0.92 0.145 112 / 0.6)',
          }}
        />

        {/* La traînée du geste : elle dit d'où vient la bille.

            `pathLength={1}` normalise la longueur de la courbe : sans lui, le
            tiret est exprimé dans les unités déformées du `viewBox` et se
            fragmente au lieu de se dérouler. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <path
            d="M 14 82 C 34 78, 52 60, 74 26"
            fill="none"
            stroke="oklch(0.92 0.145 112 / 0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - travel}
          />
        </svg>

        {/* La bille, et son onde à l'arrivée. */}
        <div
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 132,
            height: 132,
            borderRadius: '50%',
            display: 'flex',
            ...centred,
            border: '1px solid oklch(0.92 0.145 112 / 0.55)',
            background: 'radial-gradient(circle at 32% 26%, oklch(1 0 0 / 0.2), oklch(0.13 0 0))',
            boxShadow: `0 0 ${40 + travel * 30}px -4px oklch(0.92 0.145 112 / 0.9), inset 0 1px 1px oklch(1 0 0 / 0.25)`,
          }}
        >
          <div style={{ width: 58, color: LUME }}>
            <DoveLogo className="" />
          </div>
        </div>

        <span
          style={{ ...mono, position: 'absolute', left: 26, top: 22, fontSize: 30, color: 'oklch(1 0 0 / 0.45)' }}
        >
          {formatCurrency(price)}/mo
        </span>
        <span
          style={{ ...mono, position: 'absolute', right: 26, bottom: 20, fontSize: 30, color: 'oklch(1 0 0 / 0.45)' }}
        >
          {customers.toLocaleString('en-US')} customers
        </span>
      </div>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 1 — le chiffre emprunté
   ──────────────────────────────────────────────────────────────────────────── */

/** Un faux chiffre : net, gros, rassurant — puis brouillé, faute d'explication. */
function BorrowedNumber() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200 } })
  const blur = interpolate(frame, [46, 90], [0, 30], { extrapolateLeft: 'clamp' })
  const fade = interpolate(frame, [46, 90], [1, 0.2], { extrapolateLeft: 'clamp' })
  const mark = spring({ frame: frame - 58, fps, config: { damping: 170 } })

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Most calculators say</Eyebrow>
      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 156,
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
          marginTop: 34,
          fontSize: 156,
          fontWeight: 700,
          color: LUME,
          opacity: mark,
          transform: `scale(${interpolate(mark, [0, 1], [0.55, 1])})`,
        }}
      >
        ?
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Les animaux — la respiration entre deux actes
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Le prix mensuel par client d'un repère, calculé et non recopié.
 *
 * Écrire ces chiffres à la main est ce qui rend un film faux : Salesforce est à
 * dix-neuf mille euros par client et par mois, pas au millier qu'on imagine, et
 * c'est précisément ce que la démonstration doit faire voir.
 */
function landmarkMonthly(id: string): string {
  const company = LANDMARKS.find((candidate) => candidate.id === id)
  if (!company) return ''
  return `${formatCurrency(Math.round(landmarkAcv(company) / 12))} / month`
}

/** La fourchette de prix d'un palier, pour les plans sans repère nommé. */
function tierBand(name: string): string {
  const animal = PRICING_ANIMALS.find((candidate) => candidate.name === name)
  if (!animal) return ''
  return `${formatCurrency(animal.minPrice)} – ${formatCurrency(animal.maxPrice)} / month`
}

/**
 * Un animal qui tourne, sur un cercle de lumière, avec ce qu'il vaut.
 *
 * Ces plans ne démontrent rien : ils laissent respirer. Une suite de tableaux
 * de chiffres fatigue en dix secondes, et ces animaux sont ce qui reste en
 * mémoire — c'est le vocabulaire de l'app.
 */
function AnimalBeat({
  animal,
  title,
  note,
  turns = 0.8,
}: {
  animal: string
  title: string
  note?: string
  turns?: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.7 } })
  const label = spring({ frame: frame - 10, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={centred}>
      {/* Le halo derrière l'animal : il détache la silhouette du fond sombre. */}
      <div
        style={{
          position: 'absolute',
          width: 940,
          height: 940,
          borderRadius: '50%',
          background: `radial-gradient(circle, oklch(0.92 0.145 112 / ${0.16 * enter}), transparent 66%)`,
        }}
      />
      <div
        style={{
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.84, 1])})`,
        }}
      >
        <AnimalShot animal={animal} size={880} turns={turns} />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 300,
          textAlign: 'center',
          opacity: label,
          transform: `translateY(${(1 - label) * 26}px)`,
        }}
      >
        <p
          style={{
            ...display,
            margin: 0,
            fontSize: 84,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            color: INK,
          }}
        >
          {title}
        </p>
        {note && (
          <p style={{ ...mono, margin: '10px 0 0', fontSize: 44, color: LUME }}>{note}</p>
        )}
      </div>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 2 — la surface, et les commandes qui la règlent
   ──────────────────────────────────────────────────────────────────────────── */

/** Le revenu est une surface : prix en hauteur, clients en largeur. */
function Surface() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const grow = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.8 } })

  const price = Math.round(5 + grow * 24)
  const customers = Math.round(30 + grow * 470)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Revenue is a surface</Eyebrow>

      <div
        style={{
          position: 'relative',
          width: 860,
          height: 660,
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
            width: 92,
            height: 92,
            borderRadius: '50%',
            display: 'flex',
            ...centred,
            border: '1px solid oklch(0.92 0.145 112 / 0.5)',
            background: 'radial-gradient(circle at 32% 26%, oklch(1 0 0 / 0.18), oklch(0.13 0 0))',
            boxShadow: '0 0 44px -6px oklch(0.92 0.145 112 / 0.85)',
          }}
        >
          <div style={{ width: 40, color: LUME }}>
            <DoveLogo className="" />
          </div>
        </div>

        <span style={{ ...mono, position: 'absolute', left: 24, top: 20, fontSize: 28, color: 'oklch(1 0 0 / 0.4)' }}>
          {formatCurrency(price)}/mo
        </span>
        <span style={{ ...mono, position: 'absolute', right: 24, bottom: 18, fontSize: 28, color: 'oklch(1 0 0 / 0.4)' }}>
          {customers.toLocaleString('en-US')} customers
        </span>
      </div>

      <p style={{ ...mono, margin: '48px 0 0', fontSize: 112, fontWeight: 600, color: INK }}>
        {formatCurrency(price * customers)}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 27, letterSpacing: '0.22em', color: DIM }}>
        PER MONTH
      </p>
    </AbsoluteFill>
  )
}

/**
 * Une barre de réglage de l'app : rail creusé, poignée en verre, valeur en
 * chiffres tabulaires. Le remplissage vient de l'extérieur, pas d'une horloge
 * interne, pour que plusieurs barres se remplissent en décalé.
 */
function SliderBar({
  label,
  value,
  progress,
  tone = LUME,
}: {
  label: string
  value: string
  progress: number
  tone?: string
}) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <span
          style={{
            ...display,
            fontSize: 30,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          {label}
        </span>
        <span style={{ ...mono, fontSize: 48, fontWeight: 600, color: INK }}>{value}</span>
      </div>

      <div
        style={{
          position: 'relative',
          height: 22,
          borderRadius: 999,
          backgroundColor: 'oklch(0.1 0 0 / 0.75)',
          boxShadow: 'inset 0 2px 4px -1px oklch(0 0 0 / 0.8), inset 0 -1px 0 0 oklch(1 0 0 / 0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 2,
            right: `${(1 - progress) * 100}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, color-mix(in oklab, ${tone} 55%, transparent), ${tone})`,
            boxShadow: `0 0 22px -4px ${tone}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${progress * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, oklch(0.32 0.01 110), oklch(0.19 0.006 110))',
            border: `1px solid color-mix(in oklab, ${tone} 50%, transparent)`,
            boxShadow: `inset 0 1px 0 0 oklch(1 0 0 / 0.28), 0 6px 14px -6px oklch(0 0 0 / 0.9), 0 0 20px -6px ${tone}`,
          }}
        />
      </div>
    </div>
  )
}

/** Les réglages de l'app, poussés l'un après l'autre. */
function Sliders() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const rows = [
    { label: 'Price', from: 9, to: 58, format: (v: number) => `${formatCurrency(Math.round(v))}/mo` },
    { label: 'Customers', from: 60, to: 500, format: (v: number) => Math.round(v).toLocaleString('en-US') },
    { label: 'Monthly churn', from: 5.5, to: 1.8, format: (v: number) => `${v.toFixed(1)} %`, tone: HAZE },
  ]

  const pushes = rows.map((_, index) =>
    spring({ frame: frame - 8 - index * 16, fps, config: { damping: 30, mass: 0.9, stiffness: 110 } }),
  )
  const values = rows.map((row, index) => row.from + (row.to - row.from) * pushes[index])

  // Le revenu vient du moteur, pas d'une multiplication à l'écran : les barres
  // et le chiffre disent donc la même chose que le simulateur.
  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price: Math.round(values[0]), mix: 1 }],
    customers: Math.round(values[1]),
    revenueChurn: values[2] / 100,
  })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 90px' }}>
      <Eyebrow>Two of them are yours</Eyebrow>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 76 }}>
        {rows.map((row, index) => {
          const span = Math.abs(row.to - row.from)
          const progress =
            span === 0 ? 0 : Math.min(1, Math.abs(values[index] - row.from) / span) * 0.82 + 0.09

          return (
            <SliderBar
              key={row.label}
              label={row.label}
              value={row.format(values[index])}
              progress={progress}
              tone={row.tone}
            />
          )
        })}
      </div>

      <p style={{ ...mono, margin: '92px 0 0', fontSize: 104, fontWeight: 600, color: INK }}>
        {formatCurrency(Math.round(results.revenue.mrr))}
      </p>
      <p style={{ ...display, margin: 0, fontSize: 27, letterSpacing: '0.22em', color: DIM }}>
        PER MONTH
      </p>
    </AbsoluteFill>
  )
}

/** Les deux leviers : deux chemins, la même aire, pas le même prix. */
function TwoLevers() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const flip = spring({ frame: frame - 24, fps, config: { damping: 200 } })

  const cards = [
    { label: 'Double the price', maths: '€58 × 500', hint: 'costs nothing' },
    { label: 'Double the customers', maths: '€29 × 1,000', hint: 'costs everything' },
  ]

  return (
    <AbsoluteFill style={{ ...centred, gap: 32 }}>
      {cards.map((card, index) => {
        const enter = spring({ frame: frame - index * 8, fps, config: { damping: 200 } })
        const lit = index === 0 ? flip : 1 - flip * 0.65

        return (
          <div
            key={card.label}
            style={{
              width: 820,
              padding: '36px 44px',
              borderRadius: 26,
              border: `1px solid ${index === 0 ? 'oklch(0.92 0.145 112 / 0.42)' : 'oklch(1 0 0 / 0.12)'}`,
              backgroundColor: index === 0 ? 'oklch(0.92 0.145 112 / 0.07)' : 'oklch(0.16 0.006 110)',
              opacity: enter * (0.5 + lit * 0.5),
              transform: `translateY(${(1 - enter) * 44}px)`,
            }}
          >
            <p
              style={{
                ...display,
                margin: 0,
                fontSize: 42,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: index === 0 ? LUME : INK,
              }}
            >
              {card.label}
            </p>
            <p style={{ ...mono, margin: '12px 0 0', fontSize: 52, color: INK }}>
              {card.maths} = €29,000
            </p>
            <p style={{ ...display, margin: '8px 0 0', fontSize: 30, color: DIM }}>{card.hint}</p>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 3 — l'échelle habitée
   ──────────────────────────────────────────────────────────────────────────── */

/** Les cinq paliers, et trois entreprises posées sur leur barreau. */
function Ladder() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = { min: 1, max: 30_000 }
  const yOf = (price: number) =>
    1 -
    Math.log(Math.min(scale.max, Math.max(scale.min, price)) / scale.min) / Math.log(scale.max / scale.min)

  const shown = ['spotify', 'shopify', 'salesforce']

  return (
    <AbsoluteFill style={centred}>
      <div
        style={{
          position: 'relative',
          width: 900,
          height: 1300,
          borderRadius: 30,
          border: '1px solid oklch(1 0 0 / 0.1)',
          backgroundColor: 'oklch(0.155 0.006 110)',
          boxShadow: 'inset 0 0 70px -14px oklch(0 0 0 / 0.6)',
          overflow: 'hidden',
        }}
      >
        {PRICING_ANIMALS.map((animal, index) => {
          const top = yOf(Math.min(animal.maxPrice, scale.max))
          const bottom = yOf(animal.minPrice)
          const appear = spring({ frame: frame - index * 3, fps, config: { damping: 200 } })

          return (
            <div
              key={animal.name}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${top * 100}%`,
                height: `${(bottom - top) * 100}%`,
                borderTop: '1px dashed oklch(1 0 0 / 0.13)',
                opacity: appear,
              }}
            >
              <span
                style={{
                  ...display,
                  position: 'absolute',
                  left: 30,
                  top: 16,
                  fontSize: 32,
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

        {LANDMARKS.filter((company) => shown.includes(company.id)).map((company, index) => {
          const monthly = landmarkAcv(company) / 12
          const land = spring({ frame: frame - 22 - index * 13, fps, config: { damping: 160 } })

          return (
            <div
              key={company.id}
              style={{
                position: 'absolute',
                right: 30,
                top: `${yOf(monthly) * 100}%`,
                transform: `translate(${(1 - land) * 240}px, -50%)`,
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
              <span style={{ ...display, fontSize: 36, fontWeight: 700, color: INK }}>{company.name}</span>
              <span style={{ ...mono, fontSize: 30, color: LUME }}>
                {formatCurrency(Math.round(monthly))}
              </span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 4 — la molette, et le métier qu'elle décide
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * La molette de coffre de l'app, reprise trait pour trait : dix-neuf crans
 * gravés, le repère citron, la valeur au centre.
 *
 * Elle est ici pour une raison simple : c'est la commande qu'on remarque. Une
 * barre de réglage ne se retient pas, une molette crantée si — et à l'image,
 * le cran qui s'allume au passage du repère fait le rythme tout seul.
 */
function DialFace({
  label,
  value,
  progress,
  size = 300,
}: {
  label: string
  value: string
  progress: number
  size?: number
}) {
  const sweep = 270
  const half = sweep / 2
  const angle = -half + progress * sweep

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 30%, oklch(1 0 0 / 0.1), transparent 58%),' +
            'conic-gradient(from 210deg, oklch(0.26 0.008 110), oklch(0.15 0.006 110) 25%,' +
            'oklch(0.24 0.008 110) 50%, oklch(0.15 0.006 110) 75%, oklch(0.26 0.008 110))',
          border: '1px solid oklch(1 0 0 / 0.14)',
          boxShadow:
            'inset 0 3px 4px -1px oklch(1 0 0 / 0.22), inset 0 -14px 24px -12px oklch(0 0 0 / 0.7),' +
            '0 8px 22px -10px oklch(0 0 0 / 0.8)',
        }}
      >
        {/* Les crans gravés : ceux déjà franchis s'allument. */}
        {Array.from({ length: 19 }, (_, index) => {
          const tick = -half + (index / 18) * sweep
          const lit = tick <= angle

          return (
            <span
              key={index}
              style={{
                position: 'absolute',
                left: '50%',
                top: size * 0.05,
                width: 2,
                height: size * 0.07,
                transformOrigin: `50% ${size * 0.45}px`,
                transform: `translateX(-50%) rotate(${tick}deg)`,
                backgroundColor: lit ? 'oklch(0.92 0.145 112 / 0.75)' : 'oklch(1 0 0 / 0.18)',
                boxShadow: lit ? '0 0 8px oklch(0.92 0.145 112 / 0.6)' : 'none',
              }}
            />
          )
        })}

        {/* La molette : le seul élément qui tourne. */}
        <div
          style={{
            position: 'absolute',
            inset: size * 0.11,
            borderRadius: '50%',
            transform: `rotate(${angle}deg)`,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: size * 0.045,
              width: 8,
              height: size * 0.13,
              transform: 'translateX(-50%)',
              borderRadius: 999,
              backgroundColor: LUME,
              boxShadow: `0 0 16px ${LUME}`,
            }}
          />
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', ...centred }}>
          {/* 0,135 et non 0,17 : à cinq chiffres, la valeur passait par-dessus
              les crans gravés et le cadran perdait sa lisibilité. */}
          <span style={{ ...mono, fontSize: size * 0.135, fontWeight: 600, color: INK }}>{value}</span>
        </div>
      </div>

      <span
        style={{
          ...display,
          fontSize: 26,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        {label}
      </span>

      {/* Les deux boutons, parce que la molette n'est jamais la seule voie. */}
      <div style={{ display: 'flex', gap: 14 }}>
        {['−', '+'].map((sign) => (
          <span
            key={sign}
            style={{
              ...display,
              width: 62,
              height: 62,
              borderRadius: 18,
              display: 'flex',
              ...centred,
              fontSize: 34,
              color: INK,
              background: 'linear-gradient(180deg, oklch(0.26 0.008 110), oklch(0.17 0.006 110))',
              border: '1px solid oklch(1 0 0 / 0.12)',
              boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.16), 0 4px 10px -6px oklch(0 0 0 / 0.9)',
            }}
          >
            {sign}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Le prix par client, tourné d'un palier à l'autre — souris, cerf, baleine. */
function DialShot() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const turn = spring({ frame: frame - 8, fps, config: { damping: 28, mass: 1.2, stiffness: 80 } })

  // Le prix suit la molette sur une échelle logarithmique, comme dans l'app :
  // un cran doit valoir autant en bas de l'échelle qu'en haut.
  const price = Math.round(2 * (12_000 / 2) ** turn)
  const animal = animalFor(price)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow>Your price per customer</Eyebrow>

      <DialFace
        label="Price per month"
        value={formatCurrency(price)}
        progress={turn}
        size={480}
      />

      <p
        style={{
          ...display,
          margin: '58px 0 0',
          fontSize: 74,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: LUME,
        }}
      >
        {animal.name}
      </p>
      <p style={{ ...display, margin: '8px 0 0', fontSize: 30, letterSpacing: '0.18em', color: DIM }}>
        DECIDES YOUR TRADE
      </p>
    </AbsoluteFill>
  )
}

/** Ce que le prix décide vraiment : qui vend, qui accompagne, combien il en faut. */
function TradeCards() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const rows = [
    { label: 'Who sells', mouse: 'Nobody', whale: 'A sales team' },
    { label: 'Who onboards', mouse: 'A tooltip', whale: 'Three weeks' },
    { label: 'Customers needed', mouse: '5,000', whale: '12' },
  ]

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 70px' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rows.map((row, index) => {
          const enter = spring({ frame: frame - index * 9, fps, config: { damping: 200, mass: 0.6 } })

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
                border: '1px solid oklch(1 0 0 / 0.1)',
                backgroundColor: 'oklch(0.16 0.006 110)',
                opacity: enter,
                transform: `translateX(${(1 - enter) * -60}px)`,
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
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 5 — la cascade
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Le module « ce qui reste » : trois molettes, et le bassin qui se vide.
 *
 * Les trois prélèvements sont montés en série sur la même colonne : on voit la
 * part que chacun prend, et le fond qui rétrécit. C'est la démonstration que le
 * revenu n'est pas le revenu de personne.
 */
function CascadeDials() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const dials = [
    { label: 'Direct costs', to: 0.22, format: (v: number) => `${Math.round(v * 100)} %` },
    { label: 'Acquisition', to: 0.34, format: (v: number) => `${Math.round(v * 100)} %` },
    { label: 'Fixed costs', to: 0.58, format: (v: number) => `${Math.round(v * 100)} %` },
  ]

  const takes = dials.map((dial, index) => {
    const turn = spring({
      frame: frame - 10 - index * 18,
      fps,
      config: { damping: 26, mass: 1, stiffness: 95 },
    })
    return { ...dial, progress: turn * dial.to }
  })

  const mrr = 14_500
  const drained = takes.reduce((total, take) => total + take.progress * 0.42, 0)
  const remains = Math.max(0.08, 1 - drained)

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 60px' }}>
      <div style={{ display: 'flex', gap: 44, marginBottom: 62 }}>
        {takes.map((take) => (
          <DialFace
            key={take.label}
            label={take.label}
            value={take.format(take.progress)}
            progress={take.progress}
            size={252}
          />
        ))}
      </div>

      {/* Le bassin : chaque prélèvement mord dessus, le fond est ce qui reste. */}
      <div
        style={{
          width: 780,
          height: 300,
          borderRadius: 26,
          border: '1px solid oklch(1 0 0 / 0.12)',
          backgroundColor: 'oklch(0.1 0 0 / 0.6)',
          boxShadow: 'inset 0 2px 6px -2px oklch(0 0 0 / 0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            height: `${remains * 100}%`,
            display: 'flex',
            ...centred,
            background:
              'linear-gradient(180deg, oklch(0.92 0.145 112 / 0.5), oklch(0.92 0.145 112 / 0.24))',
            borderTop: '2px solid oklch(0.92 0.145 112 / 0.85)',
          }}
        >
          <span style={{ ...mono, fontSize: 66, fontWeight: 600, color: INK }}>
            {formatCurrency(Math.round(mrr * remains))}
          </span>
        </div>
      </div>

      <p style={{ ...display, margin: '32px 0 0', fontSize: 30, letterSpacing: '0.2em', color: DIM }}>
        OUT OF {formatCurrency(mrr)} IN
      </p>
    </AbsoluteFill>
  )
}

/** Ce qui reste vraiment, quand les frais fixes montent : rien. */
function Remains() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drain = spring({ frame: frame - 8, fps, config: { damping: 200, mass: 1 } })

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
    <AbsoluteFill style={centred}>
      <div
        style={{
          width: 620,
          height: 760,
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
          <span style={{ ...mono, fontSize: 34, color: DIM }}>{formatCurrency(mrr)} in</span>
        </div>
        <div
          style={{
            flex: Math.max(share, 0.2),
            backgroundColor: losing ? 'oklch(0.62 0.19 25 / 0.3)' : 'oklch(0.92 0.145 112 / 0.28)',
            display: 'flex',
            flexDirection: 'column',
            ...centred,
            gap: 8,
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

      <p style={{ ...display, marginTop: 36, fontSize: 34, color: DIM }}>
        Fixed costs {formatCurrency(fixedCosts)}
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte 6 — les neuf lignes
   ──────────────────────────────────────────────────────────────────────────── */

/** Le multiple se construit ligne à ligne, et chacune a un nom. */
function Buildup() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const results = compute({
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
    customers: 500,
    newCustomersPerMonth: 25,
  })
  // Les neuf lignes, toutes : le titre en annonce neuf, et une ligne à zéro dit
  // quelque chose de vrai — celle-là ne bouge pas pour vous.
  const lines = results.valuation.lines
  const widest = Math.max(0.1, ...lines.map((line) => Math.abs(line.deltaMultiple)))
  const total = spring({ frame: frame - lines.length * 5 - 8, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 74px' }}>
      <Eyebrow>Nine lines build your multiple</Eyebrow>

      <div style={{ width: '100%' }}>
        {lines.map((line, index) => {
          const grow = spring({ frame: frame - index * 5, fps, config: { damping: 200 } })
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
                  fontSize: 25,
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
                        height: 26,
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
                    height: flat ? 10 : 38,
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
                        height: 26,
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
          marginTop: 46,
          fontSize: 136,
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

/** Les quatre que tout le monde cite, nommées une par une. */
function NamedLines() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const names = ['Churn', 'Growth', 'Retention', 'Concentration']
  // 46 et non 56 : le plan ne tient plus que 78 images, et cette ligne doit
  // être entièrement lisible avant la coupe.
  const last = spring({ frame: frame - 46, fps, config: { damping: 200 } })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 80px', gap: 26 }}>
      {names.map((name, index) => {
        const enter = spring({ frame: frame - index * 11, fps, config: { damping: 170, mass: 0.5 } })

        return (
          <p
            key={name}
            style={{
              ...display,
              margin: 0,
              fontSize: 92,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              color: index % 2 === 0 ? INK : LUME,
              opacity: enter,
              transform: `translateX(${(1 - enter) * (index % 2 === 0 ? -70 : 70)}px)`,
            }}
          >
            {name}
          </p>
        )
      })}

      <p
        style={{
          ...display,
          margin: '30px 0 0',
          textAlign: 'center',
          fontSize: 40,
          lineHeight: 1.2,
          color: DIM,
          opacity: last,
        }}
      >
        And how much of the company
        <br />
        walks out of the door with you.
      </p>
    </AbsoluteFill>
  )
}

/**
 * Les modules d'apprentissage, tels qu'ils sont sur la page d'accueil.
 *
 * Le film a montré chaque mécanique séparément ; ce plan dit qu'elles sont
 * toutes dans l'app, et à manipuler. La commande de chaque module est dessinée
 * dans sa carte — molette pour l'un, barre pour l'autre — parce que c'est ce qui
 * distingue ces modules d'un article de blog.
 */
function Modules() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const dial = spring({ frame: frame - 18, fps, config: { damping: 26, mass: 1, stiffness: 90 } })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 66px' }}>
      <Eyebrow>Four things to play with</Eyebrow>

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
        {GRAINS.map((grain, index) => {
          const enter = spring({ frame: frame - index * 7, fps, config: { damping: 200, mass: 0.6 } })
          const lume = index === 0

          return (
            <div
              key={grain.id}
              style={{
                padding: '32px 30px',
                borderRadius: 26,
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `1px solid ${lume ? 'oklch(0.92 0.145 112 / 0.4)' : 'oklch(1 0 0 / 0.11)'}`,
                background: lume
                  ? 'linear-gradient(165deg, oklch(0.92 0.145 112 / 0.16), oklch(0.92 0.145 112 / 0.04))'
                  : 'oklch(0.165 0.006 110)',
                boxShadow: 'inset 0 1px 0 0 oklch(1 0 0 / 0.07)',
                opacity: enter,
                transform: `translateY(${(1 - enter) * 40}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
              }}
            >
              <div>
                <p
                  style={{
                    ...mono,
                    margin: 0,
                    fontSize: 24,
                    letterSpacing: '0.14em',
                    color: lume ? LUME : DIM,
                  }}
                >
                  0{index + 1}
                </p>
                <p
                  style={{
                    ...display,
                    margin: '12px 0 0',
                    fontSize: 42,
                    lineHeight: 1.05,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    color: INK,
                  }}
                >
                  {grain.title}
                </p>
                <p style={{ ...display, margin: '14px 0 0', fontSize: 26, lineHeight: 1.3, color: DIM }}>
                  {grain.question}
                </p>
              </div>

              {/* La commande du module, à sa vraie échelle. */}
              <div style={{ marginTop: 24 }}>
                {index % 2 === 0 ? (
                  <DialFace
                    label="Turn it"
                    value={`${Math.round(20 + dial * 68)}`}
                    progress={0.16 + dial * 0.66}
                    size={168}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    <SliderBar
                      label="Price"
                      value={`${formatCurrency(Math.round(12 + dial * 64))}`}
                      progress={0.12 + dial * 0.7}
                    />
                    <SliderBar
                      label="Churn"
                      value={`${(5.2 - dial * 3.1).toFixed(1)} %`}
                      progress={0.78 - dial * 0.55}
                      tone={HAZE}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   La chute
   ──────────────────────────────────────────────────────────────────────────── */

function Closing() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = spring({ frame, fps, config: { damping: 200 } })
  const word = spring({ frame: frame - 14, fps, config: { damping: 200 } })
  const url = spring({ frame: frame - 32, fps, config: { damping: 200 } })
  const note = spring({ frame: frame - 48, fps, config: { damping: 200 } })
  // Le halo continue de croître pendant tout le plan : sept secondes de logo
  // parfaitement fixe se lisent comme une image gelée.
  const halo = useCount(1, { delay: 0, duration: 190 })

  return (
    <AbsoluteFill style={{ ...centred, perspective: 1200 }}>
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, oklch(0.92 0.145 112 / ${0.14 * halo}), transparent 62%)`,
        }}
      />

      <div
        style={{
          width: 250,
          color: LUME,
          opacity: mark,
          transform: `translateY(${(1 - mark) * 24}px) scale(${interpolate(mark, [0, 1], [0.8, 1])})`,
          filter: `drop-shadow(0 0 ${40 * mark}px oklch(0.92 0.145 112 / 0.5))`,
        }}
      >
        <DoveLogo className="" />
      </div>

      <div
        style={{
          width: 660,
          marginTop: 58,
          color: INK,
          opacity: word,
          transform: `translateY(${(1 - word) * 30}px) rotateX(${(1 - word) * 24}deg)`,
        }}
      >
        <ColombesWordmark className="" />
      </div>

      <p
        style={{
          ...display,
          marginTop: 48,
          fontSize: 40,
          letterSpacing: '0.04em',
          color: LUME,
          opacity: url,
        }}
      >
        colombes-three.vercel.app
      </p>
      <p
        style={{
          ...display,
          marginTop: 16,
          fontSize: 28,
          letterSpacing: '0.22em',
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

/* ────────────────────────────────────────────────────────────────────────────
   Le montage
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Un plan par identifiant de `cut.mjs`.
 *
 * Les fonctions ne sont pas appelées ici mais montées dans une `Sequence` :
 * c'est ce qui donne à chaque plan son horloge à zéro, et donc des ressorts qui
 * repartent à chaque coupe.
 */
const SHOT_NODES: Record<string, React.ReactNode> = {
  pad: <PadHook />,
  worth: <LetterLine text="Nobody told you what it's worth" accent="worth" size={104} />,
  borrowed: <BorrowedNumber />,
  reasoning: <LetterLine text="So here is the reasoning" accent="reasoning" />,
  'animal-rabbit': <AnimalBeat animal="Rabbits" title="Rabbits" note={tierBand('Rabbits')} turns={0.34} />,
  surface: <Surface />,
  sliders: <Sliders />,
  levers: <TwoLevers />,
  'which-animal': <LetterLine text="Which animal are you" accent="animal" />,
  ladder: <Ladder />,
  'animal-mouse': <AnimalBeat animal="Mice" title="Spotify" note={landmarkMonthly('spotify')} turns={0.28} />,
  'animal-deer': <AnimalBeat animal="Deer" title="Shopify" note={landmarkMonthly('shopify')} turns={0.28} />,
  'animal-whale': (
    <AnimalBeat animal="Whales" title="Salesforce" note={landmarkMonthly('salesforce')} turns={0.24} />
  ),
  dial: <DialShot />,
  trade: <TradeCards />,
  'not-enough': <LetterLine text="Growing is not enough" accent="not" />,
  'cascade-dials': <CascadeDials />,
  remains: <Remains />,
  'no-profit': <LetterLine text="No profit, no multiple" accent="multiple" size={102} />,
  buildup: <Buildup />,
  'named-lines': <NamedLines />,
  modules: <Modules />,
  closing: <Closing />,
}

/**
 * Un sous-titre. Fond sourd et flouté derrière le texte : sur un fond qui change
 * de plan en plan, une ligne posée nue devient illisible dès qu'elle croise une
 * zone claire. Les temps viennent de `captions.json`, mesurés sur la voix.
 */
function Caption({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.32 } })
  const leave = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 132,
        paddingLeft: 62,
        paddingRight: 62,
      }}
    >
      <p
        style={{
          ...display,
          margin: 0,
          textAlign: 'center',
          fontSize: 46,
          lineHeight: 1.22,
          fontWeight: 600,
          color: INK,
          padding: '18px 30px',
          borderRadius: 18,
          backgroundColor: 'oklch(0.1 0 0 / 0.66)',
          backdropFilter: 'blur(14px)',
          border: '1px solid oklch(1 0 0 / 0.09)',
          opacity: enter * leave,
          transform: `translateY(${(1 - enter) * 16}px)`,
        }}
      >
        {text}
      </p>
    </AbsoluteFill>
  )
}

/**
 * Coupe franche, sauf aux deux extrémités du film.
 *
 * Le fondu de six images est ce qui rend un montage rapide supportable : sans
 * lui, les coupes sautent ; plus long, tout devient mou. La durée lue ici est
 * celle du plan, `Sequence` redéfinissant la configuration.
 */
function Cut({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const opacity = Math.min(
    interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' }),
  )
  // Un très léger recul à l'entrée : l'impact d'une coupe sans bouger la caméra.
  const push = interpolate(frame, [0, 12], [1.035, 1], {
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })

  return <AbsoluteFill style={{ opacity, transform: `scale(${push})` }}>{children}</AbsoluteFill>
}

export function Colombes70({ sound = true }: { sound?: boolean }) {
  return (
    <AbsoluteFill>
      <Ground />

      {/* Une seule piste : voix, musique et bruitage sont déjà mixés ensemble. */}
      {sound && <Audio src={staticFile('film/mix-70s.mp3')} />}

      {TIMELINE.map((shot: { id: string; at: number; len: number }) => (
        <Sequence key={shot.id} from={shot.at} durationInFrames={shot.len}>
          <Cut>{SHOT_NODES[shot.id]}</Cut>
        </Sequence>
      ))}

      {/* Les sous-titres passent au-dessus de tous les plans. */}
      {captions.map((caption) => (
        <Sequence key={caption.at} from={caption.at} durationInFrames={caption.len}>
          <Caption text={caption.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
