import { SectionShell } from '@/components/SectionShell'
import { LearnSection } from '@/components/learn/LearnSection'

/**
 * « Comprendre » : les modules, seuls sur leur écran. Ils tenaient sous le
 * simulateur ; ils y étaient un supplément qu'on découvrait par hasard en
 * descendant. Une section leur donne une adresse et une raison d'y aller.
 */
export function LearnView({ openGrain }: { openGrain?: string }) {
  return (
    <SectionShell>
      <LearnSection openGrain={openGrain} />
    </SectionShell>
  )
}
