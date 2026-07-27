import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { compute } from '@/lib/engine'
import { buildShareUrl } from '@/lib/urlState'
import { formatCompactCurrency, formatMultiple } from '@/lib/format'
import { MAX_SCENARIOS, useResults, useSimulator, useT } from '@/store/simulator'

export function ScenarioBar() {
  const scenarios = useSimulator((state) => state.scenarios)
  const inputs = useSimulator((state) => state.inputs)
  const pinScenario = useSimulator((state) => state.pinScenario)
  const removeScenario = useSimulator((state) => state.removeScenario)
  const { valuation } = useResults()
  const [name, setName] = useState('')
  const t = useT()

  function handlePin() {
    const label = name.trim() || t('Scenario {n}', { n: scenarios.length + 1 })
    pinScenario(label)
    setName('')
  }

  async function handleShare() {
    await navigator.clipboard.writeText(buildShareUrl(inputs))
    toast(t('Link copied to clipboard'))
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('Scenario name')}
          className="h-9 w-44"
          aria-label={t('Name of the scenario to pin')}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePin}
          disabled={scenarios.length >= MAX_SCENARIOS}
        >
          {t('Pin this scenario')}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          {t('Copy link')}
        </Button>
        {scenarios.length >= MAX_SCENARIOS && (
          <span className="text-xs text-muted-foreground">
            {t('Up to {max} scenarios — remove one to pin another.', { max: MAX_SCENARIOS })}
          </span>
        )}
      </div>

      {scenarios.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {scenarios.map((scenario) => {
            const pinned = compute(scenario.inputs).valuation
            const delta = valuation.value - pinned.value
            const relative = pinned.value > 0 ? delta / pinned.value : 0

            return (
              <div key={scenario.id} className="rounded-md bg-muted/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium">{scenario.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-xs"
                    onClick={() => removeScenario(scenario.id)}
                    aria-label={t('Remove scenario {name}', { name: scenario.name })}
                  >
                    {t('Remove')}
                  </Button>
                </div>
                <p className="font-mono text-lg tabular-nums">
                  {formatCompactCurrency(pinned.value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMultiple(pinned.multiple)} ·{' '}
                  MRR {formatCompactCurrency(compute(scenario.inputs).revenue.mrr)}
                </p>
                <p
                  className={`text-xs ${
                    delta >= 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-red-600 dark:text-red-500'
                  }`}
                >
                  {t('vs current:')} {delta >= 0 ? '+' : ''}
                  {formatCompactCurrency(delta)} ({(relative * 100).toFixed(0)}%)
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
