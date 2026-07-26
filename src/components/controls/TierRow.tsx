import { X } from 'lucide-react'
import { GaugeRow } from './GaugeRow'
import { formatCurrency, formatPercent } from '@/lib/format'
import { TIER_BOUNDS } from '@/lib/inputBounds'
import type { Tier } from '@/lib/engine/types'

interface TierRowProps {
  tier: Tier
  index: number
  onChange: (index: number, patch: Partial<Tier>) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export function TierRow({ tier, index, onChange, onRemove, canRemove }: TierRowProps) {
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{tier.name}</p>
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove plan ${tier.name}`}
            onClick={() => onRemove(index)}
            className="-m-1 rounded-full p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
      <GaugeRow
        label={`${tier.name} price`}
        value={tier.price}
        onChange={(price) => onChange(index, { price })}
        max={TIER_BOUNDS.price.max}
        step={1}
        format={formatCurrency}
      />
      <GaugeRow
        label={`${tier.name} share`}
        value={tier.mix}
        onChange={(mix) => onChange(index, { mix })}
        max={TIER_BOUNDS.mix.max}
        step={0.01}
        format={(value) => formatPercent(value, 0)}
        inputScale={100}
      />
    </div>
  )
}
