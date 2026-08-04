import { lazy, Suspense } from 'react'
import { AppShell } from '@/components/AppShell'

export { useAnnounceAccounts } from '@/components/AppShell'

/**
 * La navigation basse porte GSAP et Motion — 183 ko qui n'ont rien à faire dans
 * le chemin critique. On la charge après la première peinture : elle est de
 * toute façon dessinée pour monter à l'écran avec un temps de retard, donc son
 * absence pendant deux dixièmes de seconde fait partie du geste.
 */
const SectionNav = lazy(() =>
  import('@/components/SectionNav').then((m) => ({ default: m.SectionNav })),
)

/**
 * L'enveloppe des quatre sections : la coque commune, une colonne de lecture,
 * et la barre du pouce au téléphone.
 *
 * Cette barre basse reste, et elle n'est pas une redite de la latérale : sur un
 * téléphone la latérale est un tiroir fermé, et une navigation qu'il faut ouvrir
 * n'est pas une navigation. La réserve basse existe pour elle, et disparaît là
 * où elle n'existe pas.
 */
export function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 lg:px-10 lg:pb-16 lg:pt-10">
        {children}
      </main>

      <Suspense fallback={null}>
        <SectionNav variant="bottom" />
      </Suspense>
    </AppShell>
  )
}
