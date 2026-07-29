import { useMemo, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import { compute } from '@/lib/engine'
import { formatCurrency, formatPercent } from '@/lib/format'
import { useT } from '@/store/simulator'

/**
 * La cascade tourne sur le moteur de production, pas sur une arithmétique
 * d'illustration : un exemple pédagogique irreproductible dans le simulateur
 * serait un mensonge pédagogique.
 *
 * Le prix et le nombre de clients sont figés — le grain précédent les traite.
 * Ici on ne manipule que ce qui prélève.
 */
const FIXED = { price: 29, customers: 500, newCustomersPerMonth: 25 }

/**
 * Trois profils plutôt que trois curseurs à tâtonner : on comprend plus vite
 * en comparant des situations nommées qu'en balayant un intervalle. Les
 * curseurs restent dessous pour qui veut sortir des cases.
 */
const PRESETS = [
  { label: 'Solo founder', grossMargin: 0.88, cac: 90, fixedCosts: 1_200 },
  { label: 'Funded machine', grossMargin: 0.78, cac: 900, fixedCosts: 9_000 },
  { label: 'Agency turned SaaS', grossMargin: 0.55, cac: 250, fixedCosts: 6_000 },
]

export function CascadeScene() {
  const [levers, setLevers] = useState({ grossMargin: 0.85, cac: 180, fixedCosts: 2_000 })
  const t = useT()

  const results = useMemo(
    () =>
      compute({
        ...DEFAULT_INPUTS,
        tiers: [{ name: 'Subscription', price: FIXED.price, mix: 1 }],
        customers: FIXED.customers,
        newCustomersPerMonth: FIXED.newCustomersPerMonth,
        ...levers,
      }),
    [levers],
  )

  const { mrr, variableCost, acquisitionCost, sdeMonthly } = results.revenue
  const share = (amount: number) => (mrr > 0 ? Math.min(1, Math.abs(amount) / mrr) * 100 : 0)

  const takes = [
    { key: 'Direct costs', amount: variableCost, tone: 'bg-foreground/[0.14]' },
    { key: 'Acquisition', amount: acquisitionCost, tone: 'bg-foreground/[0.10]' },
    { key: 'Fixed costs', amount: levers.fixedCosts, tone: 'bg-foreground/[0.06]' },
  ]

  const losing = sdeMonthly < 0

  return (
    <div className="space-y-4">
      <div className="grain-stage grid grid-cols-[1fr_auto] gap-4 rounded-xl border border-border/70 p-4">
        {/* La colonne qui se fait pincer à chaque étage. */}
        <div className="flex h-64 flex-col overflow-hidden rounded-lg border border-border/50">
          <div className="flex items-center justify-between border-b border-border/40 px-2.5 py-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">MRR</span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formatCurrency(mrr)}
            </span>
          </div>

          {/* Les prélèvements se partagent la hauteur au prorata du MRR. Ils
              peuvent le dépasser — c'est le cas intéressant — alors ils se
              compriment plutôt que de chasser le bassin hors du cadre. */}
          {takes.map((take) => (
            <div
              key={take.key}
              className={`flex min-h-0 items-center justify-between overflow-hidden px-2.5 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${take.tone}`}
              style={{ flexBasis: `${share(take.amount)}%` }}
            >
              <span className="truncate text-[11px] text-muted-foreground">{t(take.key)}</span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                −{formatCurrency(Math.round(take.amount))}
              </span>
            </div>
          ))}

          {/* Le bassin : ce qui survit à la descente. */}
          <div
            className={`relative flex min-h-[4.5rem] shrink-0 flex-1 flex-col items-center justify-center transition-colors duration-500 motion-reduce:transition-none ${
              losing ? 'bg-red-500/20' : 'bg-lume/25'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('What remains')}
            </span>
            <span
              className={`font-mono text-lg font-semibold tabular-nums ${
                losing ? 'text-red-500' : 'text-lume'
              }`}
              aria-live="polite"
            >
              {formatCurrency(Math.round(sdeMonthly))}
            </span>
          </div>
        </div>

        {/* Ce que ça vaut, en regard : le lien est immédiat. */}
        <div className="flex w-24 flex-col justify-center gap-1 sm:w-32">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('Estimated valuation')}
          </span>
          <span
            className={`font-mono text-xl font-semibold tabular-nums ${losing ? 'text-red-500' : ''}`}
          >
            {formatCurrency(results.valuation.value)}
          </span>
          {losing && (
            <span className="text-[10px] leading-tight text-red-500">
              {t('No profit, no multiple.')}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const active =
            levers.grossMargin === preset.grossMargin &&
            levers.cac === preset.cac &&
            levers.fixedCosts === preset.fixedCosts

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                setLevers({
                  grossMargin: preset.grossMargin,
                  cac: preset.cac,
                  fixedCosts: preset.fixedCosts,
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

      <div className="space-y-3">
        <Lever
          label={t('Gross margin')}
          value={formatPercent(levers.grossMargin, 0)}
          slider={[levers.grossMargin, 0.5, 0.99, 0.01]}
          onChange={(grossMargin) => setLevers((state) => ({ ...state, grossMargin }))}
        />
        <Lever
          label="CAC"
          value={formatCurrency(levers.cac)}
          slider={[levers.cac, 0, 2_000, 10]}
          onChange={(cac) => setLevers((state) => ({ ...state, cac }))}
        />
        <Lever
          label={t('Fixed costs / mo')}
          value={formatCurrency(levers.fixedCosts)}
          slider={[levers.fixedCosts, 0, 20_000, 100]}
          onChange={(fixedCosts) => setLevers((state) => ({ ...state, fixedCosts }))}
        />
      </div>
    </div>
  )
}

function Lever({
  label,
  value,
  slider: [current, min, max, step],
  onChange,
}: {
  label: string
  value: string
  slider: [number, number, number, number]
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-sm tabular-nums">{value}</span>
      </div>
      <Slider
        value={[current]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        thumbLabel={label}
        thumbValueText={value}
      />
    </div>
  )
}
