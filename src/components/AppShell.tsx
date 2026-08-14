import { lazy, Suspense } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, UserRound } from 'lucide-react'
import { AppSidebar } from '@/components/AppSidebar'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { LanguageToggle } from '@/components/LanguageToggle'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { goBack, navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

/**
 * La barre d'onglets porte GSAP et Motion — 183 ko qui n'ont rien à faire dans
 * le chemin critique. On la charge après la première peinture : elle est de
 * toute façon dessinée pour monter à l'écran avec un temps de retard.
 */
const SectionNav = lazy(() =>
  import('@/components/SectionNav').then((m) => ({ default: m.SectionNav })),
)

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
 * La coque de l'application, et deux navigations qui ne se ressemblent pas.
 *
 * **Au-delà de 1024 px** : une barre latérale repliable à gauche, comme un
 * logiciel de bureau.
 *
 * **En dessous** : pas de barre latérale du tout. Elle y était un tiroir qu'il
 * fallait ouvrir pour naviguer — donc une navigation cachée derrière un geste,
 * ce qui n'est pas une navigation. À la place, le partage que fait un téléphone
 * depuis toujours : les destinations en bas, sous le pouce ; les actions et
 * l'identité en haut, en icônes ; et un retour explicite sur les écrans de
 * détail. On ne rend même pas la latérale sur téléphone — un tiroir fermé qui
 * ne s'ouvre jamais reste du poids et un piège au clavier.
 *
 * Les deux moitiés du haut sont exclusives : le retour remplace la marque. Une
 * barre qui porterait les deux ferait hésiter entre « sortir d'ici » et
 * « rentrer à la maison », qui ne mènent pas au même endroit.
 */
export function AppShell({
  children,
  /** Écran de détail : le haut porte un retour au lieu de la marque. */
  back = false,
  /** Les onglets. Un écran de détail n'en a pas : il se referme, il ne navigue pas. */
  tabs = true,
}: {
  children: React.ReactNode
  back?: boolean
  tabs?: boolean
}) {
  const announceAccounts = useAnnounceAccounts()
  const isMobile = useIsMobile()
  const t = useT()

  return (
    <SidebarProvider>
      {!isMobile && <AppSidebar onAccount={announceAccounts} />}

      <SidebarInset>
        <header className="glass-bar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-border/60 px-2 lg:px-4">
          <SidebarTrigger className="hidden lg:inline-flex" />

          {back ? (
            /* Chevron et mot, comme partout ailleurs sur un téléphone. La cible
               déborde à gauche jusqu'au bord : c'est le coin le plus difficile
               à atteindre d'une main, il n'a pas besoin d'être précis en plus. */
            <button
              type="button"
              onClick={() => goBack()}
              className="-ml-1 inline-flex h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm font-medium text-lume transition-colors hover:text-lume/80"
            >
              <ChevronLeft className="size-5" aria-hidden />
              {t('Back')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('#/')}
              className="flex h-11 shrink-0 items-center gap-3 px-1 lg:hidden"
              aria-label={t('Colombes — back to home')}
            >
              <DoveLogo className="h-6 w-[1.9rem] text-foreground" />
              <ColombesWordmark className="h-[0.72rem] w-auto text-foreground" />
            </button>
          )}

          {/* Sur grand écran ces deux-là vivent au pied de la barre latérale :
              les répéter ici ferait deux boutons pour une même chose. */}
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={announceAccounts}
              aria-label={t('Account')}
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <UserRound className="size-5" aria-hidden />
            </button>
            <LanguageToggle />
          </div>
        </header>

        {children}

        {tabs && (
          <Suspense fallback={null}>
            <SectionNav variant="bottom" />
          </Suspense>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
