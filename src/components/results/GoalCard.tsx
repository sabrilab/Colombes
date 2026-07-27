import { Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { GaugeRow } from '@/components/controls/GaugeRow'
import { evaluateGoal } from '@/lib/goals'
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format'
import { INPUT_BOUNDS } from '@/lib/inputBounds'
import { useResults, useSimulator, useT } from '@/store/simulator'

/** Horizon maximal proposé : au-delà, la projection elle-même s'arrête. */
const MAX_HORIZON = 36

/**
 * Le point A, le point B, et ce qui les sépare. La carte ne se contente pas
 * d'afficher un écart : elle date l'arrivée, ou dit pourquoi la trajectoire
 * n'y mènera jamais — et de combien il faudrait bouger.
 */
export function GoalCard() {
  const inputs = useSimulator((state) => state.inputs)
  const goal = useSimulator((state) => state.goal)
  const setGoal = useSimulator((state) => state.setGoal)
  const results = useResults()
  const t = useT()

  const outcome = evaluateGoal(inputs, results, goal)
  const done = outcome.gap <= 0

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-lume" aria-hidden />
        <p className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
          {t('Your goal')}
        </p>
      </div>

      <div className="grid gap-x-6 sm:grid-cols-2">
        <GaugeRow
          label={t('Target MRR')}
          value={goal.target}
          onChange={(target) => setGoal({ ...goal, target })}
          min={100}
          max={INPUT_BOUNDS.customers.max * 25}
          scale="log"
          format={formatCurrency}
          marker={results.growth.mrrCeiling}
          markerLabel={
            results.growth.mrrCeiling !== null
              ? t('Your ceiling: {value}', {
                  value: formatCompactCurrency(results.growth.mrrCeiling),
                })
              : undefined
          }
        />
        <GaugeRow
          label={t('Within')}
          value={goal.months}
          onChange={(months) => setGoal({ ...goal, months })}
          min={1}
          max={MAX_HORIZON}
          format={(value) => t('{n} months', { n: Math.round(value) })}
        />
      </div>

      <div className="border-t border-border/60 pt-3">
        {done ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-500">
            {t('Already there — you are {over} past the goal.', {
              over: formatCurrency(-outcome.gap),
            })}
          </p>
        ) : outcome.aboveCeiling ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600 dark:text-red-500">
              {t(
                'Out of reach at these settings: your MRR converges to {ceiling}, below the {target} goal.',
                {
                  ceiling: formatCompactCurrency(outcome.ceiling ?? 0),
                  target: formatCompactCurrency(outcome.target),
                },
              )}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {outcome.requiredNewCustomers !== null && (
                <li>
                  {t('Either bring {count} new customers a month, instead of {current}.', {
                    count: outcome.requiredNewCustomers.toLocaleString('en-US'),
                    current: inputs.newCustomersPerMonth.toLocaleString('en-US'),
                  })}
                </li>
              )}
              {outcome.requiredChurn !== null && (
                <li>
                  {t('Or bring churn down to {churn}/mo, from {current}.', {
                    churn: formatPercent(outcome.requiredChurn),
                    current: formatPercent(inputs.revenueChurn),
                  })}
                </li>
              )}
            </ul>
          </div>
        ) : outcome.reachedInHorizon ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-500">
            {t('On track: you reach {target} in month {month}, {gap} from here.', {
              target: formatCompactCurrency(outcome.target),
              month: outcome.monthReached ?? 0,
              gap: formatCurrency(outcome.gap),
            })}
          </p>
        ) : outcome.monthReached !== null ? (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {t('Late: you reach it in month {month}, past your {horizon}-month window.', {
              month: outcome.monthReached,
              horizon: goal.months,
            })}
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {t('Not within 36 months at this pace — {gap} still to go.', {
              gap: formatCurrency(outcome.gap),
            })}
          </p>
        )}
      </div>
    </Card>
  )
}
