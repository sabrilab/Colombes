import { toast } from 'sonner'
import { lazy, Suspense } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { SectionRail } from '@/components/SectionRail'
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
 * L'enveloppe commune aux quatre sections. Deux mises en page, et non une seule
 * qui s'étire :
 *
 *  — au téléphone, l'en-tête en haut et la barre au pouce en bas, inchangés ;
 *  — au-delà, une barre latérale à gauche en pleine hauteur, et plus d'en-tête
 *    du tout. Marque, sections, compte et langue y sont réunis.
 *
 * La version précédente n'avait que la première, avec les onglets recopiés au
 * milieu de l'en-tête sur grand écran : quatre cases côte à côte, icône
 * au-dessus du mot, c'est-à-dire une application de téléphone posée dans une
 * fenêtre. La réserve basse ne sert donc plus qu'à la barre flottante, et n'a
 * plus lieu d'être là où celle-ci n'existe pas.
 */
export function SectionShell({ children }: { children: React.ReactNode }) {
  const announceAccounts = useAnnounceAccounts()
  const t = useT()

  return (
    <>
      <SectionRail onAccount={announceAccounts} />

      <div className="lg:pl-64">
        <AppHeader
          className="lg:hidden"
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

        {/* Plus large qu'avant — 72 rem contre 64 — parce que la colonne de
            gauche a pris sa place et que le contenu ne la partage plus avec
            deux marges vides. */}
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      <Suspense fallback={null}>
        <SectionNav variant="bottom" />
      </Suspense>
    </>
  )
}
