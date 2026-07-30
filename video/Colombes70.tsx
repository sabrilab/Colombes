import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { DoveLogo } from '../src/components/DoveLogo'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency, formatMultiple } from '../src/lib/format'
import { PRICING_ANIMALS, animalFor } from '../src/lib/pricePad'
import { LANDMARKS, landmarkAcv } from '../src/lib/landmarks'
import { GRAINS } from '../src/lib/learn'
import {
  AnimalBeat,
  Closing,
  DialFace,
  Eyebrow,
  Film,
  LetterLine,
  PricePad,
  SliderBar,
} from './kit'
import { landmarkMonthly, tierBand } from './data'
import { DIM, HAZE, INK, LUME, RED, centred, display, mono } from './tokens'
import { TIMELINE, TOTAL_FRAMES } from './cuts/film70.mjs'
import captions from './captions.json'

/**
 * Soixante-dix secondes, en anglais, montées pour le fil d'actualité.
 *
 * Le montage vit dans `cuts/film70.mjs` — durées et bruits de coupe — et ce fichier
 * ne fait qu'associer un plan à chaque identifiant. Trois règles tiennent le reste :
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
   Le montage
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Un plan par identifiant de `cuts/film70.mjs`.
 *
 * Les fonctions ne sont pas appelées ici mais montées dans une `Sequence` :
 * c'est ce qui donne à chaque plan son horloge à zéro, et donc des ressorts qui
 * repartent à chaque coupe.
 */
const SHOT_NODES: Record<string, React.ReactNode> = {
  pad: <PricePad caption="What the app is worth" />,
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
  closing: <Closing halo={190} />,
}

export function Colombes70({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-70s.mp3"
      captions={captions}
      sound={sound}
    />
  )
}
