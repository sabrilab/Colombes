import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PricePad } from '@/components/home/PricePad'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { PAD_VARIANTS, type PadVariant } from '@/lib/padVariants'
import { quickInputs } from '@/lib/quickSim'
import { navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

/** Un pad jouable par variante : on compare en manipulant, pas en lisant. */
function VariantCard({ variant }: { variant: PadVariant }) {
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const results = useMemo(() => compute(quickInputs(params)), [params])
  const t = useT()

  const shown = Object.entries(variant.layers)
    .filter(([, on]) => on)
    .map(([layer]) => layer)

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
          {t(variant.name)}
        </h2>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatCurrency(results.valuation.value)}
        </p>
      </div>

      <PricePad params={params} onChange={setParams} layers={variant.layers} />

      <p className="text-xs leading-relaxed text-muted-foreground">{t(variant.rationale)}</p>

      <p className="border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground/60">
        {t('Layers on:')} {shown.join(' · ')} · {t('MRR')}{' '}
        {formatCompactCurrency(results.revenue.mrr)}
      </p>
    </Card>
  )
}

/**
 * Le banc d'essai du pad. Chaque variante est pleinement jouable — verrous
 * compris — pour qu'on tranche sur pièces plutôt qu'en principe.
 */
export function PadLabView() {
  const t = useT()

  return (
    <>
      <AppHeader
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate('#/')}>
            {t('Back to home')}
          </Button>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          {t('Pad variants')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t(
            'Every variant below is fully playable — drag the dove, lock an axis. They differ only in which layers are drawn. Tell me which one reads best and it becomes the one that ships.',
          )}
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {PAD_VARIANTS.map((variant) => (
            <VariantCard key={variant.id} variant={variant} />
          ))}
        </div>
      </main>
    </>
  )
}
