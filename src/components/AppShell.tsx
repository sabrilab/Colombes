import { toast } from 'sonner'
import { AppSidebar } from '@/components/AppSidebar'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

/** Les comptes n'existent pas encore : plutôt qu'un bouton mort ou un faux
    formulaire, on dit où vivent les données aujourd'hui. */
export function useAnnounceAccounts() {
  const t = useT()
  return () =>
    toast(t('Accounts are coming soon'), {
      description: t('Until then, your saved simulations live in this browser.'),
    })
}

/**
 * La coque de l'application : barre latérale à gauche, contenu à droite.
 *
 * Elle sert les quatre sections **et** le simulateur complet. Ce dernier avait
 * sa propre en-tête et vivait sans navigation : on y arrivait par un bouton et
 * on en repartait par le retour du navigateur. C'est l'écran où l'on reste le
 * plus longtemps, donc le dernier où il devrait falloir deviner comment sortir.
 *
 * La barre du haut est mince et ne porte qu'une chose au-delà du point de
 * rupture : la poignée qui replie la barre latérale. Au téléphone elle reprend
 * la marque, puisque la latérale y est un tiroir fermé.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const announceAccounts = useAnnounceAccounts()
  const t = useT()

  return (
    <SidebarProvider>
      <AppSidebar onAccount={announceAccounts} />

      <SidebarInset>
        <header className="glass-bar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-3 lg:px-4">
          <SidebarTrigger />

          <button
            type="button"
            onClick={() => navigate('#/')}
            className="flex shrink-0 items-center gap-3 lg:hidden"
            aria-label={t('Colombes — back to home')}
          >
            <DoveLogo className="h-6 w-[1.9rem] text-foreground" />
            <ColombesWordmark className="h-[0.72rem] w-auto text-foreground" />
          </button>
        </header>

        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
