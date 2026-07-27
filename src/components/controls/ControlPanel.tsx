import { Plus } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GaugeRow } from './GaugeRow'
import { TierRow } from './TierRow'
import { useResults, useSimulator, useT, type PanelMode } from '@/store/simulator'
import { priceZoneFor } from '@/lib/engine'
import { describeHiddenAssumptions } from '@/lib/assumptions'
import { formatCurrency, formatMonths, formatPercent } from '@/lib/format'
import { INPUT_BOUNDS, TIER_COUNT_BOUNDS } from '@/lib/inputBounds'
import type { Level } from '@/lib/engine/types'

const LEVEL_LABELS: Record<Level, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function LevelToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: Level
  onChange: (value: Level) => void
}) {
  const t = useT()

  return (
    <div className="space-y-2 py-2">
      <span className="text-sm">{label}</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as Level)}
        className="w-full"
        aria-label={label}
      >
        {(Object.keys(LEVEL_LABELS) as Level[]).map((level) => (
          <ToggleGroupItem key={level} value={level} className="flex-1 text-xs">
            {t(LEVEL_LABELS[level])}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export function ControlPanel() {
  const inputs = useSimulator((state) => state.inputs)
  const setInput = useSimulator((state) => state.setInput)
  const setTier = useSimulator((state) => state.setTier)
  const addTier = useSimulator((state) => state.addTier)
  const removeTier = useSimulator((state) => state.removeTier)
  const panelMode = useSimulator((state) => state.panelMode)
  const setPanelMode = useSimulator((state) => state.setPanelMode)
  const { revenue } = useResults()
  const t = useT()

  const expert = panelMode === 'expert'
  const zone = priceZoneFor(revenue.arpu)
  const churnLooksOptimistic = revenue.arpu > 0 && inputs.revenueChurn < zone.churnMin

  // Le moteur renormalise les parts à 100 % : sans signal, le mix affiché mentirait.
  const mixTotal = inputs.tiers.reduce((sum, tier) => sum + Math.max(tier.mix, 0), 0)
  const mixIsOff = Math.abs(mixTotal - 1) > 0.005

  // Repères calculés : ils répondent à « où est la limite pour moi »,
  // pas à « quelle est la moyenne du marché ».
  const cacMarker = 12 * revenue.arpu * inputs.grossMargin

  return (
    <div>
      <ToggleGroup
        type="single"
        value={panelMode}
        onValueChange={(next) => next && setPanelMode(next as PanelMode)}
        className="w-full"
        aria-label={t('Level of detail')}
      >
        <ToggleGroupItem value="simple" className="flex-1 text-xs">
          {t('Simple')}
        </ToggleGroupItem>
        <ToggleGroupItem value="expert" className="flex-1 text-xs">
          {t('Expert')}
        </ToggleGroupItem>
      </ToggleGroup>

      <Accordion type="multiple" defaultValue={['pricing', 'clients', 'retention', 'economy']}>
        <AccordionItem value="pricing">
          <AccordionTrigger>{t('Pricing')}</AccordionTrigger>
          <AccordionContent>
            {inputs.tiers.map((tier, index) => (
              <TierRow
                key={`${index}-${tier.name}`}
                tier={tier}
                index={index}
                onChange={setTier}
                onRemove={removeTier}
                canRemove={inputs.tiers.length > TIER_COUNT_BOUNDS.min}
              />
            ))}
            {inputs.tiers.length < TIER_COUNT_BOUNDS.max && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={addTier}
              >
                <Plus className="size-3.5" aria-hidden />
                {t('Add a plan')}
              </Button>
            )}
            {mixIsOff && (
              <p role="status" className="pt-2 text-xs text-amber-600 dark:text-amber-500">
                {t(
                  'Plan shares add up to {total}: they are normalized back to 100% for the math, each plan keeping its relative weight.',
                  { total: formatPercent(mixTotal, 0) },
                )}
              </p>
            )}
            <p className="pt-2 text-xs text-muted-foreground">
              {t('Blended ARPU {arpu} · {zone} zone, typical churn {min} to {max}', {
                arpu: formatCurrency(revenue.arpu),
                zone: t(zone.label),
                min: formatPercent(zone.churnMin, 0),
                max: formatPercent(zone.churnMax, 0),
              })}
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="clients">
          <AccordionTrigger>{t('Customers & acquisition')}</AccordionTrigger>
          <AccordionContent>
            <GaugeRow
              label={t('Customers')}
              value={inputs.customers}
              onChange={(value) => setInput('customers', value)}
              max={INPUT_BOUNDS.customers.max}
              scale="log"
              format={(value) => value.toLocaleString('en-US')}
            />
            <GaugeRow
              label={t('New customers / mo')}
              value={inputs.newCustomersPerMonth}
              onChange={(value) => setInput('newCustomersPerMonth', value)}
              max={INPUT_BOUNDS.newCustomersPerMonth.max}
              scale="log"
              format={(value) => value.toLocaleString('en-US')}
            />
            {expert && (
              <GaugeRow
                label="CAC"
                value={inputs.cac}
                onChange={(value) => setInput('cac', value)}
                max={INPUT_BOUNDS.cac.max}
                format={formatCurrency}
                marker={cacMarker}
                markerLabel={t('Marker {value} — 12-month payback', { value: formatCurrency(cacMarker) })}
              />
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="retention">
          <AccordionTrigger>{t('Retention')}</AccordionTrigger>
          <AccordionContent>
            <GaugeRow
              label={t('Revenue churn / mo')}
              value={inputs.revenueChurn}
              onChange={(value) => setInput('revenueChurn', value)}
              max={INPUT_BOUNDS.revenueChurn.max}
              step={0.001}
              format={(value) => formatPercent(value)}
              inputScale={100}
              marker={0.03}
              markerLabel={t('3%/mo marker — B2B median')}
            />
            {expert && (
              <GaugeRow
                label={t('Expansion / mo')}
                value={inputs.expansion}
                onChange={(value) => setInput('expansion', value)}
                max={INPUT_BOUNDS.expansion.max}
                step={0.001}
                format={(value) => formatPercent(value)}
                inputScale={100}
                marker={inputs.revenueChurn}
                markerLabel={t('Marker {value} — NRR at 100%', { value: formatPercent(inputs.revenueChurn) })}
              />
            )}
            {churnLooksOptimistic && (
              <p role="status" className="pt-2 text-xs text-amber-600 dark:text-amber-500">
                {t('Optimistic churn for an ARPU of {arpu}: the {zone} zone typically runs around {min}.', {
                  arpu: formatCurrency(revenue.arpu),
                  zone: t(zone.label),
                  min: formatPercent(zone.churnMin, 0),
                })}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {expert && (
          <AccordionItem value="economy">
            <AccordionTrigger>{t('Economics')}</AccordionTrigger>
            <AccordionContent>
              <GaugeRow
                label={t('Gross margin')}
                value={inputs.grossMargin}
                onChange={(value) => setInput('grossMargin', value)}
                min={INPUT_BOUNDS.grossMargin.min}
                max={INPUT_BOUNDS.grossMargin.max}
                step={0.01}
                format={(value) => formatPercent(value, 0)}
                inputScale={100}
                marker={0.8}
                markerLabel={t('80% marker')}
              />
              <GaugeRow
                label={t('Fixed costs / mo')}
                value={inputs.fixedCosts}
                onChange={(value) => setInput('fixedCosts', value)}
                max={INPUT_BOUNDS.fixedCosts.max}
                step={100}
                format={formatCurrency}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {expert && (
          <AccordionItem value="quality">
            <AccordionTrigger>{t('Asset quality')}</AccordionTrigger>
            <AccordionContent>
              <LevelToggle
                label={t('Founder dependency')}
                value={inputs.founderDependency}
                onChange={(value) => setInput('founderDependency', value)}
              />
              <LevelToggle
                label={t('Tech transferability')}
                value={inputs.techTransferability}
                onChange={(value) => setInput('techTransferability', value)}
              />
              <GaugeRow
                label={t('Top client share')}
                value={inputs.topClientShare}
                onChange={(value) => setInput('topClientShare', value)}
                max={INPUT_BOUNDS.topClientShare.max}
                step={0.01}
                format={(value) => formatPercent(value, 0)}
                inputScale={100}
              />
              <GaugeRow
                label={t('Age')}
                value={inputs.ageMonths}
                onChange={(value) => setInput('ageMonths', value)}
                max={INPUT_BOUNDS.ageMonths.max}
                format={formatMonths}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {!expert && (
        <p className="pt-3 text-xs text-muted-foreground">
          {t('Applied assumptions: {list}. Switch to Expert to adjust them.', {
            list: describeHiddenAssumptions(inputs, t),
          })}
        </p>
      )}
    </div>
  )
}
