import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_SAVED_SIMULATIONS, useSimulator, useT } from '@/store/simulator'

/** Enregistrer une simulation, par opposition à l'épinglage qui ne sert
    qu'à comparer le temps d'une session. */
export function SaveBar() {
  const savedSims = useSimulator((state) => state.savedSims)
  const saveSimulation = useSimulator((state) => state.saveSimulation)
  const [name, setName] = useState('')
  const t = useT()

  const full = savedSims.length >= MAX_SAVED_SIMULATIONS

  function handleSave() {
    saveSimulation(name)
    setName('')
    toast(
      name.trim()
        ? t('“{name}” saved to your library', { name: name.trim() })
        : t('Saved to your library'),
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !full) handleSave()
        }}
        placeholder={t('Simulation title')}
        className="h-9 w-48"
        aria-label={t('Title for this simulation')}
      />
      <Button size="sm" className="lume-pill px-4" onClick={handleSave} disabled={full}>
        {t('Save simulation')}
      </Button>
      {full ? (
        <span className="text-xs text-muted-foreground">
          {t('Library full ({max}) — delete one to save another.', { max: MAX_SAVED_SIMULATIONS })}
        </span>
      ) : (
        savedSims.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {t('{count} saved · find them on the home page', { count: savedSims.length })}
          </span>
        )
      )}
    </div>
  )
}
