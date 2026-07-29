import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { DoveLogo } from '@/components/DoveLogo'
import { formatCurrency } from '@/lib/format'
import { useT } from '@/store/simulator'

const MAX = { price: 100, customers: 1_000 }

/**
 * Le revenu **est** une surface : le prix en hauteur, les clients en largeur.
 * Doubler l'un ou l'autre double l'aire, et c'est tout l'enseignement — on le
 * voit au lieu de le lire. Le fantôme de la position précédente reste en
 * pointillés : sans mémoire du geste, on ne compare rien.
 */
export function LeversScene() {
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const [ghost, setGhost] = useState<typeof params | null>(null)
  const t = useT()

  const mrr = params.price * params.customers
  const width = (params.customers / MAX.customers) * 100
  const height = (params.price / MAX.price) * 100

  /** Doubler un levier, en gardant l'état précédent en fantôme. */
  const double = (axis: 'price' | 'customers') => {
    setGhost(params)
    setParams((current) => ({
      ...current,
      [axis]: Math.min(MAX[axis], Math.round(current[axis] * 2)),
    }))
  }

  /**
   * Le curseur efface le fantôme au lieu de le traîner : un repère qui suit
   * d'un cran pendant qu'on glisse ne compare rien, il clignote. Le fantôme
   * n'a de sens que face au geste franc du doublement.
   */
  const set = (axis: 'price' | 'customers', value: number) => {
    setGhost(null)
    setParams((current) => ({ ...current, [axis]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="grain-stage relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border/70 sm:aspect-[2/1]">
        {/* Le fantôme : d'où l'on vient, pour que la comparaison existe. */}
        {ghost && (
          <div
            aria-hidden
            className="absolute bottom-0 left-0 border border-dashed border-foreground/25"
            style={{
              width: `${(ghost.customers / MAX.customers) * 100}%`,
              height: `${(ghost.price / MAX.price) * 100}%`,
            }}
          />
        )}

        {/* L'aire : c'est elle, le revenu. */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 bg-gradient-to-tr from-lume/[0.06] via-lume/15 to-lume/30 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ width: `${width}%`, height: `${height}%` }}
        >
          <span className="absolute -right-px -top-px h-full w-px bg-lume/60" />
          <span className="absolute -top-px left-0 h-px w-full bg-lume/60" />
          <span className="dove-orb absolute -right-4 -top-4 flex size-8 items-center justify-center rounded-full">
            <DoveLogo className="h-3 w-4 text-lume" />
          </span>
        </div>

        <span className="absolute bottom-1.5 right-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          {t('Customers')} →
        </span>
        <span className="absolute left-2 top-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          ↑ {t('Price')}
        </span>
      </div>

      <p className="text-center font-mono text-2xl font-semibold tabular-nums" aria-live="polite">
        {formatCurrency(mrr)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">{t('/mo')}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm">{t('Price')}</span>
            <span className="font-mono text-sm tabular-nums">{formatCurrency(params.price)}</span>
          </div>
          <Slider
            value={[params.price]}
            min={1}
            max={MAX.price}
            step={1}
            onValueChange={([value]) => set('price', value)}
            thumbLabel={t('Price')}
            thumbValueText={formatCurrency(params.price)}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-1 h-9 w-full"
            onClick={() => double('price')}
          >
            {t('Double the price')}
          </Button>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm">{t('Customers')}</span>
            <span className="font-mono text-sm tabular-nums">
              {params.customers.toLocaleString('en-US')}
            </span>
          </div>
          <Slider
            value={[params.customers]}
            min={10}
            max={MAX.customers}
            step={10}
            onValueChange={([value]) => set('customers', value)}
            thumbLabel={t('Customers')}
            thumbValueText={String(params.customers)}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-1 h-9 w-full"
            onClick={() => double('customers')}
          >
            {t('Double the customers')}
          </Button>
        </div>
      </div>
    </div>
  )
}
