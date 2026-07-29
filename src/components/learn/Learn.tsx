import { HelpCircle } from 'lucide-react'
import { grainById, type GrainId } from '@/lib/learn'
import { navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

/**
 * La porte froide vers un grain : un lien discret, posé en fin de section —
 * on l'ouvre quand on vient de buter, pas avant d'avoir essayé.
 *
 * Règle de la bible : **une seule par notion et par écran**. Un panneau
 * constellé de points d'interrogation dit « c'est compliqué », ce qui est
 * l'inverse du but. D'où le placement en pied de section plutôt que contre
 * chaque libellé.
 */
export function Learn({ grain }: { grain: GrainId }) {
  const entry = grainById(grain)
  const t = useT()
  if (!entry) return null

  return (
    <button
      type="button"
      onClick={() => navigate(`#/apprendre/${grain}`)}
      className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-md text-xs text-muted-foreground/70 transition-colors hover:text-lume focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <HelpCircle className="size-3.5 shrink-0" aria-hidden />
      {t('Understand: {title}', { title: t(entry.title) })}
    </button>
  )
}
