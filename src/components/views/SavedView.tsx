import { Button } from '@/components/ui/button'
import { useAnnounceAccounts } from '@/components/SectionShell'
import { SavedLibrary } from '@/components/home/SavedLibrary'
import { DoveLogo } from '@/components/DoveLogo'
import { navigate } from '@/lib/router'
import { useSimulator, useT } from '@/store/simulator'

/**
 * « Mes calculs » : la seule section qui donne une raison de revenir. Elle est
 * vide au premier passage — c'est justement là qu'il faut dire quoi faire, et
 * où vivent les données, plutôt que d'afficher un cadre creux.
 */
export function SavedView() {
  const savedSims = useSimulator((state) => state.savedSims)
  const announceAccounts = useAnnounceAccounts()
  const t = useT()

  return (
    <>
      <header className="max-w-2xl">
        <h1
          className="font-display reveal text-2xl font-bold uppercase tracking-tight sm:text-3xl"
          style={{ '--reveal-order': 0 } as React.CSSProperties}
        >
          {t('My runs')}
        </h1>
        <p
          className="reveal mt-3 text-sm leading-relaxed text-muted-foreground"
          style={{ '--reveal-order': 1 } as React.CSSProperties}
        >
          {t(
            'Every simulation you save lands here, with the valuation it produced. Keep two side by side to see what one assumption really costs.',
          )}
        </p>
      </header>

      {savedSims.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center">
          <DoveLogo className="w-10 text-lume/40" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('Nothing saved yet. Run a simulation, name it, and it will wait for you here.')}
          </p>
          <Button className="lume-pill px-5" onClick={() => navigate('#/simulateur')}>
            {t('Open the simulator')}
          </Button>
          <button
            type="button"
            onClick={announceAccounts}
            className="min-h-9 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {t('Where are my runs stored?')}
          </button>
        </div>
      ) : (
        <SavedLibrary />
      )}
    </>
  )
}
