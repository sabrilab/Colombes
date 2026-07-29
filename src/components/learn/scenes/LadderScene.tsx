import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { CompanyLogo } from '@/components/CompanyLogo'
import { DoveLogo } from '@/components/DoveLogo'
import { LANDMARKS, landmarkAcv } from '@/lib/landmarks'
import { animalFor, PRICING_ANIMALS, type PricingAnimal } from '@/lib/pricePad'
import { formatCurrency } from '@/lib/format'
import { useT } from '@/store/simulator'

const AnimalStage3D = lazy(() => import('@/components/home/AnimalStage3D'))

/**
 * L'échelle va plus haut que le pad, volontairement : elle doit contenir les
 * baleines, que le simulateur ne peut pas atteindre. C'est justement le palier
 * qu'il faut rendre tangible, et une marque connue y suffit.
 */
const SCALE = { min: 1, max: 30_000 }

/** Position verticale d'un prix mensuel, 0 en haut. Échelle logarithmique. */
function yOf(price: number): number {
  const clamped = Math.min(SCALE.max, Math.max(SCALE.min, price))
  return 1 - Math.log(clamped / SCALE.min) / Math.log(SCALE.max / SCALE.min)
}

/** Prix mensuel d'une position verticale — la réciproque, pour le geste. */
function priceAt(fraction: number): number {
  return Math.round(SCALE.min * (SCALE.max / SCALE.min) ** Math.min(1, Math.max(0, fraction)))
}

/** Le milieu géométrique d'un palier : où se poser quand on le désigne. */
function middleOf(animal: PricingAnimal): number {
  const top = Math.min(animal.maxPrice, SCALE.max)
  return Math.round(Math.sqrt(animal.minPrice * top))
}

export function LadderScene() {
  const stageRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [price, setPrice] = useState(29)
  const [touched, setTouched] = useState(false)
  const t = useT()

  const yours = animalFor(price)

  const applyFromEvent = useCallback((clientY: number) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    setPrice(priceAt(1 - (clientY - rect.top) / rect.height))
  }, [])

  return (
    <div className="space-y-4">
      <div
        ref={stageRef}
        className="grain-stage relative h-[26rem] w-full touch-pan-y overflow-hidden rounded-xl border border-border/70"
        onPointerDown={(event) => {
          setTouched(true)
          event.currentTarget.setPointerCapture?.(event.pointerId)
          draggingRef.current = true
          applyFromEvent(event.clientY)
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) applyFromEvent(event.clientY)
        }}
        onPointerUp={() => {
          draggingRef.current = false
        }}
        onPointerCancel={() => {
          draggingRef.current = false
        }}
      >
        {/* Les barreaux : un par palier, à leur hauteur réelle sur l'échelle. */}
        {PRICING_ANIMALS.map((animal) => {
          const top = yOf(Math.min(animal.maxPrice, SCALE.max))
          const bottom = yOf(animal.minPrice)
          const isYours = animal.name === yours.name

          return (
            <div
              key={animal.name}
              aria-hidden
              className={`absolute inset-x-0 border-t border-dashed transition-colors duration-200 ${
                isYours ? 'border-lume/30 bg-lume/[0.07]' : 'border-foreground/[0.07]'
              }`}
              style={{ top: `${top * 100}%`, height: `${(bottom - top) * 100}%` }}
            >
              <span
                className={`absolute left-2 top-1 font-display text-[10px] uppercase tracking-[0.16em] ${
                  isYours ? 'text-lume' : 'text-muted-foreground/40'
                }`}
              >
                {t(animal.name)}
              </span>
            </div>
          )
        })}

        {/* Le rappel 3D : l'animal du palier atteint, en grand et effacé, qui
            change quand on grimpe. Une présence, pas une illustration. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-2 left-1/2 h-32 w-40 -translate-x-1/2 opacity-30 sm:h-40 sm:w-52"
        >
          <Suspense fallback={null}>
            <AnimalStage3D animal={yours.name} />
          </Suspense>
        </div>

        {/* Les repères se posent sur leur barreau, en cascade à l'entrée. */}
        {LANDMARKS.map((company, index) => (
          <div
            key={company.id}
            className="reveal pointer-events-none absolute right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-border/60 bg-background/85 py-1 pl-1 pr-2.5 backdrop-blur"
            style={
              {
                top: `${yOf(landmarkAcv(company) / 12) * 100}%`,
                '--reveal-order': index + 1,
              } as React.CSSProperties
            }
          >
            <CompanyLogo company={company} className="size-6 shrink-0" />
            <span className="text-[11px] font-medium leading-none">{company.name}</span>
            <span className="font-mono text-[10px] leading-none text-muted-foreground tabular-nums">
              {formatCurrency(Math.round(landmarkAcv(company) / 12))}
            </span>
          </div>
        ))}

        {/* Vous : la poignée qu'on fait grimper. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-3 z-10 -translate-y-1/2 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ top: `${yOf(price) * 100}%` }}
        >
          {!touched && (
            <span className="orb-invite absolute inset-0 rounded-full border border-lume/70" />
          )}
          <span className="dove-orb pointer-events-auto flex size-11 touch-none items-center justify-center rounded-full">
            <DoveLogo className="h-4 w-5 text-lume drop-shadow-[0_0_6px_var(--lume)]" />
          </span>
        </div>
      </div>

      {/* Désigner un palier plutôt que viser : l'échelle reste accessible sans
          le moindre glissement. */}
      <div className="flex flex-wrap gap-1.5">
        {PRICING_ANIMALS.map((animal) => {
          const isYours = animal.name === yours.name

          return (
            <button
              key={animal.name}
              type="button"
              onClick={() => {
                setTouched(true)
                setPrice(middleOf(animal))
              }}
              aria-pressed={isYours}
              className={`min-h-9 flex-1 rounded-lg border px-2 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors ${
                isYours
                  ? 'border-lume/50 bg-lume/10 text-lume'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(animal.name)}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-border/60 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t('Your price per customer')}
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-lume">
            {formatCurrency(price)}
            <span className="text-xs font-normal text-muted-foreground">{t('/mo')}</span>
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground" aria-live="polite">
          {t(yours.whatItMeans)}
        </p>
      </div>
    </div>
  )
}
