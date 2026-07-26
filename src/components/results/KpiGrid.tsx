import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HEALTH_THRESHOLDS, healthOf, type HealthMetric } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency, formatMonths, formatNullable, formatPercent } from '@/lib/format'
import { useResults, useSimulator } from '@/store/simulator'
import type { Health } from '@/lib/engine/types'

const HEALTH_STYLES: Record<Health, string> = {
  good: 'text-emerald-600 dark:text-emerald-500',
  warn: 'text-amber-600 dark:text-amber-500',
  bad: 'text-red-600 dark:text-red-500',
}

const HEALTH_WORDS: Record<Health, string> = {
  good: 'bon',
  warn: 'à surveiller',
  bad: 'critique',
}

interface TileProps {
  label: string
  value: string
  metric?: HealthMetric
  raw?: number | null
  note?: string
}

function Tile({ label, value, metric, raw = null, note }: TileProps) {
  const health = metric ? healthOf(metric, raw) : null

  const body = (
    <Card className="gap-1 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-mono text-lg tabular-nums ${health ? HEALTH_STYLES[health] : ''}`}>
        {value}
      </p>
      {health && (
        <p className="text-[11px] text-muted-foreground">{HEALTH_WORDS[health]}</p>
      )}
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </Card>
  )

  if (!metric) return body

  return (
    <Tooltip>
      <TooltipTrigger asChild>{body}</TooltipTrigger>
      <TooltipContent>{HEALTH_THRESHOLDS[metric].label}</TooltipContent>
    </Tooltip>
  )
}

export function KpiGrid() {
  const { revenue, economics, growth } = useResults()
  const grossMargin = useSimulator((state) => state.inputs.grossMargin)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <Tile label="MRR" value={formatCurrency(revenue.mrr)} />
      <Tile label="ARR" value={formatCompactCurrency(revenue.arr)} />
      <Tile label="ARPU" value={formatCurrency(revenue.arpu)} />
      <Tile
        label="Marge brute"
        value={formatPercent(grossMargin, 0)}
        metric="grossMargin"
        raw={grossMargin}
      />
      <Tile label="LTV" value={formatNullable(economics.ltv, formatCurrency)} />
      <Tile
        label="LTV:CAC"
        value={formatNullable(economics.ltvCacRatio, (v) => `${v.toFixed(1).replace('.', ',')}×`)}
        metric="ltvCacRatio"
        raw={economics.ltvCacRatio}
        note={economics.ltvCacRatio === null ? 'acquisition organique' : undefined}
      />
      <Tile
        label="Payback"
        value={formatNullable(economics.paybackMonths, formatMonths)}
        metric="paybackMonths"
        raw={economics.paybackMonths}
      />
      <Tile
        label="NRR"
        value={formatPercent(economics.nrr, 0)}
        metric="nrr"
        raw={economics.nrr}
      />
      <Tile
        label="Rule of 40"
        value={growth.ruleOf40.toFixed(0)}
        metric="ruleOf40"
        raw={growth.ruleOf40}
      />
      <Tile
        label="Plafond de MRR"
        value={formatNullable(growth.mrrCeiling, formatCurrency)}
        note={growth.mrrCeiling === null ? 'rétention nette négative' : undefined}
      />
    </div>
  )
}
