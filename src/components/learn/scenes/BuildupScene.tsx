import { useMemo, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import { compute } from '@/lib/engine'
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/format'
import { useT } from '@/store/simulator'

/**
 * Les neuf lignes de valuation.ts, rendues visibles. Le multiple n'est pas
 * donné : il part du barème de marché, puis chaque ligne de qualité le pousse.
 * On lit ici exactement le calcul de production — aucune ligne n'est inventée
 * pour la démonstration, aucune n'est cachée parce qu'elle dérange.
 */
/**
 * Deux situations opposées : c'est en basculant de l'une à l'autre qu'on voit
 * les neuf lignes changer de camp, bien mieux qu'en poussant un curseur.
 */
const PRESETS = [
  { label: 'Solid asset', revenueChurn: 0.012, topClientShare: 0.05 },
  { label: 'Leaky asset', revenueChurn: 0.075, topClientShare: 0.45 },
]

export function BuildupScene() {
  const [levers, setLevers] = useState({ revenueChurn: 0.03, topClientShare: 0.1 })
  const t = useT()

  const results = useMemo(
    () =>
      compute({
        ...DEFAULT_INPUTS,
        tiers: [{ name: 'Subscription', price: 29, mix: 1 }],
        customers: 500,
        newCustomersPerMonth: 25,
        ...levers,
      }),
    [levers],
  )

  const { valuation } = results
  const lines = valuation.lines.filter((line) => Math.abs(line.deltaMultiple) > 0.001)
  // L'échelle des barres : la plus grosse ligne occupe toute la largeur.
  const widest = Math.max(0.1, ...lines.map((line) => Math.abs(line.deltaMultiple)))

  return (
    <div className="space-y-4">
      <div className="grain-stage space-y-3 rounded-xl border border-border/70 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t('Base multiple')}
          </span>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {formatMultiple(valuation.baseMultiple)}
          </span>
        </div>

        {/* Chaque ligne pousse ou retire, et s'assemble à l'entrée. */}
        <div className="space-y-1.5">
          {lines.map((line, index) => {
            const positive = line.deltaMultiple > 0
            const width = (Math.abs(line.deltaMultiple) / widest) * 50

            return (
              <div
                key={line.key}
                className="reveal grid grid-cols-[1fr_auto] items-center gap-2"
                style={{ '--reveal-order': index + 1 } as React.CSSProperties}
              >
                <div className="flex items-center">
                  {/* Deux demi-pistes autour d'un axe central : à gauche ce qui
                      retire, à droite ce qui ajoute. La longueur dit le poids. */}
                  <div className="flex w-1/2 justify-end">
                    {!positive && (
                      <span
                        className="h-2.5 rounded-l-full bg-red-500/60 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        style={{ width: `${width * 2}%` }}
                      />
                    )}
                  </div>
                  <span className="h-4 w-px shrink-0 bg-border" />
                  <div className="flex w-1/2 justify-start">
                    {positive && (
                      <span
                        className="h-2.5 rounded-r-full bg-lume/70 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        style={{ width: `${width * 2}%` }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex w-28 items-baseline justify-between gap-2 sm:w-36">
                  <span className="truncate text-[11px] text-muted-foreground">{t(line.label)}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      positive ? 'text-lume' : 'text-red-500'
                    }`}
                  >
                    {formatMultiple(line.deltaMultiple, true)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.16em]">
            {t('Adjusted multiple')}
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums" aria-live="polite">
            {formatMultiple(valuation.multiple)}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t('Estimated valuation')}
          </span>
          <span className="metal-number font-mono text-xl font-semibold tabular-nums">
            {formatCurrency(valuation.value)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const active =
            levers.revenueChurn === preset.revenueChurn &&
            levers.topClientShare === preset.topClientShare

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                setLevers({
                  revenueChurn: preset.revenueChurn,
                  topClientShare: preset.topClientShare,
                })
              }
              aria-pressed={active}
              className={`min-h-9 flex-1 rounded-lg border px-2 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors ${
                active
                  ? 'border-lume/50 bg-lume/10 text-lume'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(preset.label)}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm">{t('Revenue churn / mo')}</span>
            <span className="font-mono text-sm tabular-nums">
              {formatPercent(levers.revenueChurn)}
            </span>
          </div>
          <Slider
            value={[levers.revenueChurn]}
            min={0}
            max={0.15}
            step={0.001}
            onValueChange={([revenueChurn]) => setLevers((state) => ({ ...state, revenueChurn }))}
            thumbLabel={t('Revenue churn / mo')}
            thumbValueText={formatPercent(levers.revenueChurn)}
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm">{t('Top client share')}</span>
            <span className="font-mono text-sm tabular-nums">
              {formatPercent(levers.topClientShare, 0)}
            </span>
          </div>
          <Slider
            value={[levers.topClientShare]}
            min={0}
            max={0.6}
            step={0.01}
            onValueChange={([topClientShare]) =>
              setLevers((state) => ({ ...state, topClientShare }))
            }
            thumbLabel={t('Top client share')}
            thumbValueText={formatPercent(levers.topClientShare, 0)}
          />
        </div>
      </div>
    </div>
  )
}
