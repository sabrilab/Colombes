import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_SAVED_SIMULATIONS, useSimulator } from '@/store/simulator'

/** Enregistrer une simulation, par opposition à l'épinglage qui ne sert
    qu'à comparer le temps d'une session. */
export function SaveBar() {
  const savedSims = useSimulator((state) => state.savedSims)
  const saveSimulation = useSimulator((state) => state.saveSimulation)
  const [name, setName] = useState('')

  const full = savedSims.length >= MAX_SAVED_SIMULATIONS

  function handleSave() {
    saveSimulation(name)
    setName('')
    toast(name.trim() ? `“${name.trim()}” saved to your library` : 'Saved to your library')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !full) handleSave()
        }}
        placeholder="Simulation title"
        className="h-9 w-48"
        aria-label="Title for this simulation"
      />
      <Button size="sm" className="lume-pill rounded-full px-4" onClick={handleSave} disabled={full}>
        Save simulation
      </Button>
      {full ? (
        <span className="text-xs text-muted-foreground">
          Library full ({MAX_SAVED_SIMULATIONS}) — delete one to save another.
        </span>
      ) : (
        savedSims.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {savedSims.length} saved · find them on the home page
          </span>
        )
      )}
    </div>
  )
}
