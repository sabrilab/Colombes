import { lazy, Suspense } from 'react'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Button } from '@/components/ui/button'
import { navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

const SectionNav = lazy(() =>
  import('@/components/SectionNav').then((m) => ({ default: m.SectionNav })),
)

/**
 * La barre latérale des grands écrans.
 *
 * Les quatre sections vivaient jusqu'ici dans une rangée d'onglets au milieu
 * de l'en-tête, et cette rangée était un décalque de la barre du pouce : quatre
 * cases côte à côte, icône au-dessus du mot. Ça se lit comme une application de
 * téléphone posée dans une fenêtre, et ce n'est pas ce qu'on regarde sur un
 * écran de portable. Ici la navigation est verticale, à gauche, en pleine
 * hauteur — la forme que prend un outil qu'on ouvre à côté de son tableur.
 *
 * Le téléphone garde sa barre basse : elle est sous le pouce, et rien ne la
 * remplace. La barre latérale n'existe donc qu'au-delà du point de rupture,
 * où elle emporte aussi la marque et le bouton de compte — un en-tête qui les
 * répéterait coûterait soixante pixels de haut pour rien.
 */
export function SectionRail({ onAccount }: { onAccount: () => void }) {
  const t = useT()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-background/80 px-3 py-5 backdrop-blur-xl lg:flex"
      aria-label={t('Sections')}
    >
      <button
        type="button"
        onClick={() => navigate('#/')}
        className="mb-8 flex items-center gap-3 px-3"
        aria-label={t('Colombes — back to home')}
      >
        <DoveLogo className="h-6 w-[1.9rem] text-foreground" />
        <ColombesWordmark className="h-[0.72rem] w-auto text-foreground" />
      </button>

      <Suspense fallback={null}>
        <SectionNav variant="rail" />
      </Suspense>

      {/* Le compte et la langue tombent en bas : ce sont les deux commandes
          qu'on cherche du regard quand on ne les utilise pas, et le seul endroit
          où elles ne disputent rien au contenu. */}
      <div className="mt-auto flex items-center gap-2 px-1 pt-6">
        <Button size="sm" className="lume-pill flex-1 px-4" onClick={onAccount}>
          {t('Account')}
        </Button>
        <LanguageToggle />
      </div>
    </aside>
  )
}
