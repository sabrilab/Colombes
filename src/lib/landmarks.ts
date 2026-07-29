import { animalFor, type PricingAnimal } from './pricePad'

/**
 * Des entreprises que tout le monde connaît, placées sur l'échelle de Janz.
 *
 * Elles ne passent PAS par le moteur de valorisation : son barème est
 * calibré sur du micro-SaaS bootstrappé (ancres jusqu'à ~10 M€ d'ARR), et
 * l'appliquer à des milliards produirait un chiffre inventé. On ne montre
 * donc que ce qui est public et vérifiable — revenu, clients — et le
 * revenu par client qu'on en déduit, qui suffit à situer le palier.
 *
 * Les chiffres sont des ordres de grandeur tirés de publications
 * officielles ; chaque fiche porte son exercice et sa base de calcul.
 */

export interface Landmark {
  id: string
  name: string
  /** Lettrine de la pastille : on ne redistribue pas les logos des marques. */
  initial: string
  /** Couleur d'identification, en hexadécimal. */
  color: string
  sector: string
  /** Revenu annuel retenu, en dollars. */
  annualRevenue: number
  /** Clients ou abonnés payants retenus. */
  customers: number
  /** Exercice de référence. */
  period: string
  /** Ce que recouvrent exactement les deux chiffres ci-dessus. */
  basis: string
  /** La leçon que ce repère donne au fondateur. */
  lesson: string
}

export const LANDMARKS: Landmark[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    initial: 'S',
    color: '#1DB954',
    sector: 'Music streaming',
    annualRevenue: 15_700_000_000,
    customers: 675_000_000,
    period: 'FY2024',
    basis:
      'Total revenue — subscriptions and advertising — divided by monthly active users. The freemium lens: what the whole audience is worth, not what a paying subscriber pays.',
    lesson:
      'About $2 a month per user. Seen through its entire audience, the biggest audio company on earth is a mouse: one support ticket would cost more than the user, so nothing may be manual — and it takes hundreds of millions of them.',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    initial: 'N',
    color: '#E50914',
    sector: 'Video streaming',
    annualRevenue: 39_000_000_000,
    customers: 302_000_000,
    period: 'FY2024',
    basis: 'Total revenue divided by paid memberships at year end.',
    lesson:
      'About $11 a month. The most valuable subscription business on earth sits in the same tier as a €10 indie tool — the difference is three hundred million customers, not the price tag.',
  },
  {
    id: 'canva',
    name: 'Canva',
    initial: 'C',
    color: '#00C4CC',
    sector: 'Design tools',
    annualRevenue: 3_000_000_000,
    customers: 25_000_000,
    period: '2025, company-announced ARR',
    basis: 'Announced annualised revenue divided by stated paying subscribers.',
    lesson:
      'Roughly $10 a month, sold to individuals and teams without a sales call. Self-serve at this price only works when the free product does the selling.',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    initial: 'S',
    color: '#95BF47',
    sector: 'E-commerce platform',
    annualRevenue: 2_350_000_000,
    customers: 2_600_000,
    period: 'FY2024',
    basis: 'Subscription solutions revenue only, divided by estimated active merchants.',
    lesson:
      'About $75 a month in subscription — the classic small-business tier. Note that Shopify makes far more on payments than on the subscription itself: the plan is the door, not the business.',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    initial: 'H',
    color: '#FF7A59',
    sector: 'CRM & marketing',
    annualRevenue: 2_630_000_000,
    customers: 248_000,
    period: 'FY2024',
    basis: 'Total revenue divided by total customers reported at year end.',
    lesson:
      'Around $10,000 a year per customer. At this level there is a salesperson, an onboarding and a renewal conversation — and the cost of that machine is why mid-market SaaS rarely looks profitable early.',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    initial: 'S',
    color: '#00A1E0',
    sector: 'Enterprise CRM',
    annualRevenue: 34_900_000_000,
    customers: 150_000,
    period: 'FY2024',
    basis: 'Total revenue divided by a widely cited customer count; contract sizes vary enormously.',
    lesson:
      'Hundreds of thousands of dollars per customer per year. A thousand logos would be a large company on their own — this is what the whale tier really means.',
  },
]

/** Revenu annuel par client, en dollars. */
export function landmarkAcv(company: Pick<Landmark, 'annualRevenue' | 'customers'>): number {
  return company.annualRevenue / company.customers
}

/** Palier de Janz du repère, déduit de son prix mensuel par client. */
export function landmarkTier(
  company: Pick<Landmark, 'annualRevenue' | 'customers'>,
): PricingAnimal {
  return animalFor(landmarkAcv(company) / 12)
}

/**
 * Les repères d'un palier. C'est le raccourci qui rend l'échelle concrète :
 * « lapin » ne dit rien, « le palier de Netflix » se comprend tout de suite.
 * L'ordre suit celui de LANDMARKS, stable d'un rendu à l'autre.
 */
export function landmarksForTier(animal: PricingAnimal): Landmark[] {
  return LANDMARKS.filter((company) => landmarkTier(company).name === animal.name)
}
