import { GaugeRow } from './GaugeRow'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { Tier } from '@/lib/engine/types'

interface TierRowProps {
  tier: Tier
  index: 0 | 1 | 2
  onChange: (index: 0 | 1 | 2, patch: Partial<Tier>) => void
}

export function TierRow({ tier, index, onChange }: TierRowProps) {
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <p className="text-sm font-medium">{tier.name}</p>
      <GaugeRow
        label={`Prix ${tier.name}`}
        value={tier.price}
        onChange={(price) => onChange(index, { price })}
        max={500}
        step={1}
        format={formatCurrency}
      />
      <GaugeRow
        label={`Part ${tier.name}`}
        value={tier.mix}
        onChange={(mix) => onChange(index, { mix })}
        max={1}
        step={0.01}
        format={(value) => formatPercent(value, 0)}
        inputScale={100}
      />
    </div>
  )
}
