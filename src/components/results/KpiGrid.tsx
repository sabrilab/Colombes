import { useMemo } from 'react'
import { CircleHelp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { compute, healthOf, type HealthMetric } from '@/lib/engine'
import { GLOSSARY, type GlossaryKey } from '@/lib/glossary'
import { formatCompactCurrency, formatCurrency, formatMonths, formatNullable, formatPercent } from '@/lib/format'
import { useSimulator } from '@/store/simulator'
import type { Health, SimulatorInputs } from '@/lib/engine/types'

const HEALTH_STYLES: Record<Health, string> = {
  good: 'text-emerald-600 dark:text-emerald-500',
  warn: 'text-amber-600 dark:text-amber-500',
  bad: 'text-red-600 dark:text-red-500',
}

const HEALTH_WORDS: Record<Health, string> = {
  good: 'good',
  warn: 'watch',
  bad: 'critical',
}

interface TileProps {
  label: string
  value: string
  glossaryKey: GlossaryKey
  metric?: HealthMetric
  raw?: number | null
  note?: string
}

function Tile({ label, value, glossaryKey, metric, raw = null, note }: TileProps) {
  const health = metric ? healthOf(metric, raw) : null
  const entry = GLOSSARY[glossaryKey]

  return (
    <Card className="gap-1 p-3">
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`What is ${label}?`}
              className="-m-1 rounded-full p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <CircleHelp className="size-3.5" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-1.5" collisionPadding={12}>
            <PopoverTitle>{entry.title}</PopoverTitle>
            <PopoverDescription className="text-sm leading-relaxed">
              {entry.definition}
            </PopoverDescription>
            {entry.threshold && (
              <p className="text-xs text-muted-foreground/80">{entry.threshold}</p>
            )}
          </PopoverContent>
        </Popover>
      </div>
      <p className={`font-mono text-lg tabular-nums ${health ? HEALTH_STYLES[health] : ''}`}>
        {value}
      </p>
      {health && (
        <p className="text-[11px] text-muted-foreground">{HEALTH_WORDS[health]}</p>
      )}
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </Card>
  )
}

/** Grille de KPI pour des entrées arbitraires — réutilisable hors du store (profils de la volière). */
export function KpiTiles({ inputs }: { inputs: SimulatorInputs }) {
  const { revenue, economics, growth } = useMemo(() => compute(inputs), [inputs])
  const grossMargin = inputs.grossMargin

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <Tile label="MRR" value={formatCurrency(revenue.mrr)} glossaryKey="mrr" />
      <Tile label="ARR" value={formatCompactCurrency(revenue.arr)} glossaryKey="arr" />
      <Tile label="ARPU" value={formatCurrency(revenue.arpu)} glossaryKey="arpu" />
      <Tile
        label="Gross margin"
        value={formatPercent(grossMargin, 0)}
        glossaryKey="grossMargin"
        metric="grossMargin"
        raw={grossMargin}
      />
      <Tile label="LTV" value={formatNullable(economics.ltv, formatCurrency)} glossaryKey="ltv" />
      <Tile
        label="LTV:CAC"
        value={formatNullable(economics.ltvCacRatio, (v) => `${v.toFixed(1)}×`)}
        glossaryKey="ltvCacRatio"
        metric="ltvCacRatio"
        raw={economics.ltvCacRatio}
        note={economics.ltvCacRatio === null ? 'organic acquisition' : undefined}
      />
      <Tile
        label="Payback"
        value={formatNullable(economics.paybackMonths, formatMonths)}
        glossaryKey="paybackMonths"
        metric="paybackMonths"
        raw={economics.paybackMonths}
      />
      <Tile
        label="NRR (12-mo)"
        value={formatPercent(economics.nrr, 0)}
        glossaryKey="nrr"
        metric="nrr"
        raw={economics.nrr}
      />
      <Tile
        label="Rule of 40"
        value={growth.ruleOf40.toFixed(0)}
        glossaryKey="ruleOf40"
        metric="ruleOf40"
        raw={growth.ruleOf40}
      />
      <Tile
        label="MRR ceiling"
        value={formatNullable(growth.mrrCeiling, formatCurrency)}
        glossaryKey="mrrCeiling"
        note={
          growth.mrrCeiling === null ? 'no ceiling: expansion outpaces churn' : undefined
        }
      />
    </div>
  )
}

export function KpiGrid() {
  const inputs = useSimulator((state) => state.inputs)
  return <KpiTiles inputs={inputs} />
}
