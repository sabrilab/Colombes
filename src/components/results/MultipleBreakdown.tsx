import { Card } from '@/components/ui/card'
import { formatMultiple, formatPercent } from '@/lib/format'
import { useResults, useT } from '@/store/simulator'

export function MultipleBreakdown() {
  const { valuation } = useResults()
  const sorted = [...valuation.lines].sort((a, b) => b.deltaMultiple - a.deltaMultiple)
  const t = useT()

  return (
    <Card className="p-5">
      <p className="text-sm font-medium">{t('Multiple build-up')}</p>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            {t('Base')} {valuation.isOverridden ? t('(custom)') : t('(market curve)')}
          </dt>
          <dd className="font-mono tabular-nums">{formatMultiple(valuation.baseMultiple)}</dd>
        </div>

        {sorted.map((line) => (
          <div key={line.key} className="flex justify-between gap-4">
            <dt className={line.deltaPct === 0 ? 'text-muted-foreground/60' : 'text-muted-foreground'}>
              {t(line.label)}
            </dt>
            <dd
              className={`font-mono tabular-nums ${
                line.deltaPct > 0
                  ? 'text-emerald-600 dark:text-emerald-500'
                  : line.deltaPct < 0
                    ? 'text-red-600 dark:text-red-500'
                    : 'text-muted-foreground/60'
              }`}
            >
              {line.deltaPct === 0 ? '—' : formatMultiple(line.deltaMultiple, true)}
            </dd>
          </div>
        ))}

        {valuation.adjClamped && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t('Adjustments clamped at {sum}', { sum: formatPercent(valuation.adjSum, 0) })}
            </dt>
            <dd className="font-mono tabular-nums text-muted-foreground">{t('capped')}</dd>
          </div>
        )}

        {valuation.multipleClamped && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t('Capped at the curve maximum')}</dt>
            <dd className="font-mono tabular-nums text-muted-foreground">
              {formatMultiple(valuation.multiple)}
            </dd>
          </div>
        )}

        <div className="flex justify-between gap-4 border-t border-border pt-2">
          <dt className="font-medium">{t('Adjusted multiple')}</dt>
          <dd className="font-mono font-medium tabular-nums">
            {formatMultiple(valuation.multiple)}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
