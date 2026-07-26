import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { formatCurrency, formatMultiple } from '@/lib/format'
import { useResults, useSimulator } from '@/store/simulator'
import type { ProfileLabel } from '@/lib/engine/types'

const PROFILE_LABELS: Record<ProfileLabel, string> = {
  micro: 'Micro-actif',
  bootstrapped: 'SaaS bootstrappé',
  established: 'SaaS établi',
}

export function ValuationCard() {
  const { valuation, revenue } = useResults()
  const override = useSimulator((state) => state.inputs.baseMultipleOverride)
  const setInput = useSimulator((state) => state.setInput)
  const animated = useAnimatedNumber(valuation.value)

  const basis =
    valuation.arrWeight === 0
      ? "de l'EBE"
      : valuation.arrWeight === 1
        ? "de l'ARR"
        : "mixte profit / revenu"

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Valorisation estimée</p>
          <p className="font-mono text-4xl tabular-nums" aria-live="polite">
            {formatCurrency(animated)}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Barème
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="base-multiple">Multiple de base</Label>
              <Input
                id="base-multiple"
                type="number"
                min={0.5}
                max={15}
                step={0.1}
                value={override ?? Number(valuation.baseMultiple.toFixed(2))}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setInput('baseMultipleOverride', Number.isFinite(next) ? next : null)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Par défaut, la courbe du barème donne {formatMultiple(valuation.baseMultiple)} pour
                ce niveau de MRR.
              </p>
            </div>
            {valuation.isOverridden && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput('baseMultipleOverride', null)}
              >
                Revenir au barème
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {formatMultiple(valuation.multiple)} {basis}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(valuation.low)} — {formatCurrency(valuation.high)}
        </span>
        <Badge variant="outline">{PROFILE_LABELS[valuation.profileLabel]}</Badge>
        {valuation.isOverridden && <Badge variant="outline">Barème personnalisé</Badge>}
      </div>

      {valuation.isLossMaking && valuation.arrWeight === 0 && (
        <p role="status" className="mt-3 text-sm text-amber-600 dark:text-amber-500">
          Actif déficitaire — pas de valorisation sur le profit. Les deux leviers sont le CAC
          ({formatCurrency(revenue.acquisitionCost)} par mois) et les charges fixes.
        </p>
      )}

      {valuation.isLossMaking && valuation.arrWeight > 0 && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Valorisé sur le revenu, l'exploitation étant déficitaire.
        </p>
      )}
    </Card>
  )
}
