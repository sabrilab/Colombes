/**
 * Des idées d'exemple, et l'état de l'application qui les contient.
 *
 * Elles ne servent qu'aux captures et aux vérifications : le nid est vide sur
 * une machine neuve, et une capture d'écran vide ne prouve rien. Elles couvrent
 * exprès les quatre cas — un œuf nu, un œuf documenté, une éclose, une
 * abandonnée — parce qu'une image ne vaut que si elle montre ce qu'on risque de
 * casser.
 */
const DAY = 86_400_000
const now = Date.now()

function inputs(price, customers) {
  return {
    tiers: [{ name: 'Subscription', price, mix: 1 }],
    customers,
    newCustomersPerMonth: Math.round(customers / 12),
    cac: price * 4,
    revenueChurn: 0.03,
    expansion: 0.006,
    grossMargin: 0.85,
    fixedCosts: 1200,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.06,
    ageMonths: 14,
    audienceSize: 0,
    audienceConversion: 0.002,
    annualShare: 0,
    annualDiscount: 0,
    ltdPerMonth: 0,
    ltdPrice: 300,
    baseMultipleOverride: null,
  }
}

const SIMS = [
  {
    id: 'a',
    name: 'Boucle',
    inputs: inputs(29, 420),
    basedOn: null,
    note: 'Un métronome pour groupes de musique. Vendu aux profs, 29 €/mois.',
    repo: 'sabrilab/colombes',
    savedAt: now - DAY,
    provenCustomers: 11,
    journal: [
      { at: now - DAY, text: 'Éclosion — 11 clients qui paient' },
      { at: now - 9 * DAY, text: 'Dépôt lié — sabrilab/colombes' },
      { at: now - 20 * DAY, text: 'Déposée dans le nid' },
    ],
  },
  {
    id: 'b',
    name: 'Rade',
    inputs: inputs(79, 140),
    basedOn: null,
    note: 'Suivi de flotte pour loueurs de bateaux.',
    repo: 'sabrilab/colombes',
    savedAt: now - 4 * DAY,
    journal: [{ at: now - 4 * DAY, text: 'Description mise à jour' }],
  },
  {
    id: 'c',
    name: 'Pigeon',
    inputs: inputs(9, 900),
    basedOn: null,
    note: 'Newsletter courte pour indépendants.',
    savedAt: now - 12 * DAY,
    journal: [{ at: now - 12 * DAY, text: 'Déposée dans le nid' }],
  },
  {
    id: 'd',
    name: 'Volute',
    inputs: inputs(149, 60),
    basedOn: null,
    savedAt: now - 30 * DAY,
    journal: [{ at: now - 30 * DAY, text: 'Déposée dans le nid' }],
  },
  {
    id: 'e',
    name: 'Ancre',
    inputs: inputs(19, 200),
    basedOn: null,
    note: 'Marque-pages partagés. Personne n’en voulait.',
    savedAt: now - 60 * DAY,
    abandonedAt: now - 60 * DAY,
    abandonReason: 'personne n’en voulait',
    journal: [{ at: now - 60 * DAY, text: 'Abandonnée — personne n’en voulait' }],
  },
]

/** La forme exacte que `zustand/persist` relit sous la clé `saas-simulator:v1`. */
export const SEED_STATE = JSON.stringify({
  state: {
    scenarios: [],
    panelMode: 'expert',
    language: 'fr',
    goal: { metric: 'mrr', target: 30000, months: 18 },
    savedSims: SIMS,
  },
  version: 0,
})

export const SEED_KEY = 'saas-simulator:v1'
