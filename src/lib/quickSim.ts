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
/**
 * Ce qui s'ajoute au prix de base, par client et par mois.
 *
 * Trois montants, tous mensuels comme le prix — la cadence choisie à l'écran ne
 * sert qu'à la saisie et à l'affichage. Aucun n'est un pourcentage : personne ne
 * sait dire « mon service me coûte quinze pour cent », tout le monde sait dire
 * « ce client me paie six euros de plus » ou « il me coûte deux euros
 * d'inférence ». Les conversions vers ce que le moteur lit — un prix de plan et
 * une marge brute — se font ici, une fois.
 */
export interface QuickExtras {
  /**
   * Le supplément que chaque client paie en plus de l'abonnement : un module,
   * un siège, un forfait d'usage. Il s'additionne au prix, donc il déplace
   * l'abonnement total et le palier où l'on se situe.
   */
  addOnPerCustomer?: number
  /** Ce qu'un client coûte à servir, en euros par mois. Absent : déduit. */
  costPerCustomer?: number
  /** Coûts fixes mensuels. Absents : déduits du revenu. */
  fixedCosts?: number
}

/** Ce qu'un client coûte quand on ne l'a pas encore dit : la marge par défaut. */
export function defaultCostPerCustomer(monthlyPrice: number): number {
  return monthlyPrice * (1 - DEFAULT_INPUTS.grossMargin)
}

export function quickInputs(
  { price, customers }: QuickParams,
  period: BillingPeriod = 'monthly',
  extras: QuickExtras = {},
): SimulatorInputs {
  /*
   * L'abonnement total : le prix du plan plus le supplément. C'est lui qui
   * gouverne tout le reste — la zone de churn, le coût d'acquisition, le palier
   * animal — parce que ce qu'un client rapporte ne se divise pas en deux
   * lignes une fois qu'il a payé.
   */
  const total = price + (extras.addOnPerCustomer ?? 0)
  const zone = priceZoneFor(total)
  // Milieu de la zone de churn typique pour ce niveau de prix.
  const revenueChurn = Number(((zone.churnMin + zone.churnMax) / 2).toFixed(3))

  /*
   * Le coût par client devient une marge brute, parce que c'est ce que le moteur
   * sait lire. Un prix nul n'a pas de marge définie — on retombe alors sur la
   * valeur par défaut plutôt que de diviser par zéro.
   */
  const costPerCustomer = extras.costPerCustomer ?? defaultCostPerCustomer(total)
  const grossMargin =
    total > 0
      ? clampTo(INPUT_BOUNDS.grossMargin, 1 - costPerCustomer / total)
      : DEFAULT_INPUTS.grossMargin
  // Un CAC calé sur ~8 mois de payback : ni machine à cash, ni gouffre.
  const cac = clampTo(INPUT_BOUNDS.cac, Math.round(8 * total * grossMargin))
  // Une acquisition qui renouvelle ~5 % de la base chaque mois.
  const newCustomersPerMonth = clampTo(
    INPUT_BOUNDS.newCustomersPerMonth,
    Math.max(5, Math.round(customers * 0.05)),
  )
  // Des charges fixes à ~20 % du MRR, plancher de solo-fondateur.
  const fixedCosts = clampTo(
    INPUT_BOUNDS.fixedCosts,
    extras.fixedCosts ?? Math.max(500, Math.round(total * customers * 0.2)),
  )

  return {
    ...DEFAULT_INPUTS,
    // Un seul plan, au prix total : le moteur n'a pas à connaître la
    // décomposition, seulement ce que le client paie chaque mois.
    tiers: [{ name: 'Subscription', price: total, mix: 1 }],
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
