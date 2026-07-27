import { useCallback, useRef, useState } from 'react'
import { Lock, LockOpen } from 'lucide-react'
import { DoveLogo } from '@/components/DoveLogo'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { useT } from '@/store/simulator'
import { DEFAULT_LAYERS, type PadLayers } from '@/lib/padVariants'
import {
  animalFor,
  isoRevenueSegment,
  PAD_BOUNDS,
  PRICING_ANIMALS,
  padToParams,
  paramsToPad,
  type PadParams,
} from '@/lib/pricePad'

/** Bandes horizontales des paliers de Janz, projetées une fois pour toutes. */
const ANIMAL_BANDS = PRICING_ANIMALS.map((animal) => {
  const top = paramsToPad({ price: Math.min(animal.maxPrice, PAD_BOUNDS.price.max), customers: 1 }).y
  const bottom = paramsToPad({ price: animal.minPrice, customers: 1 }).y
  return { ...animal, top, height: bottom - top }
})

/** Courbes d'iso-revenu : texture de fond, volontairement muette. */
const ISO_MRR = [1_000, 10_000, 100_000, 1_000_000]
const ISO_SEGMENTS = ISO_MRR.map(isoRevenueSegment).filter(
  (segment): segment is NonNullable<typeof segment> => Boolean(segment),
)
const ISO_LABELS = ISO_MRR.filter((mrr) => isoRevenueSegment(mrr) !== null).map(
  (mrr) => `${formatCompactCurrency(mrr)} MRR`,
)

/** Repères d'axes, aux ordres de grandeur : ils situent sans strier la surface. */
const CUSTOMER_TICKS = [1, 10, 100, 1_000, 10_000].map((value) => ({
  value,
  label: value >= 1_000 ? `${value / 1_000}K` : String(value),
  x: paramsToPad({ price: 1, customers: value }).x,
}))

const PRICE_TICKS = [1, 10, 100, 500].map((value) => ({
  value,
  label: `€${value}`,
  y: paramsToPad({ price: value, customers: 1 }).y,
}))

/** Pas clavier : 2,5 % du pad par flèche, 10 % avec Maj. */
const STEP = 0.025

/**
 * Suite de Halton (bases 2 et 3) : une répartition quasi aléatoire mais
 * déterministe, pour que l'essaim de clients ne saute pas d'un rendu à l'autre.
 */
const SWARM = Array.from({ length: 90 }, (_, index) => {
  const halton = (n: number, base: number) => {
    let result = 0
    let f = 1 / base
    let i = n + 1
    while (i > 0) {
      result += f * (i % base)
      i = Math.floor(i / base)
      f /= base
    }
    return result
  }
  return { u: halton(index, 2), v: halton(index, 3) }
})

interface LockState {
  price: boolean
  customers: boolean
}

function Readout({
  label,
  value,
  unit,
  locked,
  onToggleLock,
}: {
  label: string
  value: string
  unit?: string
  locked: boolean
  onToggleLock: () => void
}) {
  const LockIcon = locked ? Lock : LockOpen
  const t = useT()

  return (
    <div className="flex items-start gap-2">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t(label)}</p>
        <p
          className={`font-mono text-2xl font-semibold tabular-nums transition-colors lg:text-3xl ${
            locked ? 'text-lume' : ''
          }`}
        >
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground">{t(unit)}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggleLock}
        aria-pressed={locked}
        aria-label={t(locked ? 'Unlock {label}' : 'Lock {label}', { label: t(label) })}
        className={`mt-4 rounded-md p-1 transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
          locked ? 'text-lume' : 'text-muted-foreground/50 hover:text-foreground'
        }`}
      >
        <LockIcon className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

interface PricePadProps {
  params: PadParams
  onChange: (params: PadParams) => void
  /** Couches affichées. Par défaut, toutes — voir padVariants.ts. */
  layers?: PadLayers
}

export function PricePad({ params, onChange, layers = DEFAULT_LAYERS }: PricePadProps) {
  const padRef = useRef<HTMLDivElement>(null)
  // Le garde du glissement vit dans une ref : un pointermove qui arrive dans
  // le même tick que le pointerdown ne doit pas être perdu en attendant un rendu.
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [locked, setLocked] = useState<LockState>({ price: false, customers: false })
  // L'invite au geste s'éteint dès le premier contact, quel qu'il soit.
  const [touched, setTouched] = useState(false)
  const t = useT()

  const position = paramsToPad(params)
  const animal = animalFor(params.price)

  /** Un axe verrouillé garde sa valeur : on ne déplace que l'autre. */
  const commit = useCallback(
    (next: PadParams) => {
      onChange({
        price: locked.price ? params.price : next.price,
        customers: locked.customers ? params.customers : next.customers,
      })
    },
    [locked, onChange, params.price, params.customers],
  )

  const applyFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current
      if (!pad) return
      const rect = pad.getBoundingClientRect()
      commit(
        padToParams({
          x: (clientX - rect.left) / rect.width,
          y: (clientY - rect.top) / rect.height,
        }),
      )
    },
    [commit],
  )

  function handleKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? STEP * 4 : STEP
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    commit(padToParams({ x: position.x + move[0], y: position.y + move[1] }))
  }

  const bothLocked = locked.price && locked.customers

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-3">
        <Readout
          label="Price"
          value={formatCurrency(params.price)}
          unit="/mo"
          locked={locked.price}
          onToggleLock={() => setLocked((state) => ({ ...state, price: !state.price }))}
        />
        <Readout
          label="Customers"
          value={params.customers.toLocaleString('en-US')}
          locked={locked.customers}
          onToggleLock={() => setLocked((state) => ({ ...state, customers: !state.customers }))}
        />
      </div>

      <div
        ref={padRef}
        role="application"
        tabIndex={0}
        aria-label={`Pricing pad. Horizontal axis: customers, currently ${params.customers}${
          locked.customers ? ', locked' : ''
        }. Vertical axis: monthly price, currently ${formatCurrency(params.price)}${
          locked.price ? ', locked' : ''
        }, in the ${animal.name} tier. Use the arrow keys to adjust.`}
        onKeyDown={(event) => {
          setTouched(true)
          handleKeyDown(event)
        }}
        onPointerDown={(event) => {
          setTouched(true)
          if (bothLocked) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          draggingRef.current = true
          setDragging(true)
          applyFromEvent(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) applyFromEvent(event.clientX, event.clientY)
        }}
        onPointerUp={() => {
          draggingRef.current = false
          setDragging(false)
        }}
        onPointerCancel={() => {
          draggingRef.current = false
          setDragging(false)
        }}
        className={`pad-surface relative aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-xl border border-border/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lume/60 sm:aspect-[16/9] ${
          bothLocked ? 'cursor-not-allowed' : 'cursor-none'
        }`}
      >
        {/* Repères d'axes : les ordres de grandeur, en bordure. */}
        {layers.ticks &&
          CUSTOMER_TICKS.map((tick) => (
          <span
            key={tick.value}
            aria-hidden
            className="pointer-events-none absolute bottom-1 -translate-x-1/2 font-mono text-[9px] text-muted-foreground/40"
            style={{ left: `${tick.x * 100}%` }}
          >
            {tick.label}
            </span>
          ))}
        {layers.ticks &&
          PRICE_TICKS.map((tick) => (
          <span
            key={tick.value}
            aria-hidden
            className="pointer-events-none absolute left-1.5 -translate-y-1/2 font-mono text-[9px] text-muted-foreground/40"
            style={{ top: `${tick.y * 100}%` }}
          >
            {tick.label}
            </span>
          ))}

        {/* Paliers de prix : bandes muettes, seule l'active se teinte. */}
        {layers.bands &&
          ANIMAL_BANDS.map((band) => (
          <div
            key={band.name}
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 border-t border-dashed transition-colors duration-200 ${
              band.name === animal.name
                ? 'border-lume/20 bg-lume/[0.05]'
                : 'border-foreground/[0.06]'
            }`}
              style={{ top: `${band.top * 100}%`, height: `${band.height * 100}%` }}
            />
          ))}

        {/* Courbes d'iso-revenu : de la texture, étiquetée seulement si demandé. */}
        {layers.isoLines && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full text-foreground/15"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {ISO_SEGMENTS.map((segment, index) => (
            <line
              key={index}
              x1={segment.from.x * 100}
              y1={segment.from.y * 100}
              x2={segment.to.x * 100}
              y2={segment.to.y * 100}
              stroke="currentColor"
              strokeWidth={0.35}
              strokeDasharray="1.5 1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        )}

        {layers.isoLabels &&
          ISO_SEGMENTS.map((segment, index) => (
            <span
              key={index}
              aria-hidden
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-background/70 px-1 font-mono text-[9px] text-muted-foreground/60"
              style={{
                left: `${((segment.from.x + segment.to.x) / 2) * 100}%`,
                top: `${((segment.from.y + segment.to.y) / 2) * 100}%`,
              }}
            >
              {ISO_LABELS[index]}
            </span>
          ))}

        {/* Le quadrant de revenu : tout ce qui est sous et à gauche de la
            colombe. Il grandit avec le prix et avec les clients — la lecture
            « plus haut, plus à droite, plus gros » se fait sans un mot. */}
        {layers.quadrant && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 bg-gradient-to-tr from-lume/[0.03] via-lume/[0.09] to-lume/20 transition-[width,height,top] duration-150"
          style={{
            top: `${position.y * 100}%`,
            width: `${position.x * 100}%`,
            height: `${(1 - position.y) * 100}%`,
          }}
        >
          {/* L'essaim : la densité dit le volume de clients. */}
          {layers.swarm &&
            SWARM.slice(0, Math.round(4 + position.x * 80)).map((dot, index) => (
            <span
              key={index}
              className="absolute size-[3px] rounded-full bg-lume/45"
                style={{ left: `${dot.u * 100}%`, top: `${dot.v * 100}%` }}
              />
            ))}
        </div>
        )}

        {/* Croix de visée. Un axe verrouillé devient un rail plein. */}
        {layers.crosshair && (
        <>
        <span
          aria-hidden
          className={`pointer-events-none absolute w-full transition-all ${
            locked.price ? 'h-0.5 bg-lume/70' : 'h-px bg-lume/25'
          }`}
          style={{ top: `${position.y * 100}%` }}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute h-full transition-all ${
            locked.customers ? 'w-0.5 bg-lume/70' : 'w-px bg-lume/25'
          }`}
          style={{ left: `${position.x * 100}%` }}
        />
        </>
        )}

        {/* La colombe dans sa sphère : elle remplace le curseur système. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${
            dragging ? 'scale-[1.12] duration-0' : 'duration-150'
          }`}
          style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
        >
          {!touched && (
            <span className="orb-invite absolute inset-0 rounded-full border border-lume/70" />
          )}
          <span className="dove-orb flex size-11 items-center justify-center rounded-full">
            <DoveLogo className="h-4 w-5 text-lume drop-shadow-[0_0_6px_var(--lume)]" />
          </span>
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {bothLocked
          ? t('Both axes are locked — unlock one to keep exploring.')
          : locked.price
            ? t('Price locked at {price}: drag to see how many customers you need.', {
                price: formatCurrency(params.price),
              })
            : locked.customers
              ? t('Customers locked at {customers}: drag to price them.', {
                  customers: params.customers.toLocaleString('en-US'),
                })
              : t('{tier} tier · ~${acv}/yr per customer. Lock an axis to explore the other.', {
                  tier: t(animal.name),
                  acv: animal.annualAcv.toLocaleString('en-US'),
                })}
      </p>
    </div>
  )
}
