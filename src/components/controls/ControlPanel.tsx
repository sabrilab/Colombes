import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GaugeRow } from './GaugeRow'
import { TierRow } from './TierRow'
import { useResults, useSimulator } from '@/store/simulator'
import { priceZoneFor } from '@/lib/engine'
import { formatCurrency, formatMonths, formatPercent } from '@/lib/format'
import type { Level } from '@/lib/engine/types'

const LEVEL_LABELS: Record<Level, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
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
            {LEVEL_LABELS[level]}
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
  const { revenue } = useResults()

  const zone = priceZoneFor(revenue.arpu)
  const churnLooksOptimistic = revenue.arpu > 0 && inputs.revenueChurn < zone.churnMin

  // Repères calculés : ils répondent à « où est la limite pour moi »,
  // pas à « quelle est la moyenne du marché ».
  const cacMarker = 12 * revenue.arpu * inputs.grossMargin

  return (
    <Accordion type="multiple" defaultValue={['pricing', 'clients', 'retention', 'economy']}>
      <AccordionItem value="pricing">
        <AccordionTrigger>Pricing</AccordionTrigger>
        <AccordionContent>
          {inputs.tiers.map((tier, index) => (
            <TierRow key={tier.name} tier={tier} index={index as 0 | 1 | 2} onChange={setTier} />
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            ARPU pondéré {formatCurrency(revenue.arpu)} · zone {zone.label}, churn typique{' '}
            {formatPercent(zone.churnMin, 0)} à {formatPercent(zone.churnMax, 0)}
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="clients">
        <AccordionTrigger>Clients et acquisition</AccordionTrigger>
        <AccordionContent>
          <GaugeRow
            label="Clients"
            value={inputs.customers}
            onChange={(value) => setInput('customers', value)}
            max={20_000}
            scale="log"
            format={(value) => value.toLocaleString('fr-FR')}
          />
          <GaugeRow
            label="Nouveaux clients / mois"
            value={inputs.newCustomersPerMonth}
            onChange={(value) => setInput('newCustomersPerMonth', value)}
            max={1_000}
            scale="log"
            format={(value) => value.toLocaleString('fr-FR')}
          />
          <GaugeRow
            label="CAC"
            value={inputs.cac}
            onChange={(value) => setInput('cac', value)}
            max={2_000}
            format={formatCurrency}
            marker={cacMarker}
            markerLabel={`Repère ${formatCurrency(cacMarker)} — payback de 12 mois`}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="retention">
        <AccordionTrigger>Rétention</AccordionTrigger>
        <AccordionContent>
          <GaugeRow
            label="Churn de revenu / mois"
            value={inputs.revenueChurn}
            onChange={(value) => setInput('revenueChurn', value)}
            max={0.15}
            step={0.001}
            format={(value) => formatPercent(value)}
            inputScale={100}
            marker={0.03}
            markerLabel="Repère 3 %/mois — médiane B2B"
          />
          <GaugeRow
            label="Expansion / mois"
            value={inputs.expansion}
            onChange={(value) => setInput('expansion', value)}
            max={0.1}
            step={0.001}
            format={(value) => formatPercent(value)}
            inputScale={100}
            marker={inputs.revenueChurn}
            markerLabel={`Repère ${formatPercent(inputs.revenueChurn)} — NRR à 100 %`}
          />
          {churnLooksOptimistic && (
            <p role="status" className="pt-2 text-xs text-amber-600 dark:text-amber-500">
              Hypothèse de churn optimiste pour un ARPU de {formatCurrency(revenue.arpu)} : la zone{' '}
              {zone.label} tourne plutôt autour de {formatPercent(zone.churnMin, 0)}.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="economy">
        <AccordionTrigger>Économie</AccordionTrigger>
        <AccordionContent>
          <GaugeRow
            label="Marge brute"
            value={inputs.grossMargin}
            onChange={(value) => setInput('grossMargin', value)}
            min={0.5}
            max={0.99}
            step={0.01}
            format={(value) => formatPercent(value, 0)}
            inputScale={100}
            marker={0.8}
            markerLabel="Repère 80 %"
          />
          <GaugeRow
            label="Charges fixes / mois"
            value={inputs.fixedCosts}
            onChange={(value) => setInput('fixedCosts', value)}
            max={100_000}
            step={100}
            format={formatCurrency}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="quality">
        <AccordionTrigger>Qualité de l'actif</AccordionTrigger>
        <AccordionContent>
          <LevelToggle
            label="Dépendance au fondateur"
            value={inputs.founderDependency}
            onChange={(value) => setInput('founderDependency', value)}
          />
          <LevelToggle
            label="Transférabilité technique"
            value={inputs.techTransferability}
            onChange={(value) => setInput('techTransferability', value)}
          />
          <GaugeRow
            label="Part du plus gros client"
            value={inputs.topClientShare}
            onChange={(value) => setInput('topClientShare', value)}
            max={0.6}
            step={0.01}
            format={(value) => formatPercent(value, 0)}
            inputScale={100}
          />
          <GaugeRow
            label="Ancienneté"
            value={inputs.ageMonths}
            onChange={(value) => setInput('ageMonths', value)}
            max={96}
            format={formatMonths}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
