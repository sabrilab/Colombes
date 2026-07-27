/**
 * Dictionnaire français. Les clés sont les phrases anglaises telles qu'elles
 * apparaissent dans le code : une entrée manquante retombe donc sur l'anglais,
 * jamais sur une clé nue. Les jetons `{nom}` sont remplacés à l'exécution.
 */
export const FR: Record<string, string> = {
  // — Chrome —
  'Colombes — back to home': 'Colombes — retour à l’accueil',
  'Full simulator': 'Simulateur complet',
  'Sign in': 'Se connecter',
  'Sign up': 'Créer un compte',
  'Accounts are coming soon': 'Les comptes arrivent bientôt',
  'Until then, your saved simulations live in this browser.':
    'En attendant, vos simulations enregistrées vivent dans ce navigateur.',
  'Switch to French': 'Passer en français',
  'Switch to English': 'Passer en anglais',

  // — Accueil —
  'How much is a {saas} worth?': 'Combien vaut un {saas} ?',
  'Set a price and a customer count for a first estimate, explore the aviary to see what makes a great asset — then fine-tune yours in expert mode.':
    'Réglez un prix et un nombre de clients pour une première estimation, explorez la volière pour voir ce qui fait un bon actif — puis affinez le vôtre en mode expert.',
  'Your SaaS, ballpark': 'Votre SaaS, à la louche',
  'The five tiers': 'Les cinq paliers',
  Tiers: 'Paliers',
  'Estimated valuation': 'Valorisation estimée',
  'Refine in the simulator': 'Affiner dans le simulateur',
  'The aviary': 'La volière',
  'Companies you know': 'Des entreprises que vous connaissez',
  'Your simulations': 'Vos simulations',
  Valuation: 'Valorisation',
  'Median assumptions applied: churn {churn}/mo, {rest}.':
    'Hypothèses médianes appliquées : churn {churn}/mois, {rest}.',
  'Fictional companies, plausible numbers: every profile is calibrated on the simulator’s market benchmarks (Acquire.com, FE International, ChartMogul).':
    'Des entreprises fictives, des chiffres plausibles : chaque profil est calibré sur les barèmes de marché du simulateur (Acquire.com, FE International, ChartMogul).',

  // — Pad de pricing —
  Price: 'Prix',
  Customers: 'Clients',
  '/mo': '/mois',
  'Lock {label}': 'Verrouiller {label}',
  'Unlock {label}': 'Déverrouiller {label}',
  'Previous tier': 'Palier précédent',
  'Next tier': 'Palier suivant',
  'Pricing tiers': 'Paliers de prix',
  'your tier': 'votre palier',
  'Both axes are locked — unlock one to keep exploring.':
    'Les deux axes sont verrouillés — déverrouillez-en un pour continuer.',
  'Price locked at {price}: drag to see how many customers you need.':
    'Prix verrouillé à {price} : faites glisser pour voir combien de clients il vous faut.',
  'Customers locked at {customers}: drag to price them.':
    'Clients verrouillés à {customers} : faites glisser pour les tarifer.',
  '{tier} tier · ~${acv}/yr per customer. Lock an axis to explore the other.':
    'Palier {tier} · ~{acv} $/an par client. Verrouillez un axe pour explorer l’autre.',
  '${acv}/yr per customer': '{acv} $/an par client',
  '{customers} customers for $100M ARR': '{customers} clients pour 100 M$ d’ARR',
  'Per customer / year': 'Par client / an',

  // — Paliers de Janz —
  Mice: 'Souris',
  Rabbits: 'Lapins',
  Deer: 'Cerfs',
  Elephants: 'Éléphants',
  Whales: 'Baleines',
  'Consumer scale. Nobody talks to a salesperson, and nobody can afford to answer a support ticket. Everything rides on distribution — app stores, virality, an audience you already own — and on a product that explains itself in ten seconds.':
    'L’échelle grand public. Personne ne parle à un commercial, et personne ne peut se permettre de répondre à un ticket. Tout repose sur la distribution — les stores, la viralité, une audience que vous possédez déjà — et sur un produit qui s’explique en dix secondes.',
  'Prosumer self-serve. People pay with a card after a free trial, never a demo. Growth comes from content, SEO and word of mouth; the whole game is keeping churn low enough that a €15 subscription is still worth acquiring.':
    'Le self-service éclairé. On paie par carte après un essai gratuit, jamais après une démo. La croissance vient du contenu, du référencement et du bouche-à-oreille ; tout le jeu consiste à garder un churn assez bas pour qu’un abonnement à 15 € vaille encore la peine d’être acquis.',
  'Small-business SaaS, the sweet spot for a bootstrapped team. Self-serve still works, but onboarding decides whether they stay. One person can support a few hundred customers, and the maths of a solo founder finally close here.':
    'Le SaaS pour petites entreprises, le point d’équilibre d’une équipe bootstrappée. Le self-service fonctionne encore, mais c’est l’accompagnement au démarrage qui décide s’ils restent. Une personne suffit à quelques centaines de clients, et les comptes d’un fondateur solo tombent enfin juste.',
  'Mid-market. There is a sales call, a security questionnaire and an annual contract. You need a real go-to-market machine, so acquisition eats the margin long before the profit shows — and retention becomes the entire asset.':
    'Le mid-market. Il y a un rendez-vous commercial, un questionnaire de sécurité et un contrat annuel. Il faut une vraie machine commerciale, donc l’acquisition mange la marge bien avant que le profit n’apparaisse — et la rétention devient tout l’actif.',
  'Enterprise. A thousand customers is a whole company. Field sales, procurement, months of cycle and custom work: the revenue is enormous per logo, but so is the cost of winning and keeping it. Beyond this simulator’s price range.':
    'Le grand compte. Mille clients, c’est une entreprise entière. Commerciaux terrain, achats, des mois de cycle et du sur-mesure : le revenu par logo est énorme, le coût de conquête aussi. Au-delà de la plage de prix de ce simulateur.',

  // — Simulateur —
  'Pricing, retention and valuation, live': 'Pricing, rétention et valorisation, en direct',
  Settings: 'Réglages',
  'Control panel': 'Panneau de contrôle',
  Curve: 'Barème',
  'Base multiple': 'Multiple de base',
  'Back to the curve': 'Revenir au barème',
  'Custom curve': 'Barème personnalisé',
  'Micro asset': 'Micro-actif',
  'Bootstrapped SaaS': 'SaaS bootstrappé',
  'Established SaaS': 'SaaS établi',
  'Live read': 'Lecture en direct',
  Simple: 'Simple',
  Expert: 'Expert',
  'Level of detail': 'Niveau de détail',
  Pricing: 'Pricing',
  'Customers & acquisition': 'Clients et acquisition',
  Retention: 'Rétention',
  Economics: 'Économie',
  'Asset quality': 'Qualité de l’actif',
  'Add a plan': 'Ajouter un plan',
  'Remove plan {name}': 'Retirer le plan {name}',
  '{name} price': 'Prix {name}',
  '{name} share': 'Part {name}',
  'New customers / mo': 'Nouveaux clients / mois',
  'Revenue churn / mo': 'Churn de revenu / mois',
  'Expansion / mo': 'Expansion / mois',
  'Gross margin': 'Marge brute',
  'Fixed costs / mo': 'Charges fixes / mois',
  'Founder dependency': 'Dépendance au fondateur',
  'Tech transferability': 'Transférabilité technique',
  'Top client share': 'Part du plus gros client',
  Age: 'Ancienneté',
  Low: 'Faible',
  Medium: 'Moyenne',
  High: 'Élevée',
  '36-month projection': 'Projection 36 mois',
  'Multiple build-up': 'Construction du multiple',
  'Adjusted multiple': 'Multiple ajusté',
  Churn: 'Churn',
  'Monthly growth': 'Croissance mensuelle',
  'Client concentration': 'Concentration client',
  'Scenario name': 'Nom du scénario',
  'Pin this scenario': 'Épingler ce scénario',
  'Copy link': 'Copier le lien',
  Remove: 'Retirer',
  'Link copied to clipboard': 'Lien copié dans le presse-papiers',
  'Simulation title': 'Titre de la simulation',
  'Save simulation': 'Enregistrer la simulation',
  'Saved to your library': 'Enregistrée dans votre bibliothèque',
  '“{name}” saved to your library': '« {name} » enregistrée dans votre bibliothèque',
  '{count} saved · find them on the home page':
    '{count} enregistrées · retrouvez-les sur l’accueil',
  'based on {name}': 'd’après {name}',
  'Rename {name}': 'Renommer {name}',
  'Duplicate {name}': 'Dupliquer {name}',
  'Delete {name}': 'Supprimer {name}',
  'Open {name} in the simulator': 'Ouvrir {name} dans le simulateur',

  // — Profils de la volière —
  'This dove has flown away.': 'Cette colombe s’est envolée.',
  'Back to the aviary': 'Retour à la volière',
  'Why it’s worth that': 'Pourquoi elle vaut ça',
  'The three factors that weigh most on its multiple, in points.':
    'Les trois facteurs qui pèsent le plus sur son multiple, en points.',
  'Open in the simulator': 'Ouvrir dans le simulateur',
  'See another dove': 'Voir une autre colombe',
  'View {name}’s profile': 'Voir le profil de {name}',

  // — Repères —
  'Where the giants sit on the same scale. Approximate figures from public reports — revenue and customer counts, nothing more. They are deliberately {notValued} by the simulator: its market curve is built for bootstrapped SaaS, and stretching it to billions would invent a number. Tap a card for the detail.':
    'Où se situent les géants sur la même échelle. Chiffres approximatifs tirés de publications officielles — revenu et nombre de clients, rien de plus. Ils ne sont délibérément {notValued} par le simulateur : son barème est fait pour du SaaS bootstrappé, et l’étirer jusqu’aux milliards inventerait un chiffre. Touchez une carte pour le détail.',
  'not valued': 'pas valorisés',
  '{revenue} revenue · {customers} customers': '{revenue} de revenu · {customers} clients',
  'Order-of-magnitude estimate from public reporting, not a company-supplied figure.':
    'Ordre de grandeur tiré de publications officielles, ce n’est pas un chiffre communiqué par l’entreprise.',
  // — Hypothèses masquées —
  expansion: 'expansion',
  margin: 'marge',
  'fixed costs': 'charges fixes',

  // — Secteurs de la volière —
  'Dev tool · API monitoring': 'Outil dev · supervision d’API',
  'Vertical SaaS · restaurants': 'SaaS vertical · restauration',
  'B2C · fitness coaching': 'B2C · coaching fitness',
  'Creators · paid newsletters': 'Créateurs · newsletters payantes',
  'Construction · quotes & invoicing': 'BTP · devis et facturation',
  'Mid-market HR · onboarding': 'RH mid-market · onboarding',

  // — Secteurs des repères —
  'Music streaming': 'Streaming musical',
  'Video streaming': 'Streaming vidéo',
  'Design tools': 'Outils de design',
  'E-commerce platform': 'Plateforme e-commerce',
  'CRM & marketing': 'CRM et marketing',
  'Enterprise CRM': 'CRM grand compte',
}
