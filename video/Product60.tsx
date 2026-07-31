import React from 'react'
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { ColombesWordmark, DoveLogo } from '../src/components/DoveLogo'
import { PRICING_ANIMALS } from '../src/lib/pricePad'
import { Film } from './kit'
import { BG, DIM, INK, LUME, RED, centred, display, mono } from './tokens'
import { stepsPassed, ticksOf } from './motion.mjs'
import { TIMELINE, TOTAL_FRAMES } from './cuts/product.mjs'
import captions from './captions-product.json'
import homeShot from './assets/ui/home.png'
import simulatorShot from './assets/ui/simulator.png'
import liftedShot from './assets/ui/simulator-lifted.png'
import learnShot from './assets/ui/learn.png'

/**
 * « Colombes, in sixty seconds » — le film de présentation, en 16/9.
 *
 * Les six autres films démontrent une idée ; celui-ci montre un produit et
 * demande une inscription. Deux partis pris en découlent.
 *
 * Le premier : ce qui est à l'image est l'application elle-même. Pas une
 * reconstitution, pas une maquette — des captures de l'app construite, prises
 * par `scripts/shoot-ui.mjs`, avec ses vrais modèles en volume et les chiffres
 * que le moteur venait de calculer. Redessiner l'interface aurait été plus
 * commode et aurait produit un film qui vieillit sans prévenir : le jour où un
 * bouton change, la publicité ment.
 *
 * Le second : la caméra. Les captures ne sont pas posées à plat mais sur des
 * plaques dans un espace en perspective, que l'on traverse — ce qui suppose une
 * seule chose, que la pose soit une fonction du numéro d'image. C'est de la
 * perspective CSS et non de la 3D : les images restent nettes au pixel, là où
 * une texture sur un plan les rendrait molles dès qu'elle s'incline.
 *
 * Un plan mérite d'être signalé, `levers` : les prix montent et la valorisation
 * suit. Ce sont deux captures de deux états réels de l'app — 9/29/79 € puis
 * 19/59/149 € — et non un chiffre animé par-dessus une image fixe. Le film ne
 * peut donc pas montrer un résultat que le produit ne donnerait pas.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Les captures, et la façon de les cadrer
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Les dimensions des captures, à recopier de `scripts/shoot-ui.mjs` : ce sont
 * les `width` et `height` de chaque vue, doublées par le facteur d'échelle.
 * Elles servent à calculer la hauteur d'un cadrage, que l'on exprime en parts
 * de l'image plutôt qu'en pixels — un recadrage reste ainsi valable si l'on
 * repasse les captures dans une autre résolution.
 */
const SOURCE = {
  home: { src: homeShot, width: 3000, height: 1880 },
  simulator: { src: simulatorShot, width: 3000, height: 2360 },
  lifted: { src: liftedShot, width: 3000, height: 2360 },
  learn: { src: learnShot, width: 3000, height: 2000 },
}

type Pane = keyof typeof SOURCE

interface Crop {
  x: number
  y: number
  w: number
  h: number
}

const FULL: Crop = { x: 0, y: 0, w: 1, h: 1 }

/** Les cadrages relevés sur les captures, une fois pour toutes. */
const CROP = {
  valuation: { x: 0.272, y: 0.075, w: 0.708, h: 0.306 },
  sliders: { x: 0.01, y: 0.075, w: 0.245, h: 0.548 },
  health: { x: 0.272, y: 0.683, w: 0.708, h: 0.169 },
  tier: { x: 0.5325, y: 0.435, w: 0.2925, h: 0.307 },
  pad: { x: 0.1875, y: 0.403, w: 0.33, h: 0.407 },
  hero: { x: 0.175, y: 0.2, w: 0.65, h: 0.3 },
}

/**
 * Une plaque : un morceau de l'interface, encadré, ombré, éclairé de biais.
 *
 * `panes` en accepte plusieurs empilées, ce dont un seul plan se sert — celui
 * où l'on fait monter les prix. Deux captures au même endroit, l'opacité de la
 * seconde qui monte : le fondu se lit comme un changement d'état de l'app, ce
 * qu'il est réellement.
 */
function Screen({
  panes,
  width,
  crop = FULL,
}: {
  panes: { shot: Pane; opacity?: number }[]
  width: number
  crop?: Crop
}) {
  const scaled = width / crop.w
  const first = SOURCE[panes[0].shot]
  const height = crop.h * scaled * (first.height / first.width)

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        borderRadius: 20,
        backgroundColor: BG,
        border: '1px solid oklch(1 0 0 / 0.16)',
        boxShadow: '0 70px 130px -50px oklch(0 0 0 / 0.95), 0 0 0 1px oklch(0 0 0 / 0.6)',
      }}
    >
      {panes.map((pane) => {
        const source = SOURCE[pane.shot]
        return (
          <Img
            key={pane.shot}
            src={source.src}
            style={{
              position: 'absolute',
              width: scaled,
              left: -crop.x * scaled,
              top: -crop.y * scaled * (source.height / source.width),
              opacity: pane.opacity ?? 1,
            }}
          />
        )
      })}

      {/* Le reflet oblique. Une capture posée nue se lit comme une capture ;
          avec lui, elle se lit comme une surface qu'on a devant soi. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(112deg, oklch(1 0 0 / 0.07), transparent 44%)',
        }}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   La caméra
   ──────────────────────────────────────────────────────────────────────────── */

interface Pose {
  /** Rapprochement, en pixels : positif vers le spectateur. */
  dolly: number
  x: number
  y: number
  ry: number
  rx: number
}

/**
 * L'espace en perspective, et la pose qui l'observe.
 *
 * La transformation se lit de gauche à droite comme une caméra : on avance,
 * puis on s'oriente, puis on translate le monde. L'ordre inverse donnerait une
 * scène qui pivote autour du spectateur au lieu d'un spectateur qui se déplace
 * autour d'elle, et cela se voit immédiatement.
 */
function Stage({ pose, children }: { pose: Pose; children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: '50% 46%' }}>
      <AbsoluteFill
        style={{
          transformStyle: 'preserve-3d',
          transform:
            `translateZ(${pose.dolly}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) ` +
            `translate3d(${pose.x}px, ${pose.y}px, 0px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Une plaque posée dans l'espace, autour du centre du cadre. */
function Card({
  at,
  tilt = 0,
  pitch = 0,
  opacity = 1,
  children,
}: {
  at: [number, number, number]
  tilt?: number
  pitch?: number
  opacity?: number
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transformStyle: 'preserve-3d',
        transform:
          `translate(-50%, -50%) translate3d(${at[0]}px, ${at[1]}px, ${at[2]}px) ` +
          `rotateY(${tilt}deg) rotateX(${pitch}deg)`,
        opacity,
      }}
    >
      {children}
    </div>
  )
}

/** Le progrès du plan, déduit de l'image. Utilisé par toutes les caméras. */
function useShotProgress() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  return durationInFrames > 1 ? frame / (durationInFrames - 1) : 0
}

/* ────────────────────────────────────────────────────────────────────────────
   Le texte posé sur les plans de produit
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Le titre d'un plan de produit, toujours en haut.
 *
 * Le bas de l'image appartient aux sous-titres — en 16/9 ils ne sont qu'à
 * soixante-quatre pixels du bord — et une accroche posée au milieu passerait
 * devant l'interface qu'on est censé regarder.
 */
function Headline({ text, note }: { text: string; note?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: frame - 4, fps, config: { damping: 200, mass: 0.5 } })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 64 }}>
      {/* Un voile sombre sous le titre. Il passe par-dessus une capture, donc
          par-dessus n'importe quelle couleur : sans lui, un titre blanc tombe
          un plan sur trois dans une zone claire de l'interface. */}
      <AbsoluteFill
        style={{
          height: 260,
          background: 'linear-gradient(to bottom, oklch(0.09 0 0 / 0.86), transparent)',
        }}
      />
      <p
        style={{
          ...display,
          margin: 0,
          textAlign: 'center',
          fontSize: 58,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 22}px)`,
          textShadow: '0 6px 40px oklch(0 0 0 / 0.9)',
        }}
      >
        {text}
      </p>
      {note && (
        <p
          style={{
            ...display,
            margin: '12px 0 0',
            fontSize: 26,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: LUME,
            opacity: interpolate(frame, [12, 26], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {note}
        </p>
      )}
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte I — le problème
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * L'accroche : la caméra traverse trois plaques et vient se poser devant le
 * simulateur. Sept secondes, sans une coupe et sans un chiffre à lire.
 */
function Open() {
  const frame = useCurrentFrame()
  const progress = useShotProgress()
  const eased = 1 - (1 - progress) ** 2.4

  /*
   * L'arrivée s'arrête à quarante pixels de rapprochement, et pas trois cents.
   * La première version terminait tellement près que la plaque centrale
   * débordait du cadre des quatre côtés : on ne voyait plus une interface, on
   * voyait un morceau de dégradé.
   */
  const pose: Pose = {
    dolly: -960 + eased * 1000,
    x: 220 - eased * 220,
    y: -40 + eased * 40,
    ry: 30 - eased * 23,
    rx: 9 - eased * 6.5,
  }

  const title = interpolate(frame, [86, 112], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[-1180, 250, -720]} tilt={16} pitch={-3} opacity={0.6}>
          <Screen panes={[{ shot: 'learn' }]} width={820} crop={CROP.hero} />
        </Card>
        <Card at={[1120, -170, -420]} tilt={-14} pitch={2} opacity={0.72}>
          <Screen panes={[{ shot: 'home' }]} width={900} />
        </Card>
        <Card at={[0, 74, 0]} tilt={0} pitch={0}>
          <Screen panes={[{ shot: 'simulator' }]} width={1000} />
        </Card>
      </Stage>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 96 }}>
        <p
          style={{
            ...display,
            margin: 0,
            fontSize: 78,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            color: INK,
            opacity: title,
            transform: `translateY(${(1 - title) * 26}px)`,
            textShadow: '0 8px 50px oklch(0 0 0 / 0.95)',
          }}
        >
          You built an app
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Cinquante-six images : un seul mot d'ordre, et rien autour. */
function Worth() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.4 } })

  return (
    <AbsoluteFill style={centred}>
      <p
        style={{
          ...display,
          margin: 0,
          fontSize: 132,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          color: INK,
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [1.18, 1])})`,
          filter: `blur(${(1 - enter) * 22}px)`,
        }}
      >
        What is it worth?
      </p>
    </AbsoluteFill>
  )
}

/**
 * L'adversaire du film : le chiffre livré sans son raisonnement.
 *
 * On montre le nombre, puis on caviarde ce qui devrait l'expliquer. Le geste
 * dit tout, et il n'a besoin d'aucune légende.
 */
function BlackBox() {
  const frame = useCurrentFrame()
  const lines = [0.86, 0.72, 0.79, 0.55]

  return (
    <AbsoluteFill style={centred}>
      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 118,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: INK,
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        €412,338
      </p>

      <div style={{ width: 860, marginTop: 46, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {lines.map((share, index) => {
          const hidden = interpolate(frame, [26 + index * 9, 48 + index * 9], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: (t) => 1 - (1 - t) ** 3,
          })

          return (
            <div key={index} style={{ position: 'relative', width: `${share * 100}%`, height: 22 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  backgroundColor: 'oklch(1 0 0 / 0.14)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${hidden * 100}%`,
                  borderRadius: 999,
                  backgroundColor: RED,
                  opacity: 0.85,
                }}
              />
            </div>
          )
        })}
      </div>

      <p
        style={{
          ...display,
          margin: '48px 0 0',
          fontSize: 34,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: RED,
          opacity: interpolate(frame, [64, 84], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Reasoning withheld
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte II — le produit
   ──────────────────────────────────────────────────────────────────────────── */

function Enter() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = spring({ frame, fps, config: { damping: 200, mass: 0.5 } })
  const word = spring({ frame: frame - 8, fps, config: { damping: 200, mass: 0.5 } })

  return (
    <AbsoluteFill style={centred}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40, opacity: mark }}>
        <div style={{ width: 118, color: LUME, filter: `drop-shadow(0 0 ${34 * mark}px oklch(0.92 0.145 112 / 0.55))` }}>
          <DoveLogo className="" />
        </div>
        <div style={{ width: 460, color: INK }}>
          <ColombesWordmark className="" />
        </div>
      </div>

      <p
        style={{
          ...display,
          margin: '44px 0 0',
          fontSize: 46,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: LUME,
          opacity: word,
          transform: `translateY(${(1 - word) * 20}px)`,
        }}
      >
        Gives you the reasoning
      </p>
    </AbsoluteFill>
  )
}

/** Le premier écran : un prix, un nombre de clients, une estimation. */
function Home() {
  const progress = useShotProgress()
  const pose: Pose = {
    dolly: 20 + progress * 90,
    x: 0,
    y: 26,
    ry: 13 - progress * 9,
    rx: 5 - progress * 2.5,
  }

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[0, 76, 0]}>
          <Screen panes={[{ shot: 'home' }]} width={1160} />
        </Card>
      </Stage>
      <Headline text="A price, a customer count" note="One estimate" />
    </AbsoluteFill>
  )
}

/** Ce que l'app rend : une valorisation, sa fourchette, et son multiple. */
function Valuation() {
  const frame = useCurrentFrame()
  const progress = useShotProgress()
  const pose: Pose = {
    dolly: 80 - progress * 40,
    x: 0,
    y: 40,
    ry: -11 + progress * 8,
    rx: 4 - progress * 2,
  }
  const underline = interpolate(frame, [22, 56], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[0, 40, 0]}>
          <div style={{ position: 'relative' }}>
            <Screen panes={[{ shot: 'simulator' }]} width={1340} crop={CROP.valuation} />
            {/* Le trait sous la valorisation : il désigne, il ne réécrit rien. */}
            <div
              style={{
                position: 'absolute',
                left: '2.4%',
                top: '46%',
                width: `${underline * 30}%`,
                height: 6,
                borderRadius: 999,
                backgroundColor: LUME,
                boxShadow: `0 0 22px ${LUME}`,
              }}
            />
          </div>
        </Card>
      </Stage>
      <Headline text="Valuation, range, multiple" />
    </AbsoluteFill>
  )
}

const LEVER_TICKS = ticksOf(TIMELINE, 'levers')

/**
 * Le plan qui vaut démonstration : les prix montent, le chiffre suit.
 *
 * Les deux plaques changent d'état ensemble parce qu'elles viennent de la même
 * paire de captures — le simulateur avec ses prix par défaut, puis le même avec
 * 19, 59 et 149 €. Rien n'est animé par-dessus : ce que le film montre est ce
 * que l'app affiche.
 */
function Levers() {
  const frame = useCurrentFrame()
  const progress = useShotProgress()
  const passed = stepsPassed(frame, LEVER_TICKS)

  /*
   * Le basculement part quand le dernier cran est tombé — sinon le chiffre
   * change pendant que les curseurs montent encore — et il dure huit images.
   *
   * La première version prenait vingt-quatre images, et le milieu du fondu
   * superposait « €286,339 » à « €1,317,597 » : illisible, et lu comme un défaut
   * de rendu plutôt que comme une mise à jour. Un changement d'état d'interface
   * doit claquer ; c'est d'ailleurs ce que fait l'app.
   */
  const swap = interpolate(
    frame,
    [LEVER_TICKS.from + LEVER_TICKS.spread + 14, LEVER_TICKS.from + LEVER_TICKS.spread + 22],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  const pose: Pose = { dolly: 10 + progress * 50, x: 0, y: 60, ry: 7 - progress * 11, rx: 4 - progress * 2 }
  const panes = [{ shot: 'simulator' as Pane }, { shot: 'lifted' as Pane, opacity: swap }]

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[-500, 40, 90]} tilt={15}>
          <Screen panes={panes} width={310} crop={CROP.sliders} />
        </Card>
        <Card at={[330, 40, -60]} tilt={-8}>
          <Screen panes={panes} width={920} crop={CROP.valuation} />
        </Card>
      </Stage>

      <Headline text="Move a lever" note={passed >= LEVER_TICKS.count ? 'The number moves' : ''} />
    </AbsoluteFill>
  )
}

const HEALTH_TICKS = ticksOf(TIMELINE, 'health')

/** Les dix indicateurs, notés par rapport au marché, allumés un par un. */
function Health() {
  const frame = useCurrentFrame()
  const progress = useShotProgress()
  const lit = stepsPassed(frame, HEALTH_TICKS)
  const pose: Pose = { dolly: 90 - progress * 30, x: 0, y: 30, ry: -8 + progress * 12, rx: 6 - progress * 4 }

  const width = 1480
  const columns = 5
  const rows = 2

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[0, 60, 0]}>
          <div style={{ position: 'relative' }}>
            <Screen panes={[{ shot: 'simulator' }]} width={width} crop={CROP.health} />
            {/* Un cadre par tuile, dans l'ordre de lecture. Il souligne ce qui
                est déjà à l'écran ; il n'ajoute aucune valeur. */}
            {Array.from({ length: columns * rows }, (_, index) => {
              if (index >= lit) return null
              const column = index % columns
              const row = Math.floor(index / columns)

              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${(column / columns) * 100 + 0.5}%`,
                    top: `${(row / rows) * 100 + 2}%`,
                    width: `${100 / columns - 1}%`,
                    height: `${100 / rows - 5}%`,
                    borderRadius: 12,
                    border: `2px solid ${LUME}`,
                    boxShadow: `0 0 26px -6px ${LUME}, inset 0 0 30px -14px ${LUME}`,
                  }}
                />
              )
            })}
          </div>
        </Card>
      </Stage>
      <Headline text="Every metric, graded" note="Against the market" />
    </AbsoluteFill>
  )
}

const TIER_TICKS = ticksOf(TIMELINE, 'tiers')

/** Les cinq paliers, nommés dans l'ordre de l'app. */
function Tiers() {
  const frame = useCurrentFrame()
  const progress = useShotProgress()
  const named = stepsPassed(frame, TIER_TICKS)
  const pose: Pose = { dolly: 40 + progress * 50, x: 0, y: 0, ry: 14 - progress * 10, rx: 4 - progress * 2 }

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[0, -40, 0]}>
          <Screen panes={[{ shot: 'home' }]} width={760} crop={CROP.tier} />
        </Card>
      </Stage>

      {/* Les pastilles remontent bien au-dessus du bord : à cent soixante-huit
          pixels elles passaient sous la ligne de sous-titre, qui commence plus
          haut en 16/9 qu'en vertical. */}
      <AbsoluteFill style={{ ...centred, justifyContent: 'flex-end', paddingBottom: 268 }}>
        <div style={{ display: 'flex', gap: 22 }}>
          {PRICING_ANIMALS.map((animal, index) => {
            const on = index < named
            return (
              <span
                key={animal.name}
                style={{
                  ...display,
                  padding: '11px 22px',
                  borderRadius: 999,
                  fontSize: 24,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: on ? BG : DIM,
                  backgroundColor: on ? LUME : 'oklch(1 0 0 / 0.05)',
                  border: `1px solid ${on ? LUME : 'oklch(1 0 0 / 0.1)'}`,
                  opacity: on ? 1 : 0.35,
                }}
              >
                {animal.name}
              </span>
            )
          })}
        </div>
      </AbsoluteFill>

      <Headline text="Where you sit has a name" />
    </AbsoluteFill>
  )
}

/** Le raisonnement, écrit — la section « Understand ». */
function Learn() {
  const progress = useShotProgress()
  const pose: Pose = { dolly: 20 + progress * 80, x: 0, y: 40, ry: -14 + progress * 10, rx: 7 - progress * 4 }

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[0, 60, 0]}>
          <Screen panes={[{ shot: 'learn' }]} width={1340} crop={CROP.hero} />
        </Card>
      </Stage>
      <Headline text="And the why, written down" />
    </AbsoluteFill>
  )
}

/**
 * Le pad, l'objet signature. La bille est déjà dans la capture : on ne fait que
 * la désigner, avec une onde qui bat au ralenti.
 */
function Pad() {
  const frame = useCurrentFrame()
  const progress = useShotProgress()
  const pose: Pose = { dolly: 50 - progress * 30, x: 0, y: 30, ry: 12 - progress * 20, rx: 5 - progress * 3 }
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.11)

  return (
    <AbsoluteFill>
      <Stage pose={pose}>
        <Card at={[0, 40, 0]}>
          <div style={{ position: 'relative' }}>
            <Screen panes={[{ shot: 'home' }]} width={960} crop={CROP.pad} />
            <div
              style={{
                position: 'absolute',
                left: '62%',
                top: '61%',
                width: 150 + pulse * 44,
                height: 150 + pulse * 44,
                marginLeft: -(150 + pulse * 44) / 2,
                marginTop: -(150 + pulse * 44) / 2,
                borderRadius: '50%',
                border: `2px solid ${LUME}`,
                opacity: 0.5 - pulse * 0.3,
              }}
            />
          </div>
        </Card>
      </Stage>
      <Headline text="Or just drag the dove" />
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Acte III — ce qu'il n'y a pas, et ce qu'on demande
   ──────────────────────────────────────────────────────────────────────────── */

const FREE_TICKS = ticksOf(TIMELINE, 'free')
const ABSENT = ['No spreadsheet', 'No sales call', 'No credit card']

function Free() {
  const frame = useCurrentFrame()
  const shown = stepsPassed(frame, FREE_TICKS)

  return (
    <AbsoluteFill style={{ ...centred, gap: 22 }}>
      {ABSENT.map((line, index) => (
        <p
          key={line}
          style={{
            ...display,
            margin: 0,
            fontSize: 74,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            color: index < shown ? INK : 'transparent',
            opacity: index < shown ? 1 : 0,
          }}
        >
          {line}
        </p>
      ))}
    </AbsoluteFill>
  )
}

/**
 * La chute : la marque, et un bouton.
 *
 * Pas d'adresse à l'image — c'est ce qui a été demandé, et c'est défendable :
 * une vidéo se regarde là où elle est publiée, et une URL lue à l'écran ne se
 * clique pas. Le bouton respire lentement plutôt que de clignoter ; dix secondes
 * de clignotement useraient la seule chose que ce plan a à obtenir.
 */
function Cta() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = spring({ frame: frame - 4, fps, config: { damping: 200 } })
  const word = spring({ frame: frame - 18, fps, config: { damping: 200 } })
  const button = spring({ frame: frame - 40, fps, config: { damping: 200, mass: 0.7 } })
  const halo = 0.5 + 0.5 * Math.sin(frame * 0.055)

  return (
    <AbsoluteFill style={centred}>
      <div
        style={{
          position: 'absolute',
          width: 1500,
          height: 1500,
          borderRadius: '50%',
          background: `radial-gradient(circle, oklch(0.92 0.145 112 / ${0.05 + halo * 0.06}), transparent 62%)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 44, opacity: mark }}>
        <div
          style={{
            width: 132,
            color: LUME,
            transform: `scale(${interpolate(mark, [0, 1], [0.86, 1])})`,
            filter: `drop-shadow(0 0 ${44 * mark}px oklch(0.92 0.145 112 / 0.5))`,
          }}
        >
          <DoveLogo className="" />
        </div>
        <div
          style={{
            width: 520,
            color: INK,
            opacity: word,
            transform: `translateX(${(1 - word) * 26}px)`,
          }}
        >
          <ColombesWordmark className="" />
        </div>
      </div>

      <div
        style={{
          ...display,
          marginTop: 74,
          padding: '30px 66px',
          borderRadius: 999,
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: BG,
          backgroundColor: LUME,
          opacity: button,
          transform: `translateY(${(1 - button) * 26}px) scale(${1 + halo * 0.012})`,
          boxShadow: `0 0 ${60 + halo * 40}px -14px oklch(0.92 0.145 112 / 0.9)`,
        }}
      >
        Create your free account
      </div>

      <p
        style={{
          ...display,
          margin: '30px 0 0',
          fontSize: 26,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: DIM,
          opacity: interpolate(frame, [64, 92], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        No credit card
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le montage
   ──────────────────────────────────────────────────────────────────────────── */

const SHOT_NODES: Record<string, React.ReactNode> = {
  open: <Open />,
  worth: <Worth />,
  'black-box': <BlackBox />,
  enter: <Enter />,
  home: <Home />,
  valuation: <Valuation />,
  levers: <Levers />,
  health: <Health />,
  tiers: <Tiers />,
  learn: <Learn />,
  pad: <Pad />,
  free: <Free />,
  cta: <Cta />,
}

export function Product60({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-product.mp3"
      captions={captions}
      sound={sound}
      wide
    />
  )
}
