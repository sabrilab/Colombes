import type { SimulatorInputs } from './engine/types'
import { formatCurrency, formatPercent } from './format'

/**
 * Le mode Simple masque une partie des réglages sans les neutraliser.
 * Cette ligne dit lesquels, pour que le simulateur reste honnête.
 */
export function describeHiddenAssumptions(
  inputs: SimulatorInputs,
  t: (text: string) => string = (text) => text,
  /**
   * Les postes que l'écran affiche déjà par ailleurs. L'accueil règle désormais
   * la marge et les coûts fixes au curseur : les répéter dans la ligne des
   * hypothèses masquées les ferait passer pour subis alors qu'ils sont tenus.
   */
  shown: ReadonlyArray<'margin' | 'fixedCosts'> = [],
): string {
  return [
    `CAC ${formatCurrency(inputs.cac)}`,
    `${t('expansion')} ${formatPercent(inputs.expansion)}${t('/mo')}`,
    shown.includes('margin') ? null : `${t('margin')} ${formatPercent(inputs.grossMargin, 0)}`,
    shown.includes('fixedCosts')
      ? null
      : `${t('fixed costs')} ${formatCurrency(inputs.fixedCosts)}${t('/mo')}`,
  ]
    .filter((part): part is string => part !== null)
    .join(', ')
}
