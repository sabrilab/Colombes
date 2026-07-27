import { useState } from 'react'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TierBadge } from '@/components/AnimalGlyph'
import { compute } from '@/lib/engine'
import { animalFor } from '@/lib/pricePad'
import { formatCompactCurrency, formatMultiple } from '@/lib/format'
import { navigate } from '@/lib/router'
import { colombeById } from '@/lib/aviary'
import { useSimulator, type SavedSimulation } from '@/store/simulator'

function SavedCard({ sim }: { sim: SavedSimulation }) {
  const openSimulation = useSimulator((state) => state.openSimulation)
  const renameSimulation = useSimulator((state) => state.renameSimulation)
  const duplicateSimulation = useSimulator((state) => state.duplicateSimulation)
  const deleteSimulation = useSimulator((state) => state.deleteSimulation)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(sim.name)

  const { valuation, revenue } = compute(sim.inputs)
  const origin = sim.basedOn ? colombeById(sim.basedOn) : null

  function commitRename() {
    renameSimulation(sim.id, draft)
    setEditing(false)
  }

  return (
    <Card className="h-full gap-0 overflow-hidden p-0">
      <div className="card-band flex items-start justify-between gap-2 border-b border-border/50 p-3">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitRename()
              if (event.key === 'Escape') setEditing(false)
            }}
            className="h-7 text-sm"
            aria-label={`Rename ${sim.name}`}
          />
        ) : (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{sim.name}</p>
            {origin && (
              <p className="truncate text-[11px] text-muted-foreground">
                based on {origin.name}
              </p>
            )}
          </div>
        )}
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => {
              setDraft(sim.name)
              setEditing(true)
            }}
            aria-label={`Rename ${sim.name}`}
            className="rounded p-1 text-muted-foreground/60 hover:text-foreground"
          >
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => duplicateSimulation(sim.id)}
            aria-label={`Duplicate ${sim.name}`}
            className="rounded p-1 text-muted-foreground/60 hover:text-foreground"
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => deleteSimulation(sim.id)}
            aria-label={`Delete ${sim.name}`}
            className="rounded p-1 text-muted-foreground/60 hover:text-red-500"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          openSimulation(sim.id)
          navigate('#/simulateur')
        }}
        className="flex items-end justify-between gap-3 p-3 text-left transition-colors hover:bg-foreground/[0.03]"
        aria-label={`Open ${sim.name} in the simulator`}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Valuation</p>
          <p className="font-mono text-xl font-semibold tabular-nums">
            {formatCompactCurrency(valuation.value)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatMultiple(valuation.multiple)}
          </p>
          <TierBadge animal={animalFor(revenue.arpu).name} />
        </div>
      </button>
    </Card>
  )
}

export function SavedLibrary() {
  const savedSims = useSimulator((state) => state.savedSims)
  if (savedSims.length === 0) return null

  return (
    <section className="mt-12 lg:mt-16" aria-label="Your simulations">
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Your simulations
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {savedSims.map((sim) => (
          <SavedCard key={sim.id} sim={sim} />
        ))}
      </div>
    </section>
  )
}
