import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { LOG_STEPS, positionToValue, valueToPosition } from '@/lib/logScale'

interface GaugeRowProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max: number
  step?: number
  scale?: 'linear' | 'log'
  format: (value: number) => string
  /**
   * Facteur appliqué dans le champ de saisie. Vaut 100 pour les jauges en
   * pourcentage, afin qu'on tape « 2,1 » et non « 0,021 ».
   */
  inputScale?: number
  /** Repère de marché, dans l'unité de la jauge. */
  marker?: number | null
  markerLabel?: string
  hint?: string
}

export function GaugeRow({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  scale = 'linear',
  format,
  inputScale = 1,
  marker = null,
  markerLabel,
  hint,
}: GaugeRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const isLog = scale === 'log'

  const sliderValue = isLog ? valueToPosition(value, max) : value
  const sliderMin = isLog ? 0 : min
  const sliderMax = isLog ? LOG_STEPS : max
  const sliderStep = isLog ? 1 : step

  function handleChange(next: number[]) {
    onChange(isLog ? positionToValue(next[0], max) : next[0])
  }

  function startEditing() {
    setDraft(String(Number((value * inputScale).toFixed(4))))
    setEditing(true)
  }

  /** Accepte la virgule décimale française, écrête aux bornes, ignore une saisie illisible. */
  function commitEditing() {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isFinite(parsed)) {
      onChange(Math.min(Math.max(parsed / inputScale, min), max))
    }
    setEditing(false)
  }

  const markerPosition =
    marker === null || marker < min || marker > max
      ? null
      : isLog
        ? (valueToPosition(marker, max) / LOG_STEPS) * 100
        : ((marker - min) / (max - min)) * 100

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{label}</span>
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEditing}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitEditing()
              if (event.key === 'Escape') setEditing(false)
            }}
            className="h-7 w-24 text-right font-mono text-sm tabular-nums"
            aria-label={`${label} — saisie directe`}
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            onFocus={startEditing}
            className="rounded-sm px-1 font-mono text-sm tabular-nums hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${label} : ${format(value)}. Activer pour saisir une valeur exacte.`}
          >
            {format(value)}
          </button>
        )}
      </div>

      <div className="relative">
        <Slider
          value={[sliderValue]}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          onValueChange={handleChange}
          thumbLabel={label}
          thumbValueText={format(value)}
        />
        {markerPosition !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-muted-foreground/60"
            style={{ left: `${markerPosition}%` }}
          />
        )}
      </div>

      {(markerLabel ?? hint) && (
        <p className="text-xs text-muted-foreground">{markerLabel ?? hint}</p>
      )}
    </div>
  )
}
