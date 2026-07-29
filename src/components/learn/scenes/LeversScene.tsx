import { useCallback, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DoveLogo } from '@/components/DoveLogo'
import { formatCurrency } from '@/lib/format'
import { useT } from '@/store/simulator'

const MAX = { price: 100, customers: 1_000 }
const MIN = { price: 1, customers: 10 }

/**
 * Le revenu **est** une surface : le prix en hauteur, les clients en largeur.
 * Doubler l'un ou l'autre double l'aire, et c'est tout l'enseignement — on le
 * voit au lieu de le lire.
 *
 * On attrape le coin plutôt qu'un curseur : le geste dit lui-même que les deux
 * dimensions sont les deux côtés d'une même chose. Les compteurs restent, sans
 * quoi la scène serait fermée à qui ne peut pas glisser.
 */
export function LeversScene() {
  const stageRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const [ghost, setGhost] = useState<typeof params | null>(null)
  const [touched, setTouched] = useState(false)
  const t = useT()

  const mrr = params.price * params.customers
  const width = (params.customers / MAX.customers) * 100
  const height = (params.price / MAX.price) * 100

  const clamp = (axis: 'price' | 'customers', value: number) =>
    Math.round(Math.min(MAX[axis], Math.max(MIN[axis], value)))

  const applyFromEvent = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()

    setGhost(null)
    setParams({
      customers: Math.round(
        Math.min(
          MAX.customers,
          Math.max(MIN.customers, ((clientX - rect.left) / rect.width) * MAX.customers),
        ),
      ),
      price: Math.round(
        Math.min(
          MAX.price,
          Math.max(MIN.price, ((rect.bottom - clientY) / rect.height) * MAX.price),
        ),
      ),
    })
  }, [])

  /** Le geste franc : c'est lui que le fantôme sert à comparer. */
  const double = (axis: 'price' | 'customers') => {
    setTouched(true)
    setGhost(params)
    setParams((current) => ({ ...current, [axis]: clamp(axis, current[axis] * 2) }))
  }

  const step = (axis: 'price' | 'customers', direction: 1 | -1) => {
    setTouched(true)
    setGhost(null)
    setParams((current) => ({
      ...current,
      [axis]: clamp(axis, current[axis] + direction * Math.max(1, current[axis] * 0.1)),
    }))
  }

  return (
    <div className="space-y-4">
      <div
        ref={stageRef}
        className="grain-stage relative aspect-[3/2] w-full touch-pan-y overflow-hidden rounded-xl border border-border/70 sm:aspect-[2/1]"
        onPointerDown={(event) => {
          setTouched(true)
          event.currentTarget.setPointerCapture?.(event.pointerId)
          draggingRef.current = true
          applyFromEvent(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) applyFromEvent(event.clientX, event.clientY)
        }}
        onPointerUp={() => {
          draggingRef.current = false
        }}
        onPointerCancel={() => {
          draggingRef.current = false
        }}
      >
        {ghost && (
          <div
            aria-hidden
            className="absolute bottom-0 left-0 border border-dashed border-foreground/30"
            style={{
              width: `${(ghost.customers / MAX.customers) * 100}%`,
              height: `${(ghost.price / MAX.price) * 100}%`,
            }}
          />
        )}

        {/* L'aire : c'est elle, le revenu. */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 bg-gradient-to-tr from-haze/10 via-lume/15 to-lume/35 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ width: `${width}%`, height: `${height}%` }}
        >
          <span className="absolute -right-px top-0 h-full w-px bg-lume/60" />
          <span className="absolute -top-px left-0 h-px w-full bg-lume/60" />
        </div>

        {/* La poignée, au coin : les deux côtés d'un coup. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 translate-y-1/2 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ left: `${width}%`, bottom: `${height}%` }}
        >
          {!touched && (
            <span className="orb-invite absolute inset-0 rounded-full border border-lume/70" />
          )}
          <span className="dove-orb pointer-events-auto flex size-11 touch-none items-center justify-center rounded-full">
            <DoveLogo className="h-4 w-5 text-lume drop-shadow-[0_0_6px_var(--lume)]" />
          </span>
        </div>

        <span className="pointer-events-none absolute bottom-1.5 right-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          {t('Customers')} →
        </span>
        <span className="pointer-events-none absolute left-2 top-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          ↑ {t('Price')}
        </span>
      </div>

      <p className="text-center" aria-live="polite">
        <span className="metal-number font-mono text-3xl font-semibold tabular-nums">
          {formatCurrency(mrr)}
        </span>
        <span className="ml-1 text-xs text-muted-foreground">{t('/mo')}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Lever
          label={t('Price')}
          value={formatCurrency(params.price)}
          onStep={(direction) => step('price', direction)}
          onDouble={() => double('price')}
          doubleLabel={t('Double the price')}
        />
        <Lever
          label={t('Customers')}
          value={params.customers.toLocaleString('en-US')}
          onStep={(direction) => step('customers', direction)}
          onDouble={() => double('customers')}
          doubleLabel={t('Double the customers')}
        />
      </div>
    </div>
  )
}

function Lever({
  label,
  value,
  onStep,
  onDouble,
  doubleLabel,
}: {
  label: string
  value: string
  onStep: (direction: 1 | -1) => void
  onDouble: () => void
  doubleLabel: string
}) {
  const t = useT()
  const control =
    'inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-9'

  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label={t('Decrease {label}', { label })}
          className={control}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label={t('Increase {label}', { label })}
          className={control}
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <Button variant="outline" size="sm" className="h-11 flex-1 text-xs sm:h-9" onClick={onDouble}>
          {doubleLabel}
        </Button>
      </div>
    </div>
  )
}
