import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { compute } from '@/lib/engine'
import { buildShareUrl } from '@/lib/urlState'
import { formatCompactCurrency, formatMultiple } from '@/lib/format'
import { MAX_SCENARIOS, useResults, useSimulator } from '@/store/simulator'

export function ScenarioBar() {
  const scenarios = useSimulator((state) => state.scenarios)
  const inputs = useSimulator((state) => state.inputs)
  const pinScenario = useSimulator((state) => state.pinScenario)
  const removeScenario = useSimulator((state) => state.removeScenario)
  const { valuation } = useResults()
  const [name, setName] = useState('')

  function handlePin() {
    const label = name.trim() || `Scénario ${scenarios.length + 1}`
    pinScenario(label)
    setName('')
  }

  async function handleShare() {
    await navigator.clipboard.writeText(buildShareUrl(inputs))
    toast('Lien copié dans le presse-papiers')
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom du scénario"
          className="h-9 w-44"
          aria-label="Nom du scénario à épingler"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePin}
          disabled={scenarios.length >= MAX_SCENARIOS}
        >
          Épingler ce scénario
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          Copier le lien
        </Button>
        {scenarios.length >= MAX_SCENARIOS && (
          <span className="text-xs text-muted-foreground">
            Maximum {MAX_SCENARIOS} scénarios — en retirer un pour en épingler un autre.
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
                    aria-label={`Retirer le scénario ${scenario.name}`}
                  >
                    Retirer
                  </Button>
                </div>
                <p className="font-mono text-lg tabular-nums">
                  {formatCompactCurrency(pinned.value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMultiple(pinned.multiple)} ·{' '}
                  {formatCompactCurrency(compute(scenario.inputs).revenue.mrr)} de MRR
                </p>
                <p
                  className={`text-xs ${
                    delta >= 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-red-600 dark:text-red-500'
                  }`}
                >
                  Écart avec l'état courant : {delta >= 0 ? '+' : ''}
                  {formatCompactCurrency(delta)} ({(relative * 100).toFixed(0)} %)
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
