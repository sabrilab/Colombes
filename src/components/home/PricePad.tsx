import { useCallback, useRef, useState } from 'react'
import { DoveLogo } from '@/components/DoveLogo'
import { AVIARY } from '@/lib/aviary'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { PAD_BOUNDS, padToParams, paramsToPad, type PadParams } from '@/lib/pricePad'

/** Repères de la volière, projetés sur le pad. Calculé une fois : la volière
    est statique, et son ARPU vient du moteur pour rester cohérent. */
const AVIARY_MARKERS = AVIARY.map((colombe) => {
  const { revenue } = compute(colombe.inputs)
  return {
    id: colombe.id,
    name: colombe.name,
    hue: colombe.hue,
    ...paramsToPad({ price: revenue.arpu, customers: colombe.inputs.customers }),
  }
})

/** Pas clavier : 2,5 % du pad par flèche, 10 % avec Maj. */
const STEP = 0.025

interface PricePadProps {
  params: PadParams
  onChange: (params: PadParams) => void
}

export function PricePad({ params, onChange }: PricePadProps) {
  const padRef = useRef<HTMLDivElement>(null)
  // Le garde du glissement vit dans une ref : un pointermove qui arrive dans
  // le même tick que le pointerdown ne doit pas être perdu en attendant un rendu.
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)
  const position = paramsToPad(params)

  const applyFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current
      if (!pad) return
      const rect = pad.getBoundingClientRect()
      onChange(
        padToParams({
          x: (clientX - rect.left) / rect.width,
          y: (clientY - rect.top) / rect.height,
        }),
      )
    },
    [onChange],
  )

  const nudge = (dx: number, dy: number) => {
    onChange(padToParams({ x: position.x + dx, y: position.y + dy }))
  }

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
    nudge(move[0], move[1])
  }

  return (
    <div className="space-y-2">
      <div
        ref={padRef}
        role="application"
        tabIndex={0}
        aria-label={`Pricing pad. Horizontal axis: customers, currently ${params.customers}. Vertical axis: monthly price, currently ${formatCurrency(params.price)}. Use the arrow keys to adjust.`}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
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
        className="pad-surface relative aspect-[4/3] w-full cursor-crosshair touch-none select-none overflow-hidden rounded-xl border border-border/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lume/60 sm:aspect-[16/9]"
      >
        {/* Repères de la volière : on voit où se placent les autres. */}
        {AVIARY_MARKERS.map((marker) => (
          <span
            key={marker.id}
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
          >
            <span
              className="block size-1.5 rounded-full"
              style={{ background: `oklch(0.82 0.09 ${marker.hue} / 0.55)` }}
            />
            {/* Au-delà des trois quarts du pad, l'étiquette passe à gauche
                du point pour ne pas être coupée par le bord. */}
            <span
              className={`absolute top-[-0.35rem] whitespace-nowrap text-[10px] text-muted-foreground/50 ${
                marker.x > 0.75 ? 'right-3' : 'left-3'
              }`}
            >
              {marker.name}
            </span>
          </span>
        ))}

        {/* Croix de visée : relie la colombe aux deux axes. */}
        <span
          aria-hidden
          className="pointer-events-none absolute h-px w-full bg-lume/20"
          style={{ top: `${position.y * 100}%` }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute h-full w-px bg-lume/20"
          style={{ left: `${position.x * 100}%` }}
        />

        {/* La colombe posée : le curseur du pad. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${
            dragging ? 'scale-110 duration-0' : 'duration-150'
          }`}
          style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
        >
          <span className="absolute -inset-5 rounded-full bg-lume/15 blur-lg" />
          <DoveLogo className="relative h-4 w-5 text-lume drop-shadow-[0_0_8px_var(--lume)]" />
        </span>

        {/* Légende des axes, discrète, dans les coins. */}
        <span className="pointer-events-none absolute bottom-2 left-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/45">
          {PAD_BOUNDS.customers.min} customer →{' '}
          {PAD_BOUNDS.customers.max.toLocaleString('en-US')}
        </span>
        <span className="pointer-events-none absolute left-3 top-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/45">
          ↑ {formatCompactCurrency(PAD_BOUNDS.price.max)}/mo
        </span>
      </div>

      <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
        <span>
          <span className="text-muted-foreground">Price </span>
          <span className="font-mono font-semibold tabular-nums">
            {formatCurrency(params.price)}
          </span>
          <span className="text-xs text-muted-foreground">/mo</span>
        </span>
        <span>
          <span className="text-muted-foreground">Customers </span>
          <span className="font-mono font-semibold tabular-nums">
            {params.customers.toLocaleString('en-US')}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">Drag the dove, or use arrow keys</span>
      </p>
    </div>
  )
}
