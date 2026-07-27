import { X } from 'lucide-react'
import { GaugeRow } from './GaugeRow'
import { formatCurrency, formatPercent } from '@/lib/format'
import { TIER_BOUNDS } from '@/lib/inputBounds'
import type { Tier } from '@/lib/engine/types'
import { useT } from '@/store/simulator'

interface TierRowProps {
  tier: Tier
  index: number
  onChange: (index: number, patch: Partial<Tier>) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export function TierRow({ tier, index, onChange, onRemove, canRemove }: TierRowProps) {
  const t = useT()

  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t(tier.name)}</p>
        {canRemove && (
          <button
            type="button"
            aria-label={t('Remove plan {name}', { name: t(tier.name) })}
            onClick={() => onRemove(index)}
            /* Supprimer un plan se vise, sans se déclencher par mégarde :
               44 px au doigt, la discrétion d'une icône au pointeur. */
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:-m-1 sm:size-auto sm:p-1"
          >
            <X className="size-4 sm:size-3.5" aria-hidden />
          </button>
        )}
      </div>
      <GaugeRow
        label={t('{name} price', { name: t(tier.name) })}
        value={tier.price}
        onChange={(price) => onChange(index, { price })}
        max={TIER_BOUNDS.price.max}
        step={1}
        format={formatCurrency}
      />
      <GaugeRow
        label={t('{name} share', { name: t(tier.name) })}
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
