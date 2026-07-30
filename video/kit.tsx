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
import { ColombesWordmark, DoveLogo } from '../src/components/DoveLogo'
import { AnimalShot } from './AnimalShot'
import { BG, DIM, INK, LUME, centred, display, mono, useCount } from './tokens'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { formatCurrency } from '../src/lib/format'

/**
 * Le vocabulaire commun des films.
 *
 * Trois montages partagent la même langue : les mêmes pigments, la même
 * typographie, les mêmes commandes dessinées, la même façon de couper. Sans ce
 * fichier, chaque film redéfinirait une molette légèrement différente et les trois
 * cesseraient d'avoir l'air du même produit — ce qui est précisément le contraire
 * de ce qu'on veut démontrer.
 *
 * Rien ici ne connaît le contenu d'un film. Les plans vivent dans les fichiers de
 * composition, le montage dans `cuts/`.
 */

/** Le fond dérive très lentement : une image parfaitement fixe paraît figée. */
export function Ground({ frames }: { frames: number }) {
  const frame = useCurrentFrame()
  const drift = interpolate(frame, [0, frames], [0, 70])

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
 * Un titre qui s'écrit lettre par lettre, puis s'efface de la même façon.
 *
 * Chaque caractère entre avec son propre ressort, décalé de deux images sur son
 * voisin, et pivote autour de son bord haut : la ligne se déplie au lieu
 * d'apparaître. Le mot d'accent bascule en citron une fois la ligne posée — l'œil
 * lit d'abord la phrase, ensuite le mot qui compte.
 *
 * Les mots restent insécables : sans ça, une lettre isolée passerait à la ligne
 * suivante et la composition sauterait d'une image à l'autre.
 */
export function LetterLine({
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
                      opacity: enter * (1 - leave),
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
export function Eyebrow({
  children,
  tone = DIM,
  gap = 40,
}: {
  children: React.ReactNode
  tone?: string
  gap?: number
}) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <p
      style={{
        ...display,
        margin: `0 0 ${gap}px`,
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

/**
 * Une barre de réglage de l'app : rail creusé, poignée en verre, valeur en
 * chiffres tabulaires. Le remplissage vient de l'extérieur, pas d'une horloge
 * interne, pour que plusieurs barres se remplissent en décalé.
 */
export function SliderBar({
  label,
  value,
  progress,
  tone = LUME,
  compact = false,
}: {
  label: string
  value: string
  progress: number
  tone?: string
  compact?: boolean
}) {
  const height = compact ? 16 : 22
  const knob = compact ? 40 : 54

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: compact ? 12 : 18,
        }}
      >
        <span
          style={{
            ...display,
            fontSize: compact ? 24 : 30,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          {label}
        </span>
        <span style={{ ...mono, fontSize: compact ? 36 : 48, fontWeight: 600, color: INK }}>
          {value}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          height,
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
            width: knob,
            height: knob,
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

/**
 * La molette de coffre de l'app, reprise trait pour trait : dix-neuf crans gravés,
 * le repère citron, la valeur au centre, et les deux boutons qui doublent la
 * rotation — une commande qui n'existerait qu'en rotation serait fermée à trop de
 * monde, et cela se voit aussi dans un film.
 *
 * Elle est là pour une raison simple : c'est la commande qu'on remarque. Une barre
 * ne se retient pas, une molette crantée si — et à l'image, le cran qui s'allume
 * au passage du repère fait le rythme tout seul.
 */
export function DialFace({
  label,
  value,
  progress,
  size = 300,
  buttons = true,
}: {
  label?: string
  value: string
  progress: number
  size?: number
  buttons?: boolean
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
          {/* 0,135 et non 0,17 : à cinq chiffres, la valeur passait par-dessus les
              crans gravés et le cadran perdait sa lisibilité. */}
          <span style={{ ...mono, fontSize: size * 0.135, fontWeight: 600, color: INK }}>
            {value}
          </span>
        </div>
      </div>

      {label && (
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
      )}

      {buttons && (
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
      )}
    </div>
  )
}

/**
 * Un animal qui tourne, sur un cercle de lumière, avec ce qu'il vaut.
 *
 * Ces plans ne démontrent rien : ils laissent respirer. Une suite de tableaux
 * de chiffres fatigue en dix secondes, et ces animaux sont ce qui reste en
 * mémoire — c'est le vocabulaire de l'app.
 */
export function AnimalBeat({
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

/**
 * Le pad de tarification, tel qu'on le manipule dans l'app.
 *
 * C'est l'objet signature : le seul geste que personne d'autre ne propose — on
 * tire une bille sur une plaque, et une valorisation se fait. Il sert d'accroche
 * dans deux films, et c'est pour ça qu'il vit ici plutôt que dans l'un des deux.
 * La bille suit une courbe — un déplacement en ligne droite aurait l'air d'une
 * animation, pas d'un doigt. Le chiffre est recalculé à chaque image par le
 * moteur de l'app, ce qui interdit de tricher sur la démonstration.
 */
export function PricePad({ caption = 'What the app is worth' }: { caption?: string }) {
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
        {caption}
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

/**
 * Une entrée lancée : la couche arrive floue, décalée et sur-dimensionnée, puis se
 * pose en une douzaine d'images.
 *
 * C'est du flou de mouvement simulé, et c'est assumé : un vrai flou de bougé
 * demanderait de rendre plusieurs sous-images par image et multiplierait le temps
 * de rendu. À cette vitesse, l'œil ne fait pas la différence — il lit « ça arrive
 * vite », ce qui est tout ce qu'on lui demande.
 */
export function Whip({
  children,
  from = 'right',
  distance = 260,
  blur = 30,
  frames = 13,
  delay = 0,
}: {
  children: React.ReactNode
  from?: 'left' | 'right' | 'up' | 'down' | 'in'
  distance?: number
  blur?: number
  frames?: number
  delay?: number
}) {
  const frame = useCurrentFrame()
  const eased = interpolate(frame - delay, [0, frames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 4,
  })
  const left = 1 - eased

  const offset = {
    left: `translateX(${-left * distance}px)`,
    right: `translateX(${left * distance}px)`,
    up: `translateY(${-left * distance}px)`,
    down: `translateY(${left * distance}px)`,
    in: `scale(${1 + left * 0.5})`,
  }[from]

  return (
    <AbsoluteFill
      style={{
        transform: offset,
        filter: `blur(${left * blur}px)`,
        opacity: Math.min(1, eased * 2.4),
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

/**
 * Des traits de vitesse qui traversent l'image et s'effacent.
 *
 * Ils ne durent que huit images. Plus longtemps, ils deviennent un décor ; là ils
 * ne font que souligner l'impact d'une coupe, et on ne les voit pas vraiment —
 * on les ressent.
 */
export function SpeedLines({ delay = 0, count = 14, tone = LUME }: { delay?: number; count?: number; tone?: string }) {
  const frame = useCurrentFrame()
  const life = interpolate(frame - delay, [0, 8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  if (life <= 0) return null

  return (
    <AbsoluteFill style={{ overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, index) => {
        // Réparties par un pas irrégulier plutôt qu'au hasard : le rendu doit
        // donner la même image à chaque capture.
        const y = ((index * 137) % 100) + 0.5
        const length = 180 + ((index * 71) % 320)
        const shift = (1 - life) * (600 + ((index * 53) % 400))

        return (
          <span
            key={index}
            style={{
              position: 'absolute',
              top: `${y}%`,
              right: shift,
              width: length,
              height: 2,
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${tone})`,
              opacity: life * 0.5,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

/**
 * Un emoji, à la taille voulue.
 *
 * La pile de polices nomme explicitement Noto Color Emoji : le rendu se fait dans
 * un Chromium sans interface, où la police par défaut ne couvre pas ces glyphes et
 * les remplacerait par des rectangles vides — un plan entier de tofu, découvert au
 * montage final.
 */
export function Emoji({ children, size = 96 }: { children: React.ReactNode; size?: number }) {
  return (
    <span
      style={{
        fontFamily: "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
        fontSize: size,
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  )
}

/**
 * Une étiquette posée sur un point d'une scène en trois dimensions.
 *
 * Le texte reste du HTML — la typographie de l'app, nette — et c'est la position
 * qui vient de la 3D, par `project()`. Coller le texte sur une texture donnerait
 * une étiquette floue qui tourne avec le volume ; ici elle reste lisible de face
 * pendant que le volume, lui, tourne.
 */
export function Tag({
  at,
  children,
  tone = DIM,
  align = 'left',
  opacity = 1,
}: {
  at: { x: number; y: number }
  children: React.ReactNode
  tone?: string
  align?: 'left' | 'right' | 'centre'
  opacity?: number
}) {
  const shift = align === 'right' ? '-100%' : align === 'centre' ? '-50%' : '0'

  return (
    <span
      style={{
        ...display,
        position: 'absolute',
        left: at.x,
        top: at.y,
        transform: `translate(${shift}, -50%)`,
        whiteSpace: 'nowrap',
        fontSize: 30,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: tone,
        opacity,
      }}
    >
      {children}
    </span>
  )
}

/** Le trait de rappel d'une étiquette vers son volume. */
export function Leader({
  from,
  to,
  opacity = 1,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  opacity?: number
}) {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI

  return (
    <span
      style={{
        position: 'absolute',
        left: from.x,
        top: from.y,
        width: length,
        height: 1,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        backgroundColor: 'oklch(1 0 0 / 0.22)',
        opacity,
      }}
    />
  )
}

/**
 * Un sous-titre. Fond sourd et flouté derrière le texte : sur un fond qui change
 * de plan en plan, une ligne posée nue devient illisible dès qu'elle croise une
 * zone claire.
 */
export function Caption({ text }: { text: string }) {
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
 * Coupe franche, avec six images de fondu.
 *
 * C'est ce qui rend un montage rapide supportable : sans le fondu, les coupes
 * sautent ; plus long, tout devient mou. La durée lue est celle du plan,
 * `Sequence` redéfinissant la configuration.
 */
export function Cut({ children }: { children: React.ReactNode }) {
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

/**
 * La chute, commune aux trois films : la colombe, le mot, l'adresse.
 *
 * Elle est partagée pour une raison de marque autant que de code — trois films
 * qui finissent exactement pareil se reconnaissent comme une série.
 */
export function Closing({ halo: haloFrames = 190 }: { halo?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = spring({ frame, fps, config: { damping: 200 } })
  const word = spring({ frame: frame - 14, fps, config: { damping: 200 } })
  const url = spring({ frame: frame - 32, fps, config: { damping: 200 } })
  const note = spring({ frame: frame - 48, fps, config: { damping: 200 } })
  // Le halo continue de croître pendant tout le plan : plusieurs secondes de logo
  // parfaitement fixe se lisent comme une image gelée.
  const halo = useCount(1, { delay: 0, duration: haloFrames })

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

export interface Shot {
  id: string
  at: number
  len: number
}

/**
 * Le squelette d'un film : le fond, la piste, les plans, les sous-titres.
 *
 * Un plan sans composant associé est une erreur de montage silencieuse — le film
 * afficherait six secondes de noir. On refuse plutôt de construire.
 */
export function Film({
  timeline,
  nodes,
  frames,
  mix,
  captions = [],
  sound = true,
}: {
  timeline: Shot[]
  nodes: Record<string, React.ReactNode>
  frames: number
  /** Le fichier de mixage dans `public/`, voix, musique et bruitage déjà réunis. */
  mix: string
  captions?: { at: number; len: number; text: string }[]
  sound?: boolean
}) {
  const orphan = timeline.find((shot) => !nodes[shot.id])
  if (orphan) throw new Error(`Le plan « ${orphan.id} » n'a pas de composant.`)

  return (
    <AbsoluteFill>
      <Ground frames={frames} />

      {sound && <Audio src={staticFile(mix)} />}

      {timeline.map((shot) => (
        <Sequence key={shot.id} from={shot.at} durationInFrames={shot.len}>
          <Cut>{nodes[shot.id]}</Cut>
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
