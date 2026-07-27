import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PRICING_ANIMALS, type PricingAnimal } from '@/lib/pricePad'
import { useT } from '@/store/simulator'

const AnimalStage3D = lazy(() => import('./AnimalStage3D'))

/**
 * La ronde est un vrai cercle vu de face : chaque voisin occupe un cran
 * d'angle et s'enfonce donc en profondeur au lieu de filer sur le côté.
 * On en tire son décalage horizontal, sa réduction de perspective, son
 * fondu et son flou.
 */
const ANGLE_STEP = (40 * Math.PI) / 180
/** Rayon du cercle, en pourcentage de la largeur de la scène. */
const RADIUS = 54

/**
 * Effacement des voisins. Dans la carte d'accueil ils ne sont qu'une
 * présence — on devine qu'il y a une ronde, sans que rien ne dispute la
 * bête du centre. La vue « Tiers », elle, est faite pour les comparer.
 */
const NEIGHBOUR_FADE = { compact: 0.9, expanded: 0.5 } as const

export type CarouselVariant = keyof typeof NEIGHBOUR_FADE

function placeOnCircle(offset: number, variant: CarouselVariant) {
  const theta = offset * ANGLE_STEP
  // 0 au premier plan, croissant à mesure qu'on s'éloigne derrière.
  const depth = 1 - Math.cos(theta)

  return {
    x: RADIUS * Math.sin(theta),
    scale: 1 / (1 + depth * 1.9),
    opacity: Math.max(0, 1 - Math.abs(offset) * NEIGHBOUR_FADE[variant]),
    blur: Math.abs(offset) * (variant === 'compact' ? 2.4 : 1.6),
    layer: 10 - Math.abs(offset),
  }
}

interface TierCarouselProps {
  /** Palier de la simulation en cours : le carrousel s'y recentre. */
  current: PricingAnimal
  /** `compact` dans la carte d'accueil, `expanded` dans la vue « Tiers ». */
  variant?: CarouselVariant
}

/**
 * Les cinq paliers en ronde : celui du centre est net et blanc, les autres
 * s'effacent sur les côtés. On fait défiler pour comprendre ce que chaque
 * espèce impose, sans quitter la carte.
 */
export function TierCarousel({ current, variant = 'compact' }: TierCarouselProps) {
  const currentIndex = PRICING_ANIMALS.findIndex((animal) => animal.name === current.name)
  const [index, setIndex] = useState(Math.max(currentIndex, 0))
  const dragStart = useRef<number | null>(null)
  const t = useT()

  // La simulation mène la danse : changer de palier recentre la ronde.
  useEffect(() => {
    if (currentIndex >= 0) setIndex(currentIndex)
  }, [currentIndex])

  const go = (delta: number) =>
    setIndex((value) => Math.min(PRICING_ANIMALS.length - 1, Math.max(0, value + delta)))

  const shown = PRICING_ANIMALS[index]
  const isYours = index === currentIndex

  return (
    <div>
      <div
        className="relative h-40 touch-pan-y select-none overflow-hidden sm:h-44 [mask-image:linear-gradient(to_right,transparent,#000_16%,#000_84%,transparent)]"
        onPointerDown={(event) => {
          dragStart.current = event.clientX
        }}
        onPointerUp={(event) => {
          if (dragStart.current === null) return
          const delta = event.clientX - dragStart.current
          if (Math.abs(delta) > 30) go(delta < 0 ? 1 : -1)
          dragStart.current = null
        }}
        onPointerCancel={() => {
          dragStart.current = null
        }}
      >
        {PRICING_ANIMALS.map((animal, position) => {
          const offset = position - index
          if (Math.abs(offset) > 2) return null

          const place = placeOnCircle(offset, variant)

          return (
            <div
              key={animal.name}
              aria-hidden={offset !== 0}
              // Courbe longue et amortie : la ronde glisse, elle ne saute pas.
              className="pointer-events-none absolute inset-0 transition-all duration-[900ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{
                transform: `translateX(${place.x}%) scale(${place.scale})`,
                opacity: place.opacity,
                zIndex: place.layer,
                filter: offset === 0 ? 'none' : `grayscale(1) blur(${place.blur}px)`,
              }}
            >
              <Suspense fallback={null}>
                <AnimalStage3D animal={animal.name} />
              </Suspense>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label={t('Previous tier')}
          className="absolute left-0 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 sm:size-auto sm:p-1.5"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === PRICING_ANIMALS.length - 1}
          aria-label={t('Next tier')}
          className="absolute right-0 top-1/2 z-20 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 sm:size-auto sm:p-1.5"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div aria-live="polite">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
            {t(shown.name)}
          </p>
          {isYours ? (
            <span className="rounded-full border border-lume/40 px-1.5 text-[10px] uppercase tracking-wider text-lume">
              {t('your tier')}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {t('${acv}/yr per customer', { acv: shown.annualAcv.toLocaleString('en-US') })}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {t(shown.whatItMeans)}
        </p>
      </div>

      <div className="mt-2 flex gap-1" role="tablist" aria-label={t('Pricing tiers')}>
        {PRICING_ANIMALS.map((animal, position) => (
          <button
            key={animal.name}
            type="button"
            role="tab"
            aria-selected={position === index}
            aria-label={t(animal.name)}
            onClick={() => setIndex(position)}
            /* Le trait reste fin — c'est un repère, pas un bouton — mais sa
               zone sensible fait 28 px : 4 px ne se visent avec rien. */
            className="group/tab flex-1 py-3 sm:py-2"
          >
            <span
              aria-hidden
              className={`block h-1 rounded-full transition-colors ${
                position === index
                  ? 'bg-lume'
                  : 'bg-foreground/15 group-hover/tab:bg-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
