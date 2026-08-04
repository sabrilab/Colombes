/**
 * La cadence de facturation : à la semaine, au mois, à l'année.
 *
 * Le moteur ne connaît qu'une unité, le mois — le churn est mensuel, le MRR
 * est mensuel, la courbe de multiples est indexée sur le MRR. Laisser une
 * cadence circuler dans le modèle reviendrait à multiplier les endroits où
 * l'on peut se tromper de douze. La règle est donc stricte : **le modèle
 * stocke un prix mensuel**, et la cadence ne sert qu'à l'entrée et à
 * l'affichage.
 *
 * Une exception, et elle est réelle : facturer à l'année n'est pas seulement
 * écrire le prix autrement. Un client engagé douze mois ne décide qu'au
 * renouvellement, et le moteur le sait déjà — `annualShare` et
 * `ANNUAL_CHURN_RELIEF`. Choisir « à l'année » dans le mini-simulateur pose
 * donc `annualShare` à 1, ce que l'écran dit à voix haute plutôt que de le
 * faire dans le dos.
 */

export type BillingPeriod = 'weekly' | 'monthly' | 'yearly'

/**
 * Combien de fois on facture par mois, dans chaque cadence.
 *
 * 52/12 et non 4 : une année compte cinquante-deux semaines, pas quarante-huit.
 * L'écart est de 8,3 %, ce qui est exactement le genre d'erreur qui ne se voit
 * pas à l'écran et fausse une valorisation.
 */
export const PERIODS_PER_MONTH: Record<BillingPeriod, number> = {
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
}

export interface BillingPeriodOption {
  id: BillingPeriod
  /** Libellé du sélecteur. */
  label: string
  /** Suffixe collé au prix : « /wk », « /mo », « /yr ». */
  unit: string
}

export const BILLING_PERIODS: BillingPeriodOption[] = [
  { id: 'weekly', label: 'Weekly', unit: '/wk' },
  { id: 'monthly', label: 'Monthly', unit: '/mo' },
  { id: 'yearly', label: 'Yearly', unit: '/yr' },
]

export function billingPeriodOption(period: BillingPeriod): BillingPeriodOption {
  return BILLING_PERIODS.find((option) => option.id === period) ?? BILLING_PERIODS[1]
}

/** Le prix à afficher dans sa cadence, à partir du prix mensuel du modèle. */
export function fromMonthly(monthlyPrice: number, period: BillingPeriod): number {
  return monthlyPrice / PERIODS_PER_MONTH[period]
}

/** Le prix mensuel du modèle, à partir d'un prix exprimé dans sa cadence. */
export function toMonthly(price: number, period: BillingPeriod): number {
  return price * PERIODS_PER_MONTH[period]
}
