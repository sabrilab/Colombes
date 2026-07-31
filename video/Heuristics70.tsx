import React, { useRef } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { compute } from '../src/lib/engine'
import { DEFAULT_INPUTS } from '../src/lib/defaults'
import { HEALTH_THRESHOLDS } from '../src/lib/engine/benchmarks'
import { formatCurrency } from '../src/lib/format'
import { Closing, Eyebrow, Film, LetterLine, PricePad, SpeedLines, Whip } from './kit'
import { Scene3D } from './Scene3D'
import { lume, plaster, poseAt, project, standardLights, type CameraMove, type CameraSpec } from './three'
import { DIM, INK, LUME, RED, centred, display, mono, useCount } from './tokens'
import { stepsPassed, ticksOf } from './motion.mjs'
import { TIMELINE, TOTAL_FRAMES } from './cuts/heuristics.mjs'
import captions from './captions-heuristics.json'

/**
 * « Six rules of thumb » — le film qui parle à quelqu'un plutôt que d'un sujet.
 *
 * Les trois films précédents démontrent une mécanique. Celui-ci a un destinataire,
 * et tout en découle : le sujet de chaque phrase est le spectateur, le premier
 * mot lisible du film est « you », et le seul plan long est celui où on lui rend
 * la main. Le silence devant la question « ça vaut combien ? » n'est pas traité
 * comme une lacune mais comme une information qu'on ne lui a jamais donnée — et
 * le film consiste précisément à la lui donner, tout de suite, sans rien retenir
 * jusqu'à la fin.
 *
 * L'adversaire du film n'est pas l'acheteur : c'est le mystère entretenu autour
 * du chiffre. D'où deux plans qui se répondent, la précision fausse au centime
 * puis la fourchette assumée, et d'où le renversement de la peur : le tableur
 * n'est pas un examen, c'est une carte, et le seul qui ait jamais marché sur ce
 * terrain-là est celui qui regarde.
 *
 * Deux règles de fabrication, tenues partout :
 *
 *  — aucun chiffre n'est écrit à la main. Les six seuils viennent de
 *    `HEALTH_THRESHOLDS`, la comparaison finale de `compute()`. Un film qui
 *    annoncerait d'autres valeurs que le simulateur serait une publicité ;
 *  — pas d'arêtes. Reliefs, anneaux, cylindres, billes : le vocabulaire est
 *    courbe d'un bout à l'autre, et la seule grille rectangulaire du film est
 *    celle du tableur — c'est-à-dire ce qu'on y désigne comme l'adversaire, et
 *    elle se dissout.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Les chiffres, calculés une fois
   ──────────────────────────────────────────────────────────────────────────── */

const TODAY = compute(DEFAULT_INPUTS)

/**
 * La même entreprise avec les six règles tenues.
 *
 * Seules les entrées que les six règles nomment bougent : le churn, l'expansion
 * qui porte la NRR, le coût d'acquisition dont dépendent le LTV/CAC et le délai
 * de retour, la marge brute, et le rythme d'acquisition qui fait la croissance.
 * Ancienneté, dépendance au fondateur, concentration client : inchangées. Les
 * toucher gonflerait l'écart et la comparaison ne dirait plus ce qu'elle prétend
 * dire — le revenu mensuel, lui, est identique des deux côtés, et c'est
 * exactement ce que la voix affirme.
 */
const HELD = compute({
  ...DEFAULT_INPUTS,
  revenueChurn: 0.015,
  expansion: 0.02,
  cac: 90,
  grossMargin: 0.9,
  newCustomersPerMonth: 60,
})

if (Math.abs(HELD.revenue.mrr - TODAY.revenue.mrr) > 1) {
  throw new Error('Les deux cas n’ont pas le même revenu : la comparaison ne tient plus.')
}

/* ────────────────────────────────────────────────────────────────────────────
   Le relief — l'accroche, et la carte sur laquelle elle se referme
   ──────────────────────────────────────────────────────────────────────────── */

const TERRAIN_SIZE = { width: 1080, height: 1920 }
/** Le brouillard reprend le fond des films : sans lui, l'horizon se découpe net. */
const FOG = 0x15170f

/**
 * Le relief, en une somme de trois sinusoïdes.
 *
 * Une hauteur tirée au sort donnerait deux paysages différents entre deux
 * captures de la même image. Celle-ci est une fonction pure des coordonnées :
 * le plan, le repère et l'étiquette lisent donc tous le même terrain.
 */
function heightAt(x: number, z: number) {
  return (
    1.15 * Math.sin(x * 0.52) * Math.cos(z * 0.47) +
    0.62 * Math.sin(x * 0.24 + z * 0.33) +
    0.3 * Math.cos(x * 0.91 - z * 0.68)
  )
}

/** Où se tient le spectateur. Le reste du film y revient. */
const HERE: [number, number, number] = [1.1, heightAt(1.1, -1.4) + 0.32, -1.4]

/**
 * Le grain rond des poussières.
 *
 * `PointsMaterial` dessine des carrés pleins par défaut, et la première version
 * du plan s'est retrouvée avec cinq cents petits cubes en suspension au-dessus
 * du relief — soit précisément ce que ce film s'interdit. Une texture en dégradé
 * radial les rend ronds et diffus, ce qui est aussi ce à quoi ressemble une
 * poussière éclairée.
 */
function moteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const paint = canvas.getContext('2d')
  if (!paint) return null

  const halo = paint.createRadialGradient(32, 32, 0, 32, 32, 32)
  halo.addColorStop(0, 'rgba(255, 255, 255, 1)')
  halo.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)')
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)')
  paint.fillStyle = halo
  paint.fillRect(0, 0, 64, 64)

  return new THREE.CanvasTexture(canvas)
}

function buildTerrain(scene: THREE.Scene) {
  scene.fog = new THREE.Fog(FOG, 6, 34)
  standardLights(scene)

  const relief = (segments: number) => {
    const geometry = new THREE.PlaneGeometry(34, 34, segments, segments)
    geometry.rotateX(-Math.PI / 2)
    const position = geometry.attributes.position
    for (let i = 0; i < position.count; i++) {
      position.setY(i, heightAt(position.getX(i), position.getZ(i)))
    }
    geometry.computeVertexNormals()
    return geometry
  }

  scene.add(new THREE.Mesh(relief(150), plaster(0x21231b)))

  // Les courbes de niveau : le même relief, plus grossier, en fil de fer posé
  // un centimètre au-dessus. C'est ce qui fait lire le plan comme une carte
  // plutôt que comme un décor. Trente-quatre divisions et pas quarante-quatre :
  // au-delà, le filet devient un voile et on ne lit plus le relief dessous.
  const net = new THREE.Mesh(
    relief(34),
    new THREE.MeshBasicMaterial({ color: 0xa9c95c, wireframe: true, transparent: true, opacity: 0.26 }),
  )
  net.position.y = 0.015
  scene.add(net)

  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), lume(0.9))
  marker.position.set(...HERE)
  scene.add(marker)

  // Le faisceau : une bille seule se perd dans le relief dès qu'on s'éloigne.
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.008, 5, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xd6ee6b, transparent: true, opacity: 0.14 }),
  )
  beam.position.set(HERE[0], HERE[1] + 2.5, HERE[2])
  scene.add(beam)

  // La poussière lumineuse. Elle ne sert à rien d'autre qu'à donner de la
  // profondeur : sans elle, l'air entre la caméra et le relief est vide.
  const motes = new THREE.BufferGeometry()
  const points = new Float32Array(520 * 3)
  for (let i = 0; i < 520; i++) {
    const angle = i * 2.399
    const radius = 1 + ((i * 37) % 100) / 100 * 13
    points[i * 3] = Math.cos(angle) * radius
    points[i * 3 + 1] = 0.2 + ((i * 53) % 100) / 100 * 4.6
    points[i * 3 + 2] = Math.sin(angle) * radius
  }
  motes.setAttribute('position', new THREE.BufferAttribute(points, 3))
  const dust = new THREE.Points(
    motes,
    new THREE.PointsMaterial({
      color: 0xd6ee6b,
      size: 0.1,
      map: moteTexture(),
      transparent: true,
      opacity: 0.7,
      // Sans ça, chaque poussière creuse un trou dans celles qui sont derrière
      // et le nuage se met à scintiller selon l'ordre de tri.
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  scene.add(dust)

  return dust
}

/**
 * La caméra de l'accroche : une seule course, de loin vers le repère.
 *
 * Les distances comptent plus qu'il n'y paraît. La première version arrivait à
 * une unité et demie du repère : la bille remplissait le cadre, le filet passait
 * devant l'objectif et il ne restait rien du paysage — un plan de relief qui ne
 * montre pas de relief. On termine donc à une douzaine d'unités, assez loin pour
 * garder l'horizon dans l'image et le repère petit.
 */
const youCamera: CameraMove = (progress) => {
  const eased = 1 - (1 - progress) ** 2.6
  return {
    position: [-6.2 + eased * 5.1, 2.2 + eased * 4.2, 14 - eased * 5.4],
    target: [HERE[0], 0.4, HERE[2]],
    fov: 46 - eased * 10,
  }
}

/** Celle de la carte : plus haute encore, presque immobile, en travelling latéral. */
const mapCamera: CameraMove = (progress) => ({
  position: [-4.2 + progress * 3, 7.6, 9.4 - progress * 0.7],
  target: [HERE[0], 0.4, HERE[2]],
  fov: 40,
})

/**
 * Le plan de relief, partagé par l'accroche et par la carte.
 *
 * L'étiquette « you are here » n'est pas collée à une position d'écran : elle est
 * projetée depuis la position du repère dans la scène, avec la pose exacte de la
 * caméra à cette image. Elle suit donc le relief pendant que la caméra bouge, ce
 * qu'un placement en pourcentage ne saurait pas faire.
 */
function Relief({
  camera,
  title,
  note,
  titleFrom,
}: {
  camera: CameraMove
  title?: string
  note?: string
  titleFrom: number
}) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const dustRef = useRef<THREE.Points | null>(null)

  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0
  const here = project(HERE, poseAt(camera, progress, frame), TERRAIN_SIZE.width, TERRAIN_SIZE.height)

  const tag = spring({ frame: frame - titleFrom, fps, config: { damping: 200, mass: 0.6 } })
  const line = spring({ frame: frame - titleFrom - 10, fps, config: { damping: 200, mass: 0.7 } })

  return (
    <AbsoluteFill style={centred}>
      <Scene3D
        {...TERRAIN_SIZE}
        camera={camera}
        build={(scene) => {
          dustRef.current = buildTerrain(scene)
        }}
        update={(shotFrame) => {
          // La poussière tourne lentement et respire : deux mouvements lents et
          // décalés suffisent à ce que l'air n'ait pas l'air figé.
          const dust = dustRef.current
          if (!dust) return
          dust.rotation.y = shotFrame * 0.0016
          dust.position.y = Math.sin(shotFrame * 0.011) * 0.22
        }}
      />

      {/* Le repère, projeté depuis la scène. */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <span
          style={{
            position: 'absolute',
            left: here.x,
            top: here.y,
            width: 1,
            height: 96 * line,
            transformOrigin: '50% 100%',
            transform: 'translate(-50%, -100%)',
            background: `linear-gradient(to top, ${LUME}, transparent)`,
            opacity: line,
          }}
        />
        <span
          style={{
            ...display,
            position: 'absolute',
            left: here.x,
            top: here.y - 104,
            transform: `translate(-50%, -100%) translateY(${(1 - tag) * 14}px)`,
            whiteSpace: 'nowrap',
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: LUME,
            opacity: tag,
            textShadow: '0 0 24px oklch(0 0 0 / 0.9)',
          }}
        >
          You are here
        </span>
      </AbsoluteFill>

      {title && (
        <AbsoluteFill style={{ ...centred, justifyContent: 'flex-end', paddingBottom: 320 }}>
          <p
            style={{
              ...display,
              margin: 0,
              textAlign: 'center',
              fontSize: 92,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: INK,
              opacity: tag,
              transform: `translateY(${(1 - tag) * 26}px)`,
              textShadow: '0 0 40px oklch(0 0 0 / 0.85)',
            }}
          >
            {title}
          </p>
          {note && (
            <p
              style={{
                ...display,
                margin: '14px 0 0',
                fontSize: 32,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: DIM,
                opacity: line,
              }}
            >
              {note}
            </p>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}

/**
 * Le motif de fond des plans à plat : des courbes fermées, très peu marquées.
 *
 * Il ne raconte rien, et c'est son rôle. Un plan de texte sur fond noir paraît
 * vide dans un cadre vertical, et le remplir de décor le rendrait bavard. Ces
 * anneaux respirent lentement, rappellent la carte du premier plan, et se
 * remarquent surtout quand ils disparaissent.
 */
function Contours({ rings = 8, tone = 'oklch(0.92 0.145 112 / 0.07)' }: { rings?: number; tone?: string }) {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={centred}>
      <svg viewBox="-620 -620 1240 1240" style={{ width: 1560, height: 1560 }}>
        {Array.from({ length: rings }, (_, index) => {
          const radius = 96 + index * 66 + Math.sin(frame * 0.018 + index * 0.7) * 7
          return (
            <ellipse
              key={index}
              rx={radius}
              ry={radius * 0.74}
              fill="none"
              stroke={tone}
              strokeWidth="2"
              transform={`rotate(${index * 6 - 12})`}
            />
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le silence devant la question
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Le chiffre qui ne vient pas.
 *
 * Les chiffres défilent — dérivés du numéro d'image, donc identiques d'une
 * capture à l'autre — puis se brouillent d'un coup et laissent un point
 * d'interrogation. C'est le seul plan du film où l'on montre une valeur illisible,
 * et il dure moins de trois secondes.
 */
function Quiet() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const give = interpolate(frame, [40, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const mark = spring({ frame: frame - 46, fps, config: { damping: 200, mass: 0.5 } })

  return (
    <AbsoluteFill style={centred}>
      <Contours rings={6} />
      <Eyebrow>What is it worth?</Eyebrow>

      <p
        style={{
          ...mono,
          margin: 0,
          fontSize: 132,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: INK,
          opacity: 1 - give,
          filter: `blur(${give * 26}px)`,
          transform: `scale(${1 - give * 0.08})`,
        }}
      >
        €
        {Array.from({ length: 6 }, (_, index) => (frame * (index + 2) + index * 7) % 10).join('')}
      </p>

      <p
        style={{
          ...display,
          position: 'absolute',
          margin: 0,
          fontSize: 300,
          fontWeight: 700,
          color: LUME,
          opacity: mark * 0.9,
          transform: `scale(${interpolate(mark, [0, 1], [1.4, 1])})`,
          filter: `blur(${(1 - mark) * 30}px)`,
        }}
      >
        ?
      </p>
    </AbsoluteFill>
  )
}

/**
 * « Ce n'est pas une lacune chez toi. »
 *
 * Une courbe interrompue qui se referme. Cinquante images : le plan doit se lire
 * d'un coup d'œil, donc il ne porte qu'une idée et deux mots.
 */
function NotAGap() {
  const frame = useCurrentFrame()
  const close = interpolate(frame, [4, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })

  return (
    <AbsoluteFill style={centred}>
      <Contours rings={5} />
      <svg viewBox="0 0 900 320" style={{ width: 900, height: 320 }}>
        <path
          d="M 40 250 C 220 250, 260 70, 450 70 C 640 70, 680 250, 860 250"
          fill="none"
          stroke={LUME}
          strokeWidth="12"
          strokeLinecap="round"
          pathLength={1}
          // La coupure se referme par les deux bouts : un tiret qui s'allonge
          // d'un seul côté se lirait comme un tracé, pas comme une réparation.
          strokeDasharray={`${0.42 + close * 0.29} ${Math.max(0.001, 0.16 - close * 0.16)} ${0.42 + close * 0.29}`}
        />
      </svg>

      <p
        style={{
          ...display,
          margin: '20px 0 0',
          fontSize: 104,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          color: INK,
          opacity: interpolate(frame, [12, 26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Not a gap
      </p>
    </AbsoluteFill>
  )
}

/**
 * La fausse précision, puis son démenti.
 *
 * Un chiffre au centime porte une autorité qu'aucune valorisation ne mérite. On
 * le montre, on le barre, et le plan suivant donne la fourchette que l'app affiche
 * vraiment — celle de `valuation.low` et `valuation.high`.
 */
function NobodyComputes() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const strike = spring({ frame: frame - 52, fps, config: { damping: 200, mass: 0.5 } })
  const verdict = spring({ frame: frame - 66, fps, config: { damping: 200, mass: 0.6 } })

  return (
    <AbsoluteFill style={centred}>
      <Contours rings={6} tone="oklch(0.7 0.2 25 / 0.07)" />
      <Eyebrow>Every calculator</Eyebrow>

      <div style={{ position: 'relative' }}>
        <p
          style={{
            ...mono,
            margin: 0,
            fontSize: 108,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: INK,
            opacity: 1 - verdict * 0.6,
          }}
        >
          €412,338.07
        </p>
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: '52%',
            width: `${strike * 100}%`,
            height: 10,
            borderRadius: 999,
            backgroundColor: RED,
            boxShadow: `0 0 26px ${RED}`,
          }}
        />
      </div>

      <p
        style={{
          ...display,
          margin: '18px 0 0',
          fontSize: 30,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: DIM,
        }}
      >
        To the cent
      </p>

      <p
        style={{
          ...display,
          margin: '54px 0 0',
          textAlign: 'center',
          fontSize: 76,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          lineHeight: 1.06,
          color: RED,
          opacity: verdict,
          transform: `translateY(${(1 - verdict) * 34}px)`,
        }}
      >
        Nobody
        <br />
        computes that
      </p>
    </AbsoluteFill>
  )
}

/** La fourchette, telle que l'app la publie : ±15 % autour de la valeur. */
function Estimate() {
  const frame = useCurrentFrame()
  const open = interpolate(frame, [2, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 70px' }}>
      <Contours rings={7} />
      <Eyebrow tone={LUME}>They estimate it</Eyebrow>

      <div style={{ position: 'relative', width: '100%', height: 130 }}>
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: `${50 - open * 50}%`,
            right: `${50 - open * 50}%`,
            height: 42,
            borderRadius: 999,
            background: `linear-gradient(90deg, transparent, ${LUME}, transparent)`,
            opacity: 0.75,
            filter: 'blur(2px)',
          }}
        />
        <span
          style={{
            ...mono,
            position: 'absolute',
            left: 0,
            top: 0,
            fontSize: 44,
            color: DIM,
            opacity: open,
          }}
        >
          {formatCurrency(Math.round(TODAY.valuation.low))}
        </span>
        <span
          style={{
            ...mono,
            position: 'absolute',
            right: 0,
            top: 0,
            fontSize: 44,
            color: DIM,
            opacity: open,
          }}
        >
          {formatCurrency(Math.round(TODAY.valuation.high))}
        </span>
      </div>

      <p
        style={{
          ...display,
          margin: '24px 0 0',
          fontSize: 82,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
        }}
      >
        Rules of thumb
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Les six règles
   ──────────────────────────────────────────────────────────────────────────── */

const SIX_TICKS = ticksOf(TIMELINE, 'six')
const RING_SIZE = { width: 1000, height: 1000 }
/**
 * Sept unités et non cinq : à cinq, l'anneau le plus large touchait les bords du
 * cadre et le compteur posé dessous se retrouvait dans les anneaux.
 */
const RING_CAMERA: CameraMove = (progress) => {
  const angle = -0.5 + progress * 0.9
  return { position: [Math.sin(angle) * 7, 2, Math.cos(angle) * 7], target: [0, 0, 0], fov: 34 }
}

/**
 * Six anneaux autour d'un noyau, un par cran.
 *
 * Ils arrivent au rythme du son et ne se ressemblent pas : chacun a son
 * inclinaison. Six cercles identiques se liraient comme une seule forme, et le
 * plan doit dire « six », pas « un ».
 */
function SixRules() {
  const frame = useCurrentFrame()
  const ringsRef = useRef<THREE.Mesh[]>([])
  const shown = stepsPassed(frame, SIX_TICKS)

  return (
    <AbsoluteFill style={centred}>
      <Scene3D
        {...RING_SIZE}
        camera={RING_CAMERA}
        build={(scene) => {
          standardLights(scene)
          scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 30), plaster(0xe6e6de)))

          ringsRef.current = Array.from({ length: 6 }, (_, index) => {
            const ring = new THREE.Mesh(
              new THREE.TorusGeometry(1.05 + index * 0.26, 0.028, 14, 128),
              lume(0.55),
            )
            ring.rotation.set(
              Math.PI / 2 + Math.sin(index * 1.7) * 0.6,
              index * 0.5,
              Math.cos(index * 2.1) * 0.5,
            )
            scene.add(ring)
            return ring
          })
        }}
        update={(shotFrame) => {
          const passed = stepsPassed(shotFrame, SIX_TICKS)
          ringsRef.current.forEach((ring, index) => {
            const on = index < passed
            ring.visible = on
            ring.scale.setScalar(on ? 1 : 0.001)
            // Déduite de l'image, jamais accumulée : une rotation incrémentée à
            // chaque rendu donnerait un angle différent selon l'ordre de capture.
            ring.rotation.z = Math.cos(index * 2.1) * 0.5 + shotFrame * 0.004
          })
        }}
      />

      <AbsoluteFill style={{ ...centred, justifyContent: 'flex-end', paddingBottom: 230 }}>
        <p
          style={{
            ...display,
            margin: 0,
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: INK,
          }}
        >
          {shown}
        </p>
        <p
          style={{
            ...display,
            margin: '2px 0 0',
            fontSize: 32,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          Rules of thumb
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/**
 * Les six règles, lues dans les seuils de l'app.
 *
 * `scale` situe le seuil sur le cadran, `direction` dit de quel côté est la bonne
 * zone. L'aiguille s'arrête exactement sur le seuil : c'est ce qui distingue un
 * schéma d'une décoration — on peut y lire la règle, pas seulement la deviner.
 */
const RULES = [
  {
    id: 'churn',
    ordinal: 'One',
    metric: 'revenueChurn' as const,
    title: 'Churn',
    scale: [0, 0.08] as [number, number],
    read: (value: number) => `${(value * 100).toFixed(0)}%`,
    tail: 'of revenue leaving, a month',
  },
  {
    id: 'nrr',
    ordinal: 'Two',
    metric: 'nrr' as const,
    title: 'Net revenue retention',
    scale: [0.7, 1.3] as [number, number],
    read: (value: number) => `${Math.round(value * 100)}%`,
    tail: 'the ones who stay spend more',
  },
  {
    id: 'ltv-cac',
    ordinal: 'Three',
    metric: 'ltvCacRatio' as const,
    title: 'Lifetime value over cost',
    scale: [0, 8] as [number, number],
    read: (value: number) => `${value}×`,
    tail: 'worth three times what they cost',
  },
  {
    id: 'payback',
    ordinal: 'Four',
    metric: 'paybackMonths' as const,
    title: 'Payback',
    scale: [0, 24] as [number, number],
    read: (value: number) => `${value} mo`,
    tail: 'to earn that cost back',
  },
  {
    id: 'margin',
    ordinal: 'Five',
    metric: 'grossMargin' as const,
    title: 'Gross margin',
    scale: [0.5, 1] as [number, number],
    read: (value: number) => `${Math.round(value * 100)}%`,
    tail: 'left after serving them',
  },
  {
    id: 'rule-of-40',
    ordinal: 'Six',
    metric: 'ruleOf40' as const,
    title: 'Rule of 40',
    scale: [0, 100] as [number, number],
    read: (value: number) => `${value}`,
    tail: 'growth plus margin',
  },
]

const RULE_TICKS = Object.fromEntries(RULES.map((rule) => [rule.id, ticksOf(TIMELINE, rule.id)]))

/** L'angle, en degrés, d'une position 0→1 sur un demi-cadran. */
function arcPoint(position: number, radius: number) {
  const angle = Math.PI * (1 - position)
  return { x: 300 + Math.cos(angle) * radius, y: 300 - Math.sin(angle) * radius }
}

function Rule({ rule, ordinal }: { rule: (typeof RULES)[number]; ordinal: number }) {
  const frame = useCurrentFrame()
  const threshold = HEALTH_THRESHOLDS[rule.metric]
  const ticks = RULE_TICKS[rule.id]

  const [low, high] = rule.scale
  const at = (threshold.good - low) / (high - low)
  const run = stepsPassed(frame, ticks) / ticks.count
  const swept = run * at

  // La bonne zone occupe le côté que la règle désigne : à gauche du seuil quand
  // il faut rester en dessous, à droite quand il faut passer au-dessus.
  const zone = threshold.direction === 'down' ? { from: 0, to: at } : { from: at, to: 1 }

  const path = (from: number, to: number, radius: number) => {
    const a = arcPoint(from, radius)
    const b = arcPoint(to, radius)
    return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`
  }

  const needle = arcPoint(swept, 236)

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 60px' }}>
      {/* Le rang de la règle, en fond. Six plans qui se suivent en moins de dix
          secondes ont besoin qu'on sache où l'on en est sans avoir à lire. */}
      <p
        style={{
          ...display,
          position: 'absolute',
          margin: 0,
          fontSize: 1000,
          lineHeight: 1,
          fontWeight: 700,
          color: LUME,
          opacity: 0.05,
        }}
      >
        {ordinal}
      </p>

      <Eyebrow gap={18}>
        Rule {rule.ordinal} · {rule.title}
      </Eyebrow>

      <svg viewBox="0 0 600 330" style={{ width: 900, height: 495 }}>
        <path d={path(0, 1, 236)} fill="none" stroke="oklch(1 0 0 / 0.1)" strokeWidth="26" strokeLinecap="round" />
        {/* La zone s'éclaire au fil de l'aiguille plutôt qu'à l'arrivée : sur un
            plan d'une seconde et demie, un allumage final ne dure que trois
            images et on ne le voit pas. */}
        <path
          d={path(zone.from, zone.to, 236)}
          fill="none"
          stroke={LUME}
          strokeWidth="26"
          strokeLinecap="round"
          opacity={0.14 + run * 0.24}
        />
        <line x1="300" y1="300" x2={needle.x} y2={needle.y} stroke={INK} strokeWidth="9" strokeLinecap="round" />
        <circle cx="300" cy="300" r="17" fill={LUME} />
      </svg>

      {/* La valeur sous le cadran, jamais dedans : l'aiguille balaie tout
          l'intérieur du demi-cercle, et un chiffre posé là serait traversé. */}
      <p
        style={{
          ...mono,
          margin: '10px 0 0',
          fontSize: 156,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          color: LUME,
        }}
      >
        {rule.read(threshold.good)}
      </p>

      <p
        style={{
          ...display,
          margin: '14px 0 0',
          textAlign: 'center',
          fontSize: 54,
          fontWeight: 700,
          lineHeight: 1.1,
          color: INK,
        }}
      >
        {rule.tail}
      </p>
      <p
        style={{
          ...mono,
          margin: '20px 0 0',
          fontSize: 28,
          color: DIM,
          opacity: interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        {threshold.label}
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Ce que les six changent
   ──────────────────────────────────────────────────────────────────────────── */

const COLUMN_SIZE = { width: 1040, height: 1000 }
const COLUMN_CAMERA: CameraMove = (progress) => {
  const angle = -0.4 + progress * 0.7
  return { position: [Math.sin(angle) * 5.6, 2.2, Math.cos(angle) * 5.6], target: [0, 1.1, 0], fov: 34 }
}

const COLUMNS = [
  { key: 'today', x: -1.1, result: TODAY, label: 'Six missed', tone: DIM },
  { key: 'held', x: 1.1, result: HELD, label: 'Six held', tone: LUME },
]
const TALLEST = 2.5

/**
 * Deux colonnes de même diamètre et de hauteurs différentes.
 *
 * Le même revenu des deux côtés — la garde plus haut le vérifie — et le seul
 * écart est celui des six règles. Des cylindres et non des barres : le film n'a
 * pas une arête vive, et un volume qui tourne se lit mieux qu'un rectangle plat.
 */
function WorthTwice() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const columnsRef = useRef<THREE.Mesh[]>([])
  const label = spring({ frame: frame - 24, fps, config: { damping: 200, mass: 0.8 } })
  const counted = useCount(1, { delay: 10, duration: 54 })
  // La caméra tourne : les étiquettes se projettent depuis la pose de l'image
  // courante, sinon elles restent où les colonnes étaient au milieu du plan.
  const pose = poseAt(COLUMN_CAMERA, durationInFrames > 1 ? frame / (durationInFrames - 1) : 0, frame)

  return (
    <AbsoluteFill style={centred}>
      <Eyebrow gap={6}>Same {formatCurrency(Math.round(TODAY.revenue.mrr))} a month</Eyebrow>

      <div style={{ position: 'relative', ...COLUMN_SIZE }}>
        <Scene3D
          {...COLUMN_SIZE}
          camera={COLUMN_CAMERA}
          build={(scene) => {
            standardLights(scene)
            const floor = new THREE.Mesh(
              new THREE.CircleGeometry(3.4, 64),
              new THREE.MeshBasicMaterial({ color: 0x23251c }),
            )
            floor.rotation.x = -Math.PI / 2
            scene.add(floor)

            columnsRef.current = COLUMNS.map((column) => {
              const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.52, 0.52, 1, 48),
                column.key === 'held' ? lume(0.32) : plaster(0xdcdcd4),
              )
              mesh.position.set(column.x, 0, 0)
              scene.add(mesh)
              return mesh
            })
          }}
          update={(shotFrame) => {
            const rise = Math.min(1, Math.max(0, (shotFrame - 10) / 54)) ** 0.7
            columnsRef.current.forEach((mesh, index) => {
              const share = COLUMNS[index].result.valuation.value / HELD.valuation.value
              const height = Math.max(0.02, TALLEST * share * rise)
              mesh.scale.set(1, height, 1)
              mesh.position.y = height / 2
            })
          }}
        />

        {COLUMNS.map((column) => {
          const foot = project([column.x, 0, 0.6], pose, COLUMN_SIZE.width, COLUMN_SIZE.height)

          return (
            <span
              key={column.key}
              style={{
                position: 'absolute',
                left: foot.x,
                top: foot.y + 26,
                transform: 'translateX(-50%)',
                textAlign: 'center',
                opacity: label,
              }}
            >
              <span style={{ ...mono, display: 'block', fontSize: 44, fontWeight: 600, color: column.tone, whiteSpace: 'nowrap' }}>
                {formatCurrency(Math.round(column.result.valuation.value * counted))}
              </span>
              <span
                style={{
                  ...display,
                  display: 'block',
                  marginTop: 6,
                  fontSize: 27,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: DIM,
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label} · {column.result.valuation.multiple.toFixed(1)}×
              </span>
            </span>
          )
        })}
      </div>

      <p
        style={{
          ...display,
          margin: '10px 0 0',
          fontSize: 58,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: LUME,
          opacity: label,
        }}
      >
        {(HELD.valuation.value / TODAY.valuation.value).toFixed(1)}× more
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le conseil qu'on lui a donné, et ce qu'on regarde vraiment
   ──────────────────────────────────────────────────────────────────────────── */

const SWARM_SIZE = { width: 1080, height: 1200 }
const SWARM_CAMERA: CameraSpec = { position: [0, 0.2, 6], target: [0, 0, 0], fov: 46 }
const SWARM_SPAN = 26

/** Un flot de billes qui passe : « va chercher plus de clients », en image. */
function LazyAdvice() {
  const frame = useCurrentFrame()
  const swarmRef = useRef<THREE.Mesh[]>([])

  return (
    <AbsoluteFill style={centred}>
      <Scene3D
        {...SWARM_SIZE}
        camera={SWARM_CAMERA}
        build={(scene) => {
          standardLights(scene)
          swarmRef.current = Array.from({ length: 120 }, (_, index) => {
            const angle = index * 2.399
            const radius = 0.5 + ((index * 37) % 100) / 100 * 3.4
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(0.11 + ((index * 17) % 40) / 400, 18, 14),
              plaster(0x8f9184),
            )
            mesh.userData.home = [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7]
            mesh.userData.offset = ((index * 53) % 100) / 100
            scene.add(mesh)
            return mesh
          })
        }}
        update={(shotFrame) => {
          swarmRef.current.forEach((mesh) => {
            const [x, y] = mesh.userData.home as [number, number]
            // Le flot avance vers l'objectif et repart derrière : une boucle
            // déduite de l'image, donc identique d'une capture à l'autre.
            const z = ((mesh.userData.offset as number) * SWARM_SPAN + shotFrame * 0.19) % SWARM_SPAN
            mesh.position.set(x, y, z - SWARM_SPAN + 4)
          })
        }}
      />

      <AbsoluteFill style={{ ...centred, padding: '0 80px' }}>
        <p
          style={{
            ...display,
            margin: 0,
            textAlign: 'center',
            fontSize: 96,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
            color: INK,
            textShadow: '0 0 50px oklch(0 0 0 / 0.9)',
          }}
        >
          Just get
          <br />
          more users
        </p>
        <p
          style={{
            ...display,
            margin: '26px 0 0',
            fontSize: 32,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: DIM,
            opacity: interpolate(frame, [26, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          — everyone
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/**
 * Ce qu'on lit à la place : deux courbes de rétention.
 *
 * Elles ne sont pas dessinées à vue — ce sont les seuils de l'app, `good` et
 * `warn`, élevés à la puissance des mois. La bonne tient au-dessus de la moitié
 * au bout de deux ans, l'autre n'existe plus.
 */
const MONTHS = 24
const RETENTION = [
  { key: 'good', churn: HEALTH_THRESHOLDS.revenueChurn.good, tone: LUME },
  { key: 'warn', churn: 0.08, tone: RED },
]

function curveOf(churn: number) {
  return Array.from({ length: MONTHS + 1 }, (_, month) => {
    const kept = (1 - churn) ** month
    return `${40 + (month / MONTHS) * 800},${380 - kept * 320}`
  }).join(' ')
}

function YouWereRight() {
  const frame = useCurrentFrame()
  const draw = interpolate(frame, [8, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  })

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 60px' }}>
      <Contours rings={6} />
      <Eyebrow>They read whether they stay</Eyebrow>

      <svg viewBox="0 0 880 420" style={{ width: 880, height: 420 }}>
        <line x1="40" y1="380" x2="840" y2="380" stroke="oklch(1 0 0 / 0.14)" strokeWidth="2" />
        {RETENTION.map((line) => (
          <polyline
            key={line.key}
            points={curveOf(line.churn)}
            fill="none"
            stroke={line.tone}
            strokeWidth={line.key === 'good' ? 10 : 6}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - draw}
            opacity={line.key === 'good' ? 1 : 0.6}
          />
        ))}
      </svg>

      <div style={{ display: 'flex', gap: 60, marginTop: 10 }}>
        {RETENTION.map((line) => (
          <span key={line.key} style={{ ...mono, fontSize: 34, color: line.tone }}>
            {(line.churn * 100).toFixed(0)} % / mo
          </span>
        ))}
      </div>

      <p
        style={{
          ...display,
          margin: '30px 0 0',
          fontSize: 62,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: INK,
        }}
      >
        You were right
      </p>
    </AbsoluteFill>
  )
}

/**
 * La peur, et sa dissolution.
 *
 * C'est la seule grille rectangulaire du film, et c'est délibéré : elle désigne
 * ce dont on a peur. Elle se construit en deux secondes, puis s'efface — le plan
 * suivant est la carte, et le passage de l'une à l'autre est tout l'argument.
 */
function Fear() {
  const frame = useCurrentFrame()
  const built = interpolate(frame, [0, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const gone = interpolate(frame, [74, 112], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const columns = 6
  const rows = 14

  return (
    <AbsoluteFill style={{ ...centred, padding: '0 60px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          width: '100%',
          gap: 1,
          backgroundColor: 'oklch(1 0 0 / 0.08)',
          border: '1px solid oklch(1 0 0 / 0.08)',
          opacity: (1 - gone) * 0.85,
          filter: `blur(${gone * 22}px)`,
          transform: `scale(${1 + gone * 0.12})`,
        }}
      >
        {Array.from({ length: columns * rows }, (_, index) => (
          <span
            key={index}
            style={{
              ...mono,
              padding: '13px 8px',
              textAlign: 'right',
              fontSize: 21,
              color: 'oklch(0.72 0 0)',
              backgroundColor: 'oklch(0.15 0.004 110)',
              opacity: index / (columns * rows) < built ? 1 : 0,
            }}
          >
            {(((index * 6791) % 9000) + 1000).toLocaleString('en-US')}
          </span>
        ))}
      </div>

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
          color: INK,
          opacity: gone,
          transform: `scale(${interpolate(gone, [0, 1], [1.3, 1])})`,
          filter: `blur(${(1 - gone) * 26}px)`,
          textShadow: '0 0 60px oklch(0 0 0 / 0.9)',
        }}
      >
        Backwards
      </p>
    </AbsoluteFill>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
   Le montage
   ──────────────────────────────────────────────────────────────────────────── */

const SHOT_NODES: Record<string, React.ReactNode> = {
  you: <Relief camera={youCamera} titleFrom={120} />,
  quiet: <Quiet />,
  'not-a-gap': <NotAGap />,
  'nobody-computes': <NobodyComputes />,
  estimate: <Estimate />,
  six: <SixRules />,
  ...Object.fromEntries(
    RULES.map((rule, index) => [rule.id, <Rule key={rule.id} rule={rule} ordinal={index + 1} />]),
  ),
  'worth-twice': <WorthTwice />,
  'lazy-advice': <LazyAdvice />,
  'you-were-right': <YouWereRight />,
  fear: <Fear />,
  map: <Relief camera={mapCamera} titleFrom={14} title="It's a map" note="And you have walked it" />,
  pad: <PricePad caption="All six, in your hands" />,
  today: (
    <>
      <SpeedLines count={18} />
      <Whip from="in" blur={26}>
        <LetterLine text="Your app is worth something today" accent="today" size={92} />
      </Whip>
    </>
  ),
  closing: <Closing halo={216} />,
}

export function Heuristics70({ sound = true }: { sound?: boolean }) {
  return (
    <Film
      timeline={TIMELINE}
      nodes={SHOT_NODES}
      frames={TOTAL_FRAMES}
      mix="film/mix-heuristics.mp3"
      captions={captions}
      sound={sound}
    />
  )
}
