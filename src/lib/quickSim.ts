import { priceZoneFor } from './engine'
import type { SimulatorInputs } from './engine/types'
import type { BillingPeriod } from './billingPeriod'
import { DEFAULT_INPUTS } from './defaults'
import { clampTo, INPUT_BOUNDS } from './inputBounds'

export interface QuickParams {
  /** Prix mensuel de l'abonnement, en euros. */
  price: number
  customers: number
}

/**
 * Le mini-simulateur de l'accueil ne demande que deux chiffres. Tout le reste
 * est déduit d'hypothèses médianes de marché — chaque déduction est bornée
 * par les jauges pour que « Affiner dans le simulateur » reparte d'un état sain.
 *
 * `period` n'est pas une unité d'affichage de plus. Facturer à l'année engage
 * le client douze mois : il ne décide qu'au renouvellement, et le moteur sait
 * déjà ce que cela vaut — `annualShare` réduit de moitié le churn effectif.
 * Choisir « à l'année » change donc la valorisation, ce qui est juste, et
 * l'écran l'annonce plutôt que de le faire discrètement.
 *
 * `annualDiscount` passe en revanche à zéro, et c'est la subtilité du réglage.
 * Dans le simulateur complet, la remise annuelle sert à modéliser un *mix* :
 * une partie des clients paie au mois au tarif affiché, l'autre s'engage à
 * l'année contre 17 % de moins. Ici il n'y a pas de mix — la personne annonce
 * un prix annuel, et ce prix est déjà celui qu'elle facture. Laisser la remise
 * courir retrancherait 17 % d'un montant dont ils ont déjà été retirés : le MRR
 * tombait de 14 500 € à 12 035 € au seul changement de cadence, ce qui se lit
 * comme un bug parce que c'en est un.
 */
/**
 * Les deux dépenses que l'accueil laisse régler.
 *
 * Tant qu'on n'y touche pas, elles restent déduites du prix et du nombre de
 * clients — c'est ce qui permet de déplacer la colombe sans que les coûts
 * deviennent absurdes. Dès qu'on en tient une, elle cesse de suivre : quelqu'un
 * qui vient de dire « je paie 2 000 € par mois » ne veut pas voir ce montant
 * bouger parce qu'il a ajouté trois clients.
 */
export interface QuickCosts {
  /** Marge brute, entre 0,5 et 0,99. Absente : déduite. */
  grossMargin?: number
  /** Coûts fixes mensuels. Absents : déduits du revenu. */
  fixedCosts?: number
}

export function quickInputs(
  { price, customers }: QuickParams,
  period: BillingPeriod = 'monthly',
  costs: QuickCosts = {},
): SimulatorInputs {
  const zone = priceZoneFor(price)
  // Milieu de la zone de churn typique pour ce niveau de prix.
  const revenueChurn = Number(((zone.churnMin + zone.churnMax) / 2).toFixed(3))

  const grossMargin = clampTo(INPUT_BOUNDS.grossMargin, costs.grossMargin ?? DEFAULT_INPUTS.grossMargin)
  // Un CAC calé sur ~8 mois de payback : ni machine à cash, ni gouffre.
  const cac = clampTo(INPUT_BOUNDS.cac, Math.round(8 * price * grossMargin))
  // Une acquisition qui renouvelle ~5 % de la base chaque mois.
  const newCustomersPerMonth = clampTo(
    INPUT_BOUNDS.newCustomersPerMonth,
    Math.max(5, Math.round(customers * 0.05)),
  )
  // Des charges fixes à ~20 % du MRR, plancher de solo-fondateur.
  const fixedCosts = clampTo(
    INPUT_BOUNDS.fixedCosts,
    costs.fixedCosts ?? Math.max(500, Math.round(price * customers * 0.2)),
  )

  return {
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Subscription', price, mix: 1 }],
    customers: clampTo(INPUT_BOUNDS.customers, customers),
    newCustomersPerMonth,
    cac,
    revenueChurn,
    expansion: 0.005,
    grossMargin,
    fixedCosts,
    topClientShare: 0.05,
    ageMonths: 24,
    annualShare: period === 'yearly' ? 1 : 0,
    annualDiscount: 0,
  }
}
