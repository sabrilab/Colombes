/**
 * Dictionnaire français. Les clés sont les phrases anglaises telles qu'elles
 * apparaissent dans le code : une entrée manquante retombe donc sur l'anglais,
 * jamais sur une clé nue. Les jetons `{nom}` sont remplacés à l'exécution.
 */
export const FR: Record<string, string> = {
  // — Chrome —
  'Colombes — back to home': 'Colombes — retour à l’accueil',
  'Full simulator': 'Simulateur complet',
  Account: 'Identification',
  'Accounts are coming soon': 'Les comptes arrivent bientôt',
  'Until then, your saved simulations live in this browser.':
    'En attendant, vos simulations enregistrées vivent dans ce navigateur.',
  'Language: {current}': 'Langue : {current}',

  // — Navigation par sections —
  Simulate: 'Simuler',
  Understand: 'Comprendre',
  Aviary: 'Volière',
  'My runs': 'Mes calculs',
  'Six invented apps, each one an archetype you will recognise, and six real companies placed on the same scale. Open any of them to see what makes its multiple — then load it into the simulator and change your mind about something.':
    'Six apps inventées, chacune un archétype que vous reconnaîtrez, et six entreprises réelles placées sur la même échelle. Ouvrez-en une pour voir ce qui fait son multiple — puis chargez-la dans le simulateur et changez d’avis sur quelque chose.',
  'Every simulation you save lands here, with the valuation it produced. Keep two side by side to see what one assumption really costs.':
    'Chaque simulation enregistrée atterrit ici, avec la valorisation qu’elle a produite. Gardez-en deux côte à côte pour voir ce que coûte vraiment une hypothèse.',
  'Nothing saved yet. Run a simulation, name it, and it will wait for you here.':
    'Rien d’enregistré pour l’instant. Lancez une simulation, nommez-la, et elle vous attendra ici.',
  'Open the simulator': 'Ouvrir le simulateur',
  'Where are my runs stored?': 'Où sont stockés mes calculs ?',

  // — Accueil —
  'Your app, ballpark': 'Votre app, à la louche',
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
  Sections: 'Sections',
  'Billing period': 'Périodicité de facturation',
  Weekly: 'Par semaine',
  Monthly: 'Par mois',
  Yearly: 'Par an',
  '/wk': '/sem',
  '/yr': '/an',
  'What you actually keep': 'Ce que vous gardez vraiment',
  'net margin': 'de marge nette',
  'Per customer': 'Par client',
  'They also pay you': 'Il vous paie en plus',
  'They cost you': 'Il vous coûte',
  'Full subscription': 'Abonnement total',
  'The add-on brings in': 'Le supplément rapporte',
  'An add-on, a seat, a usage pack — on top of the plan.':
    'Un module, un siège, un forfait d’usage — en plus du plan.',
  'Hosting, the tokens you resell, the support you answer.':
    'L’hébergement, les jetons que vous revendez, le support que vous assurez.',
  'Team and tools': 'Équipe et outils',
  'Serving them': 'Les servir',
  'Winning them': 'Les gagner',
  'What you keep': 'Ce qui reste',
  'per month': 'par mois',
  'What you pay every month whoever shows up: you, a freelance, the tools.':
    'Ce que vous payez chaque mois quoi qu’il arrive : vous, un freelance, les outils.',
  '{mrr} of revenue: {serve} serving, {acquire} acquiring, {fixed} fixed, {profit} kept.':
    '{mrr} de revenu : {serve} de service, {acquire} d’acquisition, {fixed} de charges fixes, {profit} gardés.',
  'Billed yearly: the model halves the churn on that commitment.':
    'Facturé à l’année : le modèle divise par deux le churn sur cet engagement.',
  'Fictional companies, plausible numbers: every profile is calibrated on the simulator’s market benchmarks (Acquire.com, FE International, ChartMogul).':
    'Des entreprises fictives, des chiffres plausibles : chaque profil est calibré sur les barèmes de marché du simulateur (Acquire.com, FE International, ChartMogul).',

  // — Pad de pricing —
  Price: 'Prix',
  Customers: 'Clients',
  '/mo': '/mois',
  'Lock {label}': 'Verrouiller {label}',
  'Unlock {label}': 'Déverrouiller {label}',
  'Increase {label}': 'Augmenter {label}',
  'Decrease {label}': 'Diminuer {label}',
  'Previous tier': 'Palier précédent',
  'Next tier': 'Palier suivant',
  'Pricing tiers': 'Paliers de prix',
  'your tier': 'votre palier',
  'beyond this simulator': 'hors du simulateur',
  'Both axes are locked — unlock one to keep exploring.':
    'Les deux axes sont verrouillés — déverrouillez-en un pour continuer.',
  'Price locked at {price}: drag to see how many customers you need.':
    'Prix verrouillé à {price} : faites glisser pour voir combien de clients il vous faut.',
  'Customers locked at {customers}: drag to price them.':
    'Clients verrouillés à {customers} : faites glisser pour les tarifer.',
  '{tier} tier · ~${acv}/yr per customer. Lock an axis to explore the other.':
    'Palier {tier} · ~{acv} $/an par client. Verrouillez un axe pour explorer l’autre.',
  '${acv}/yr per customer': '{acv} $/an par client',
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
  'Apps sold to small businesses, the sweet spot for an independent team. Self-serve still works, but onboarding decides whether they stay. One person can support a few hundred customers, and the maths of a solo founder finally close here.':
    'Les apps vendues aux petites entreprises, le point d’équilibre d’une équipe indépendante. Le self-service fonctionne encore, mais c’est l’accompagnement au démarrage qui décide s’ils restent. Une personne suffit à quelques centaines de clients, et les comptes d’un fondateur solo tombent enfin juste.',
  'Mid-market. There is a sales call, a security questionnaire and an annual contract. You need a real go-to-market machine, so acquisition eats the margin long before the profit shows — and retention becomes the entire asset.':
    'Le mid-market. Il y a un rendez-vous commercial, un questionnaire de sécurité et un contrat annuel. Il faut une vraie machine commerciale, donc l’acquisition mange la marge bien avant que le profit n’apparaisse — et la rétention devient tout l’actif.',
  'Enterprise. A thousand customers is a whole company. Field sales, procurement, months of cycle and custom work: the revenue is enormous per logo, but so is the cost of winning and keeping it. Beyond this simulator’s price range.':
    'Le grand compte. Mille clients, c’est une entreprise entière. Commerciaux terrain, achats, des mois de cycle et du sur-mesure : le revenu par logo est énorme, le coût de conquête aussi. Au-delà de la plage de prix de ce simulateur.',

  // — Bento explicatif de l'accueil —
  'What this is': 'De quoi il s’agit',
  'An estimate you can argue with': 'Une estimation qu’on peut discuter',
  'Most valuation calculators hand you a number and keep the reasoning. Colombes does the opposite: every euro of the estimate is traceable back to a lever you moved, and every rule it applies is written down here rather than buried.':
    'La plupart des calculateurs vous donnent un chiffre et gardent le raisonnement. Colombes fait l’inverse : chaque euro de l’estimation remonte à un levier que vous avez bougé, et chaque règle appliquée est écrite ici plutôt qu’enfouie.',
  'What it computes': 'Ce qu’il calcule',
  'A subscription business is valued on what it keeps, not on what it bills. Colombes takes your recurring revenue, subtracts direct costs, acquisition and fixed costs, and applies a market multiple to what remains — the same arithmetic a buyer runs, made visible step by step.':
    'Une activité par abonnement se valorise sur ce qu’elle garde, pas sur ce qu’elle facture. Colombes prend votre revenu récurrent, retire les coûts directs, l’acquisition et les charges fixes, et applique un multiple de marché à ce qui reste — le calcul même que fait un acheteur, rendu visible étape par étape.',
  'That multiple is not a constant. It starts from a curve calibrated on real transactions at your revenue level, then moves with the quality of the asset: how fast customers leave, how concentrated your revenue is, how much of the company walks out of the door with you.':
    'Ce multiple n’est pas une constante. Il part d’une courbe calibrée sur des transactions réelles à votre niveau de revenu, puis bouge avec la qualité de l’actif : la vitesse à laquelle les clients partent, la concentration de votre revenu, la part de l’entreprise qui sort par la porte avec vous.',
  'pricing tiers': 'paliers de prix',
  'From mice to whales, each tier is an order of magnitude of revenue per customer — and a different trade. At €2 a month nobody may ever talk to a human; at €2,000 someone must.':
    'De la souris à la baleine, chaque palier vaut un ordre de grandeur de revenu par client — et un métier différent. À 2 € par mois, personne ne doit jamais parler à un humain ; à 2 000 €, quelqu’un le doit.',
  'lines in the multiple': 'lignes dans le multiple',
  'Churn, growth, NRR, Rule of 40, gross margin, client concentration, age, founder dependency, tech transferability. Each one is shown with its weight, in points of multiple.':
    'Churn, croissance, NRR, Rule of 40, marge brute, concentration client, ancienneté, dépendance au fondateur, transférabilité technique. Chacune est montrée avec son poids, en points de multiple.',
  'real benchmarks': 'repères réels',
  'Spotify, Netflix, Canva, Shopify, HubSpot and Salesforce, placed on the same scale as you from their published figures. They are never valued by the engine — only used to show what the scale means.':
    'Spotify, Netflix, Canva, Shopify, HubSpot et Salesforce, placés sur la même échelle que vous à partir de leurs chiffres publiés. Ils ne sont jamais valorisés par le moteur — ils servent seulement à montrer ce que l’échelle mesure.',
  'the MRR range it is built for': 'la plage de MRR visée',
  'Below that, the multiple stops meaning much: you are selling a project, not an asset. Above it, the benchmarks this tool uses no longer apply and it would be inventing.':
    'En dessous, le multiple ne veut plus dire grand-chose : vous vendez un projet, pas un actif. Au-dessus, les barèmes utilisés ici ne s’appliquent plus et l’outil inventerait.',
  'Where the numbers come from': 'D’où viennent les chiffres',
  'The market curve is calibrated on public marketplace data — Acquire.com, FE International, ChartMogul — for businesses in the range above. Health thresholds follow the usual conventions: three times on LTV to CAC, twelve months to pay acquisition back, retention at or above a hundred percent.':
    'La courbe de marché est calibrée sur des données publiques de places de marché — Acquire.com, FE International, ChartMogul — pour des activités dans la plage ci-dessus. Les seuils de santé suivent les conventions d’usage : trois fois sur le LTV rapporté au CAC, douze mois pour rembourser l’acquisition, rétention à cent pour cent ou plus.',
  'These are orders of magnitude, not quotes. A buyer with a strategic reason to want your app will pay more than any curve says; a tired seller will take less.':
    'Ce sont des ordres de grandeur, pas des cotations. Un acheteur qui a une raison stratégique de vouloir votre app paiera plus que ne le dit une courbe ; un vendeur fatigué acceptera moins.',
  'What it will not do': 'Ce qu’il ne fera pas',
  'Replace a real buyer. No comparable transactions, no due diligence, no negotiation.':
    'Remplacer un vrai acheteur. Pas de transactions comparables, pas d’audit, pas de négociation.',
  'Price an enterprise business. Past a certain price per customer the tool says so instead of guessing.':
    'Valoriser un grand compte. Au-delà d’un certain prix par client, l’outil le dit au lieu de deviner.',
  'Pretend to a precision it does not have. The range matters more than the midpoint, and both move the moment an assumption does.':
    'Prétendre à une précision qu’il n’a pas. La fourchette compte plus que le point médian, et les deux bougent dès qu’une hypothèse bouge.',

  // — Modules pédagogiques —
  'Understand what you are adjusting': 'Comprendre ce que vous réglez',
  'Four things to grasp, in order. Each one is played rather than read: move something, watch what it does, and the sentence underneath will already be obvious.':
    'Quatre choses à saisir, dans l’ordre. Chacune se joue plutôt qu’elle ne se lit : déplacez quelque chose, regardez ce que ça fait, et la phrase du dessous sera déjà évidente.',
  'Every number here comes from the same engine as the simulator: nothing is staged for the demonstration, and anything you see can be reproduced on your own figures.':
    'Tous les chiffres viennent du même moteur que le simulateur : rien n’est mis en scène pour la démonstration, et tout ce que vous voyez est reproductible sur vos propres chiffres.',
  'The belief:': 'La croyance :',
  'Understand: {title}': 'Comprendre : {title}',

  'The two levers': 'Les deux leviers',
  'Where does that number even come from?': 'D’où sort ce chiffre, au juste ?',
  'I need more customers.': '« Il me faut plus de clients. »',
  'Your revenue is a surface: price on one side, customers on the other. Doubling either doubles it — but one of the two is free.':
    'Votre revenu est une surface : le prix d’un côté, les clients de l’autre. Doubler l’un ou l’autre le double — mais l’un des deux est gratuit.',
  'Double the price': 'Doubler le prix',
  'Double the customers': 'Doubler les clients',

  'Which animal are you': 'Quel animal êtes-vous',
  'What am I, in all this?': 'Je suis quoi, moi, dans cette histoire ?',
  'My price is a packaging detail.': '« Mon prix est un détail de packaging. »',
  'Your price per customer decides your trade: who sells, who onboards, and how many customers you need. Spotify is a mouse, Salesforce is a whale.':
    'Votre prix par client décide de votre métier : qui vend, qui accompagne, et combien de clients il vous faut. Spotify est une souris, Salesforce une baleine.',
  'Your price per customer': 'Votre prix par client',

  'What actually remains': 'Ce qui reste vraiment',
  'Why is my revenue not my income?': 'Pourquoi mon chiffre d’affaires n’est pas mon revenu ?',
  'I make €12K of MRR, so I earn €12K.': '« Je fais 12 K€ de MRR, donc je gagne 12 K€. »',
  'Direct costs, acquisition and fixed costs each take their share. What a buyer pays for is the bottom of that waterfall, never the top.':
    'Les coûts directs, l’acquisition et les charges fixes prélèvent chacun leur part. Ce qu’un acheteur paie, c’est le bas de cette cascade, jamais le haut.',
  'Direct costs': 'Coûts directs',
  Acquisition: 'Acquisition',
  'What remains': 'Ce qui reste',
  'No profit, no multiple.': 'Pas de profit, pas de multiple.',

  'Solo founder': 'Fondateur solo',
  'Funded machine': 'Machine financée',
  'Agency turned app': 'Agence devenue app',
  'Solid asset': 'Actif solide',
  'Leaky asset': 'Actif qui fuit',

  'How a multiple is built': 'Comment se construit un multiple',
  'Why three times and not ten?': 'Pourquoi trois fois et pas dix ?',
  'A valuation is just an opinion.': '« Une valorisation, c’est une opinion. »',
  'The market curve gives a base multiple for your size. Nine quality lines then push it up or down — and you can name every one of them.':
    'Le barème de marché donne un multiple de base pour votre taille. Neuf lignes de qualité le poussent ensuite vers le haut ou vers le bas — et vous pouvez toutes les nommer.',

  // — Simulateur —
  Settings: 'Réglages',
  'Control panel': 'Panneau de contrôle',
  Curve: 'Barème',
  'Base multiple': 'Multiple de base',
  'Back to the curve': 'Revenir au barème',
  'Custom curve': 'Barème personnalisé',
  'Micro asset': 'Micro-actif',
  'Independent app': 'App indépendante',
  'Established app': 'App établie',
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
  'Where the giants sit on the same scale. Approximate figures from public reports — revenue and customer counts, nothing more. They are deliberately {notValued} by the simulator: its market curve is built for independent apps, and stretching it to billions would invent a number. Tap a card for the detail.':
    'Où se situent les géants sur la même échelle. Chiffres approximatifs tirés de publications officielles — revenu et nombre de clients, rien de plus. Ils ne sont délibérément {notValued} par le simulateur : son barème est fait pour des apps indépendantes, et l’étirer jusqu’aux milliards inventerait un chiffre. Touchez une carte pour le détail.',
  'not valued': 'pas valorisés',
  'Order-of-magnitude estimate from public reporting, not a company-supplied figure.':
    'Ordre de grandeur tiré de publications officielles, ce n’est pas un chiffre communiqué par l’entreprise.',
  // — Hypothèses masquées —
  expansion: 'expansion',
  margin: 'marge',
  'fixed costs': 'charges fixes',

  // — Secteurs de la volière —
  'Dev tool · API monitoring': 'Outil dev · supervision d’API',
  'Vertical app · restaurants': 'App verticale · restauration',
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
  // — Lecture en direct —
  'You are losing {loss} a month: gross margin ({margin}) does not cover acquisition ({acquisition}) plus fixed costs ({fixed}) — so a profit-based valuation collapses.':
    'Vous perdez {loss} par mois : la marge brute ({margin}) ne couvre pas l’acquisition ({acquisition}) plus les charges fixes ({fixed}) — une valorisation sur le profit s’effondre donc.',
  'Churn is the biggest drag: €100 of today’s revenue melts to {left} within a year (NRR {nrr}). Fixing retention beats any acquisition push.':
    'Le churn est le premier frein : 100 € de revenu d’aujourd’hui fondent à {left} en un an (NRR {nrr}). Réparer la rétention vaut mieux que pousser l’acquisition.',
  'MRR sits above its {ceiling} ceiling: at this churn and acquisition pace, revenue shrinks back toward it month after month.':
    'Le MRR est au-dessus de son plafond de {ceiling} : à ce rythme de churn et d’acquisition, le revenu y redescend mois après mois.',
  'You have already reached {share} of your {ceiling} MRR ceiling: growth flattens out soon unless churn drops or acquisition rises.':
    'Vous avez déjà atteint {share} de votre plafond de MRR de {ceiling} : la croissance s’aplatit bientôt, sauf à baisser le churn ou monter l’acquisition.',
  'Each new customer takes {months} months to pay back their CAC — growth burns cash long before it returns any.':
    'Chaque nouveau client met {months} mois à rembourser son CAC — la croissance brûle de la trésorerie bien avant d’en rendre.',
  'CAC payback runs {months} months: acquisition works, but it ties up cash for over a year.':
    'Le payback du CAC est de {months} mois : l’acquisition fonctionne, mais elle immobilise de la trésorerie plus d’un an.',
  'Your existing base compounds on its own: expansion outpaces churn (NRR {nrr}) — revenue grows even with zero new customers.':
    'Votre base existante compose toute seule : l’expansion dépasse le churn (NRR {nrr}) — le revenu croît même sans un seul nouveau client.',
  'Acquisition is a profitable machine: every euro of CAC returns {ratio}€ of lifetime margin, repaid in {months} months.':
    'L’acquisition est une machine rentable : chaque euro de CAC rapporte {ratio} € de marge sur la durée de vie, remboursé en {months} mois.',
  'Rule of 40 at {score}: neither growth nor profitability carries the scenario right now.':
    'Rule of 40 à {score} : ni la croissance ni la rentabilité ne portent le scénario pour l’instant.',
  'Rule of 40 at {score}: the growth-profit balance sits in the healthy zone buyers look for.':
    'Rule of 40 à {score} : l’équilibre croissance-profit est dans la zone saine que cherchent les acheteurs.',
  'A balanced scenario: {multiple} on {profit} of annual profit. Retention and margin are the levers that move the needle most.':
    'Un scénario équilibré : {multiple} sur {profit} de profit annuel. La rétention et la marge sont les leviers qui pèsent le plus.',

  // — Grille de KPI —
  'What is {label}?': 'Qu’est-ce que {label} ?',
  good: 'bon',
  watch: 'à surveiller',
  critical: 'critique',
  'organic acquisition': 'acquisition organique',
  'no ceiling: expansion outpaces churn': 'sans plafond : l’expansion dépasse le churn',
  'MRR ceiling': 'Plafond de MRR',
  'NRR (12-mo)': 'NRR (12 mois)',
  Payback: 'Payback',
  'Rule of 40': 'Rule of 40',

  // — Construction du multiple —
  Base: 'Base',
  '(custom)': '(personnalisée)',
  '(market curve)': '(barème)',
  'Adjustments clamped at {sum}': 'Cumul écrêté à {sum}',
  capped: 'ajusté',
  'Capped at the curve maximum': 'Plafonné au maximum du barème',

  // — Projection —
  'Month {n}': 'Mois {n}',
  'Ceiling {value}': 'Plafond {value}',
  'At constant churn and acquisition, MRR converges to {ceiling}. Raising that ceiling takes less churn or more acquisition.':
    'À churn et acquisition constants, le MRR converge vers {ceiling}. Relever ce plafond passe par moins de churn ou plus d’acquisition.',
  'No ceiling: expansion outpaces churn, the base compounds on its own.':
    'Pas de plafond : l’expansion dépasse le churn, la base compose toute seule.',
  'Assumption: constant acquisition pace over the whole period.':
    'Hypothèse : rythme d’acquisition constant sur toute la période.',

  // — Scénarios et bibliothèque —
  'Scenario {n}': 'Scénario {n}',
  'Name of the scenario to pin': 'Nom du scénario à épingler',
  'Up to {max} scenarios — remove one to pin another.':
    'Jusqu’à {max} scénarios — retirez-en un pour en épingler un autre.',
  'Remove scenario {name}': 'Retirer le scénario {name}',
  'vs current:': 'écart avec l’état courant :',
  'Title for this simulation': 'Titre de cette simulation',
  'Library full ({max}) — delete one to save another.':
    'Bibliothèque pleine ({max}) — supprimez-en une pour en enregistrer une autre.',
  'By default, the market curve gives {multiple} at this MRR level.':
    'Par défaut, le barème donne {multiple} à ce niveau de MRR.',
  Subscription: 'Abonnement',
  revenue: 'de revenu',
  customers: 'clients',
  // — Panneau de contrôle —
  'Blended ARPU {arpu} · {zone} zone, typical churn {min} to {max}':
    'ARPU pondéré {arpu} · zone {zone}, churn typique {min} à {max}',
  'Plan shares add up to {total}: they are normalized back to 100% for the math, each plan keeping its relative weight.':
    'Les parts totalisent {total} : elles sont ramenées à 100 % pour le calcul, chaque plan gardant son poids relatif.',
  'Optimistic churn for an ARPU of {arpu}: the {zone} zone typically runs around {min}.':
    'Hypothèse de churn optimiste pour un ARPU de {arpu} : la zone {zone} tourne plutôt autour de {min}.',
  'Marker {value} — 12-month payback': 'Repère {value} — payback de 12 mois',
  '3%/mo marker — B2B median': 'Repère 3 %/mois — médiane B2B',
  'Marker {value} — NRR at 100%': 'Repère {value} — NRR à 100 %',
  '80% marker': 'Repère 80 %',
  'Applied assumptions: {list}. Switch to Expert to adjust them.':
    'Hypothèses appliquées : {list}. Passez en Expert pour les régler.',
  'B2C / prosumer': 'B2C / prosumer',
  'Prosumer / micro-SMB': 'Prosumer / TPE',
  'SMB / B2B': 'PME / B2B',
  'B2B mid-market': 'B2B mid-market',
  // — Objectifs —
  'Your goal': 'Votre objectif',
  'Target MRR': 'MRR visé',
  Within: 'D’ici',
  '{n} months': '{n} mois',
  'Your ceiling: {value}': 'Votre plafond : {value}',
  'Already there — you are {over} past the goal.':
    'C’est déjà fait — vous dépassez l’objectif de {over}.',
  'Out of reach at these settings: your MRR converges to {ceiling}, below the {target} goal.':
    'Hors d’atteinte à ces réglages : votre MRR converge vers {ceiling}, sous l’objectif de {target}.',
  'Either bring {count} new customers a month, instead of {current}.':
    'Soit amener {count} nouveaux clients par mois, au lieu de {current}.',
  'Or bring churn down to {churn}/mo, from {current}.':
    'Soit descendre le churn à {churn}/mois, contre {current} aujourd’hui.',
  'On track: you reach {target} in month {month}, {gap} from here.':
    'Sur la trajectoire : vous atteignez {target} au mois {month}, à {gap} d’ici.',
  'Late: you reach it in month {month}, past your {horizon}-month window.':
    'En retard : vous y arrivez au mois {month}, après votre fenêtre de {horizon} mois.',
  'Not within 36 months at this pace — {gap} still to go.':
    'Pas d’ici 36 mois à ce rythme — il reste {gap} à parcourir.',
  // — Positionnement —
  'What your {app} is really worth': 'Ce que vaut vraiment votre {app}',
  'subscription app': 'app',
  'Set a price and a customer count for a first estimate, then see the levers that move the number: churn, pricing, acquisition. Built for founders between €1K and €100K of MRR — that is where the market benchmarks it uses are calibrated.':
    'Réglez un prix et un nombre de clients pour une première estimation, puis voyez les leviers qui font bouger le chiffre : churn, pricing, acquisition. Pensé pour les fondateurs entre 1 k€ et 100 k€ de MRR — c’est là que sont calibrés les barèmes de marché utilisés.',
  // — Facturation —
  Billing: 'Facturation',
  'Paid yearly': 'Payé à l’année',
  'Share of customers who pay twelve months upfront.':
    'Part des clients qui paient douze mois d’avance.',
  'Yearly discount': 'Remise annuelle',
  '17% marker — the classic “two months free”': 'Repère 17 % — le classique « deux mois offerts »',
  'Yearly plans cash in {cash} upfront and cut effective churn to {churn}/mo — a customer committed for twelve months only decides at renewal.':
    'L’annuel encaisse {cash} d’avance et ramène le churn effectif à {churn}/mois — un client engagé douze mois ne décide qu’au renouvellement.',
  'Lifetime deals / mo': 'Lifetime deals / mois',
  'Lifetime deal price': 'Prix du lifetime deal',
  'Lifetime deals bring {cash} of cash a month, and are deliberately left out of MRR, ARR and the valuation: a multiple is paid on recurring revenue, and counting one-off sales in it would inflate the number.':
    'Les lifetime deals apportent {cash} de trésorerie par mois, et restent délibérément hors du MRR, de l’ARR et de la valorisation : un multiple se paie sur du récurrent, et y compter des ventes uniques gonflerait le chiffre.',
  // — Leviers d'actif —
  Leverage: 'Leviers',
  'Audience you own': 'Audience que vous possédez',
  'Mailing list, followers, community, network — people you can reach for free.':
    'Liste mail, abonnés, communauté, réseau — les gens que vous touchez sans payer.',
  'Converts each month': 'Convertit chaque mois',
  '{owned} of your {total} new customers cost nothing to reach, so your real CAC is {blended} instead of {list}.':
    '{owned} de vos {total} nouveaux clients ne coûtent rien à atteindre : votre vrai CAC est de {blended} au lieu de {list}.',
  'An audience makes acquisition cheaper — it never makes the asset worth more on its own. A buyer pays for what transfers with the company, and your following usually does not.':
    'Une audience rend l’acquisition moins chère — elle ne rend jamais l’actif plus cher à elle seule. Un acheteur paie ce qui se transmet avec l’entreprise, et votre audience, en général, ne se transmet pas.',
  // — Banc d'essai du pad —
  'Pad variants': 'Variantes du pad',
  'Back to home': 'Retour à l’accueil',
  'Layers on:': 'Couches actives :',
  'Every variant below is fully playable — drag the dove, lock an axis. They differ only in which layers are drawn. Tell me which one reads best and it becomes the one that ships.':
    'Chaque variante ci-dessous est pleinement jouable — faites glisser la colombe, verrouillez un axe. Elles ne diffèrent que par les couches dessinées. Dites-moi laquelle se lit le mieux, elle deviendra celle du site.',
  // — Variantes du pad —
  Current: 'Actuelle',
  Instrument: 'Instrument',
  Quadrant: 'Quadrant',
  Contours: 'Contours',
  'Every layer at once: tier bands, revenue contours, the lit quadrant and its swarm. The most informative, and the busiest.':
    'Toutes les couches à la fois : bandes de paliers, courbes de revenu, quadrant éclairé et son essaim. La plus informative, et la plus chargée.',
  'Axis markers and a crosshair, nothing else. The pad reads like a measuring tool: your position is exact, but nothing tells you what a good position would be.':
    'Repères d’axes et croix de visée, rien d’autre. Le pad se lit comme un instrument de mesure : votre position est exacte, mais rien ne dit ce que serait une bonne position.',
  'Only the lit area and the swarm. The size of the glow is the whole message — bigger means bigger business. Nothing to read, everything to feel.':
    'Seulement la zone éclairée et l’essaim. La taille de la lueur est tout le message — plus grand veut dire plus gros. Rien à lire, tout à ressentir.',
  'Revenue contours, labelled. You see the €10K and €100K MRR lines and how far you sit from them — the most useful for someone chasing a number, at the cost of a busier surface.':
    'Les courbes de revenu, étiquetées. Vous voyez les lignes à 10 k€ et 100 k€ de MRR et votre distance à chacune — la plus utile quand on court après un chiffre, au prix d’une surface plus chargée.',
  'What the site ships. Tier bands and the quadrant: you always know which animal you are in and how big you have grown, without any numeric clutter.':
    'Celle du site. Bandes de paliers et quadrant : vous savez toujours dans quel animal vous êtes et jusqu’où vous avez grandi, sans aucun encombrement chiffré.',
}
