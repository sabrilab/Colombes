import { lazy, Suspense } from 'react'
import { TierBadge } from '@/components/AnimalGlyph'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { diagnose, type InsightTone } from '@/lib/diagnose'
import { animalFor } from '@/lib/pricePad'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { formatCompactCurrency, formatCurrency, formatMultiple } from '@/lib/format'
import { useResults, useSimulator, useT } from '@/store/simulator'
import type { ProfileLabel } from '@/lib/engine/types'

const PROFILE_LABELS: Record<ProfileLabel, string> = {
  micro: 'Micro asset',
  bootstrapped: 'Bootstrapped SaaS',
  established: 'Established SaaS',
}

/** Le palier incarné, comme sur l'accueil. Chargé à la demande. */
const AnimalStage3D = lazy(() => import('@/components/home/AnimalStage3D'))

const TONE_DOTS: Record<InsightTone, string> = {
  bad: 'bg-red-500',
  warn: 'bg-amber-500',
  good: 'bg-emerald-500',
}

export function ValuationCard() {
  const results = useResults()
  const { valuation } = results
  const override = useSimulator((state) => state.inputs.baseMultipleOverride)
  const setInput = useSimulator((state) => state.setInput)
  const animated = useAnimatedNumber(valuation.value)
  const insights = diagnose(results)
  const t = useT()

  const basis =
    valuation.arrWeight === 0
      ? 'EBITDA'
      : valuation.arrWeight === 1
        ? 'ARR'
        : 'blended profit / revenue'

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t('Estimated valuation')}</p>
          <p className="metal-number font-mono text-4xl font-semibold tabular-nums" aria-live="polite">
            {formatCurrency(animated)}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="hidden h-20 w-28 shrink-0 sm:block">
            <Suspense fallback={null}>
              <AnimalStage3D animal={animalFor(results.revenue.arpu).name} />
            </Suspense>
          </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {t('Curve')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="base-multiple">{t('Base multiple')}</Label>
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
                {t('By default, the market curve gives {multiple} at this MRR level.', {
                  multiple: formatMultiple(valuation.baseMultiple),
                })}
              </p>
            </div>
            {valuation.isOverridden && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput('baseMultipleOverride', null)}
              >
                {t('Back to the curve')}
              </Button>
            )}
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Le MRR mérite d'être lu d'un coup d'œil, pas déduit de la grille. */}
      <div className="mt-2 flex items-baseline gap-6">
        <p>
          <span className="text-xs text-muted-foreground">MRR </span>
          <span className="font-mono text-xl font-semibold tabular-nums">
            {formatCurrency(results.revenue.mrr)}
          </span>
        </p>
        <p>
          <span className="text-xs text-muted-foreground">ARR </span>
          <span className="font-mono text-xl font-semibold tabular-nums">
            {formatCompactCurrency(results.revenue.arr)}
          </span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {formatMultiple(valuation.multiple)} {basis}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(valuation.low)} — {formatCurrency(valuation.high)}
        </span>
        <Badge variant="outline">{t(PROFILE_LABELS[valuation.profileLabel])}</Badge>
        {valuation.isOverridden && <Badge variant="outline">{t('Custom curve')}</Badge>}
        <TierBadge animal={animalFor(results.revenue.arpu).name} />
      </div>

      {/* La lecture en direct : pourquoi ce scénario marche — ou pas. */}
      <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3" aria-label={t('Live read')}>
        {insights.map((insight) => (
          <li key={insight.text} className="flex items-start gap-2 text-xs leading-relaxed">
            <span
              aria-hidden
              className={`mt-1 size-1.5 shrink-0 rounded-full ${TONE_DOTS[insight.tone]}`}
            />
            <span className="text-muted-foreground">{t(insight.text, insight.vars)}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
