import { AppShell } from '@/components/AppShell'

export { useAnnounceAccounts } from '@/components/AppShell'

/**
 * L'enveloppe des sections : la coque commune et une colonne de lecture.
 *
 * La réserve basse est pour la barre d'onglets, qui flotte au-dessus du
 * contenu : sans elle, la dernière ligne de chaque écran passerait sous la
 * barre — le défaut classique de ce motif, et celui qu'on remarque en dernier
 * parce qu'il ne se voit qu'en bas de page.
 */
export function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 lg:px-10 lg:pb-16 lg:pt-10">
        {children}
      </main>
    </AppShell>
  )
}
