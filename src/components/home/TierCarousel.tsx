import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'
import { landmarksForTier } from '@/lib/landmarks'
import { PRICING_ANIMALS, reachableOnPad, type PricingAnimal } from '@/lib/pricePad'
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

/**
 * Flèches de la ronde : 44 px au doigt, discrètes au pointeur. La classe
 * d'affichage est laissée à l'appelant — deux cibles de 44 px dans la colonne
 * de 120 px de la carte d'accueil recouvriraient l'animal, or les onglets et
 * le balayage suffisent à parcourir la ronde.
 */
const ARROW =
  'top-1/2 z-20 size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25 sm:size-auto sm:p-1.5'

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
  const compact = variant === 'compact'

  return (
    <div>
      <div
        /* En carte d'accueil sur mobile, la ronde tient dans une colonne
           étroite à côté du chiffre : elle se réduit d'autant, et retrouve sa
           taille quand la hauteur cesse d'être comptée. */
        className={`relative touch-pan-y select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_16%,#000_84%,transparent)] ${
          compact ? 'h-20 sm:h-28 lg:h-44' : 'h-40 sm:h-44'
        }`}
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
          className={`absolute left-0 ${ARROW} ${compact ? 'hidden lg:inline-flex' : 'inline-flex'}`}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === PRICING_ANIMALS.length - 1}
          aria-label={t('Next tier')}
          className={`absolute right-0 ${ARROW} ${compact ? 'hidden lg:inline-flex' : 'inline-flex'}`}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Dans la colonne étroite de la carte d'accueil, seul le nom du palier
          tient : le qualificatif et la description reviennent dès qu'il y a de
          la largeur pour les lire. */}
      <div aria-live="polite">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
            {t(shown.name)}
          </p>
          {/* Les baleines sont hors du cadran : le dire ici évite qu'on
              cherche en vain à les atteindre en poussant le prix. */}
          {!reachableOnPad(shown) ? (
            <span className="rounded-full border border-border px-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('beyond this simulator')}
            </span>
          ) : (
            <span className={compact ? 'hidden sm:inline' : undefined}>
              {isYours ? (
                <span className="rounded-full border border-lume/40 px-1.5 text-[10px] uppercase tracking-wider text-lume">
                  {t('your tier')}
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  {t('${acv}/yr per customer', { acv: shown.annualAcv.toLocaleString('en-US') })}
                </span>
              )}
            </span>
          )}
        </div>
        {/* Les marques qui incarnent le palier. « Lapin » ne dit rien ; « le
            palier de Netflix » se comprend sans une phrase — c'est le
            raccourci le plus court vers ce que l'échelle mesure. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {landmarksForTier(shown).map((company) => (
            <span key={company.id} className="flex items-center gap-1.5">
              <CompanyLogo company={company} className="size-5 shrink-0" />
              <span
                className={`text-[11px] text-muted-foreground ${
                  compact ? 'hidden sm:inline' : ''
                }`}
              >
                {company.name}
              </span>
            </span>
          ))}
        </div>

        <p
          className={`mt-1 text-[11px] leading-relaxed text-muted-foreground ${
            compact ? 'hidden lg:block' : ''
          }`}
        >
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
