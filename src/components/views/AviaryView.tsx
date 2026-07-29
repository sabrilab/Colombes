import { useMemo } from 'react'
import { TierBadge } from '@/components/AnimalGlyph'
import { BrandMark } from '@/components/BrandMark'
import { Card } from '@/components/ui/card'
import { Landmarks } from '@/components/home/Landmarks'
import { AVIARY, type Colombe } from '@/lib/aviary'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatMultiple } from '@/lib/format'
import { animalFor } from '@/lib/pricePad'
import { navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

function ColombeCard({ colombe, order }: { colombe: Colombe; order: number }) {
  const results = useMemo(() => compute(colombe.inputs), [colombe])
  const t = useT()

  return (
    <button
      type="button"
      onClick={() => navigate(`#/colombe/${colombe.id}`)}
      className="reveal group text-left"
      style={{ '--reveal-order': order } as React.CSSProperties}
      aria-label={t('View {name}’s profile', { name: colombe.name })}
    >
      <Card className="h-full gap-0 overflow-hidden p-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-foreground/25 group-focus-visible:border-foreground/40">
        {/* Bandeau d'identité : la marque et son secteur, rien d'autre. */}
        <div className="card-band flex items-center gap-3 border-b border-border/50 p-4">
          <BrandMark
            id={colombe.id}
            className="size-10 shrink-0 rounded-full ring-1 ring-foreground/10"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight">{colombe.name}</p>
            <p className="truncate text-xs text-muted-foreground">{t(colombe.sector)}</p>
          </div>
        </div>

        {/* Socle : un seul chiffre qui compte, et son multiple. */}
        <div className="flex items-end justify-between gap-3 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('Valuation')}
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatCompactCurrency(results.valuation.value)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="font-mono text-sm text-muted-foreground tabular-nums">
              {formatMultiple(results.valuation.multiple)}
            </p>
            <TierBadge animal={animalFor(results.revenue.arpu).name} />
          </div>
        </div>
      </Card>
    </button>
  )
}

/**
 * La volière : des apps fictives mais crédibles, et les géants réels sur la
 * même échelle. Les deux répondent à la même question — « je me situe où ? » —
 * d'où leur réunion sous un seul onglet.
 */
export function AviaryView() {
  const t = useT()

  return (
    <>
      <header className="max-w-2xl">
        <h1
          className="font-display reveal text-2xl font-bold uppercase tracking-tight sm:text-3xl"
          style={{ '--reveal-order': 0 } as React.CSSProperties}
        >
          {t('The aviary')}
        </h1>
        <p
          className="reveal mt-3 text-sm leading-relaxed text-muted-foreground"
          style={{ '--reveal-order': 1 } as React.CSSProperties}
        >
          {t(
            'Six invented apps, each one an archetype you will recognise, and six real companies placed on the same scale. Open any of them to see what makes its multiple — then load it into the simulator and change your mind about something.',
          )}
        </p>
      </header>

      <section className="mt-8" aria-label={t('The aviary')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVIARY.map((colombe, index) => (
            <ColombeCard key={colombe.id} colombe={colombe} order={2 + index} />
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          {t(
            'Fictional companies, plausible numbers: every profile is calibrated on the simulator’s market benchmarks (Acquire.com, FE International, ChartMogul).',
          )}
        </p>
      </section>

      <Landmarks />
    </>
  )
}
