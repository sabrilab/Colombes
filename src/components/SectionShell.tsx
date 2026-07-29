import { toast } from 'sonner'
import { lazy, Suspense } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { useT } from '@/store/simulator'

/**
 * La navigation porte GSAP et Motion — 183 ko qui n'ont rien à faire dans le
 * chemin critique. On la charge après la première peinture : la barre basse
 * est de toute façon dessinée pour monter à l'écran avec un temps de retard,
 * donc son absence pendant deux dixièmes de seconde fait partie du geste.
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
 * L'enveloppe commune aux quatre sections : en-tête, contenu, navigation.
 *
 * La réserve basse est là pour la barre flottante, qui recouvrirait sinon la
 * fin du contenu — un pied de page à demi lisible est le défaut classique de
 * ce motif.
 */
export function SectionShell({ children }: { children: React.ReactNode }) {
  const announceAccounts = useAnnounceAccounts()
  const t = useT()

  return (
    <>
      <AppHeader
        nav={
          <Suspense fallback={null}>
            <SectionNav variant="inline" />
          </Suspense>
        }
        /* Un seul bouton : sur un téléphone, « se connecter » et « créer un
           compte » côte à côte poussaient l'en-tête au-delà de sa largeur, pour
           deux portes qui mènent au même endroit tant que les comptes n'existent
           pas. */
        actions={
          <Button size="sm" className="lume-pill px-4" onClick={announceAccounts}>
            {t('Account')}
          </Button>
        }
      />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 lg:px-6 lg:pb-16 lg:pt-12">{children}</main>
      <Suspense fallback={null}>
        <SectionNav variant="bottom" />
      </Suspense>
    </>
  )
}
