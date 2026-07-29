import { useState } from 'react'
import { CompanyLogo } from '@/components/CompanyLogo'
import { DoveLogo } from '@/components/DoveLogo'
import { Slider } from '@/components/ui/slider'
import { LANDMARKS, landmarkAcv } from '@/lib/landmarks'
import { animalFor, PRICING_ANIMALS } from '@/lib/pricePad'
import { formatCurrency } from '@/lib/format'
import { useT } from '@/store/simulator'

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

/** Prix mensuel d'une position verticale — la réciproque, pour le curseur. */
function priceAt(fraction: number): number {
  return Math.round(SCALE.min * (SCALE.max / SCALE.min) ** Math.min(1, Math.max(0, fraction)))
}

export function LadderScene() {
  const [price, setPrice] = useState(29)
  const t = useT()

  const yours = animalFor(price)

  return (
    <div className="space-y-4">
      <div className="grain-stage relative h-[24rem] w-full overflow-hidden rounded-xl border border-border/70">
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
                isYours ? 'border-lume/30 bg-lume/[0.06]' : 'border-foreground/[0.07]'
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

        {/* Les repères se posent sur leur barreau, en cascade à l'entrée. */}
        {LANDMARKS.map((company, index) => (
          <div
            key={company.id}
            className="reveal absolute right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 py-1 pl-1 pr-2.5 backdrop-blur"
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

        {/* Vous. */}
        <div
          className="absolute left-0 z-10 flex -translate-y-1/2 items-center gap-2 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ top: `${yOf(price) * 100}%` }}
        >
          <span className="dove-orb flex size-9 items-center justify-center rounded-full">
            <DoveLogo className="h-3.5 w-4 text-lume" />
          </span>
          <span className="h-px w-8 bg-lume/40" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm">{t('Your price per customer')}</span>
          <span className="font-mono text-sm tabular-nums text-lume">
            {formatCurrency(price)}
            <span className="text-muted-foreground">{t('/mo')}</span>
          </span>
        </div>
        <Slider
          value={[1 - yOf(price)]}
          min={0}
          max={1}
          step={0.005}
          onValueChange={([fraction]) => setPrice(priceAt(fraction))}
          thumbLabel={t('Your price per customer')}
          thumbValueText={formatCurrency(price)}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground" aria-live="polite">
          {t(yours.whatItMeans)}
        </p>
      </div>
    </div>
  )
}
