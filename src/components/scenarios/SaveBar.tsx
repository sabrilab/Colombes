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
  /*
   * La ligne de contexte se saisit ici, au moment où l'on sait encore ce qu'on
   * vient de modéliser. La demander plus tard revient à ne jamais l'avoir : on
   * rouvre une bibliothèque pour comparer, pas pour documenter.
   */
  const [note, setNote] = useState('')
  const t = useT()

  const full = savedSims.length >= MAX_SAVED_SIMULATIONS

  function handleSave() {
    saveSimulation(name, note)
    setName('')
    setNote('')
    toast(
      name.trim()
        ? t('“{name}” is an egg in the nest', { name: name.trim() })
        : t('Laid in the nest'),
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
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !full) handleSave()
        }}
        placeholder={t('What is it? Who pays for it?')}
        className="h-9 w-64"
        aria-label={t('What is it? Who pays for it?')}
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
