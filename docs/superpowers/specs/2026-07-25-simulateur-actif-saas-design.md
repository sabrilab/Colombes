# Simulateur d'actif SaaS — design

Date : 2026-07-25
Statut : validé (design), en attente de relecture de la spec

## 1. Objectif

Une application web mono-écran qui permet de simuler la valeur d'un actif SaaS à partir de
son pricing, de sa base clients et de sa rétention. L'utilisateur manipule des jauges ;
la valorisation, les unit economics et la projection de MRR se recalculent en direct.

La théorie de référence est *The SaaS Playbook* de Rob Walling. Deux idées structurent
l'application :

- **Le churn est le plafond.** Avec un churn constant, le MRR converge vers une asymptote.
  L'application rend ce plafond visible plutôt que de le laisser implicite.
- **Le prix est le levier le plus sous-utilisé.** Le MRR n'est pas une saisie : il est dérivé
  du pricing et du nombre de clients, pour que l'effet d'une hausse de prix soit tangible.

### Ce que l'application n'est pas

- Pas un outil de vérification de revenus (pas de connexion Stripe). C'est un simulateur.
- Pas un DCF. Aucune actualisation de flux, aucun WACC.
- Pas un backend. Tout le calcul est en front, hors-ligne, sans appel réseau.

## 2. Principes de conception

1. **Boucle immédiate.** Aucun bouton « Calculer ». Toute modification recalcule tout.
2. **Continuité.** Chaque courbe d'ajustement est linéaire par morceaux et continue : faire
   glisser une jauge ne doit jamais provoquer de saut de valorisation. C'est une contrainte
   dure du moteur, pas une préférence esthétique.
3. **Rien de magique.** Tout multiple affiché est décomposé en lignes. Tout seuil de santé est
   consultable.
4. **Fourchette, pas point.** La valorisation s'affiche toujours en fourchette.
5. **Moteur isolé.** Le calcul est du TypeScript pur, sans dépendance React, testé unitairement.

## 3. Entrées

Toutes les entrées vivent dans un unique objet `SimulatorInputs`. Sauf mention contraire,
chaque entrée est une jauge (`Slider` shadcn).

### 3.1 Pricing

Trois plans configurables. Pour chaque plan `i` : un nom, un prix mensuel `price_i`, une part
du mix `mix_i`.

- `price_i` : 0 à 500 €, pas de 1 €
- `mix_i` : 0 à 100 %

Les parts sont normalisées à l'affichage et au calcul : `mix_i_norm = mix_i / Σ mix`. Si
`Σ mix = 0`, l'ARPU vaut 0 et l'application affiche l'état vide décrit en 7.6. Un plan à
`mix_i = 0` reste configurable mais ne contribue pas.

Valeurs par défaut : Starter 9 € / 40 %, Pro 29 € / 50 %, Scale 79 € / 10 %.

### 3.2 Clients et acquisition

- `customers` : nombre de clients actuels, 0 à 20 000, échelle logarithmique
- `newCustomersPerMonth` : nouveaux clients par mois, 0 à 1 000, échelle logarithmique
- `cac` : coût d'acquisition par client, 0 à 2 000 €, échelle linéaire

L'échelle logarithmique est nécessaire : une jauge linéaire jusqu'à 20 000 rend impossible le
réglage fin en dessous de 500 clients, qui est la zone la plus fréquente.

Le logarithme n'étant pas défini en 0, la jauge travaille sur une position entière `p ∈ [0, 240]`
et la valeur est reconstruite ainsi :

```
value(p) = p === 0 ? 0 : round(min × (max / min)^((p − 1) / 239))
```

avec `min = 1`. La position 0 vaut donc exactement 0, et les positions 1 à 240 couvrent
`[1, max]` géométriquement. L'arrondi entier crée des positions successives de même valeur dans
le bas de l'échelle ; c'est sans conséquence, la jauge restant pilotée par sa position.

### 3.3 Rétention

- `revenueChurn` : churn de revenu mensuel brut, 0 à 15 %, pas de 0,1 %
- `expansion` : revenu d'expansion mensuel, 0 à 10 %, pas de 0,1 %

Le churn est exprimé **en revenu**, pas en logos, pour rester cohérent avec le NRR et la
projection. Le libellé de la jauge le précise.

### 3.4 Économie

- `grossMargin` : marge brute, 50 à 99 %
- `fixedCosts` : charges fixes mensuelles hors acquisition (hébergement, outils, sous-traitance,
  salaires hors fondateur), 0 à 100 000 €

### 3.5 Qualité de l'actif

Ces entrées sont des jugements, pas des quantités mesurées. Elles utilisent des `ToggleGroup`
segmentés, sauf la concentration qui reste une jauge.

- `founderDependency` : `low` | `medium` | `high`
- `techTransferability` : `low` | `medium` | `high` — stack standard et documentée, ou artisanale
- `topClientShare` : part du MRR portée par le plus gros client, 0 à 60 %
- `ageMonths` : ancienneté de l'activité, 0 à 96 mois

### 3.6 Surcharge de barème

- `baseMultipleOverride` : `number | null`, 0,5 à 15×

`null` signifie « suivre la courbe du §4.6 ». Cette entrée n'a pas de jauge dans le panneau de
contrôle : elle se règle depuis la carte de valorisation (voir §5.4). Elle appartient malgré tout
à `SimulatorInputs`, et se trouve donc versionnée, épinglée dans les scénarios et partagée dans
l'URL comme le reste.

## 4. Moteur de calcul

Ordre de calcul strict. Chaque étape ne dépend que des précédentes.

### 4.1 Revenu

```
arpu   = Σ (price_i × mix_i_norm)
mrr    = customers × arpu
arr    = mrr × 12
newMrr = newCustomersPerMonth × arpu
```

### 4.2 Compte de résultat mensuel

```
variableCost   = mrr × (1 − grossMargin)
acquisitionCost = newCustomersPerMonth × cac
sdeMonthly     = mrr − variableCost − acquisitionCost − fixedCosts
sdeAnnual      = sdeMonthly × 12
netMargin      = mrr > 0 ? sdeMonthly / mrr : 0
```

`sdeMonthly` peut être négatif. Ce n'est pas une erreur : c'est un actif déficitaire, et
l'application doit le dire (voir 4.6).

### 4.3 Unit economics

```
ltv        = revenueChurn > 0 ? (arpu × grossMargin) / revenueChurn : null
ltvCacRatio = (ltv !== null && cac > 0) ? ltv / cac : null
paybackMonths = (arpu × grossMargin) > 0 ? cac / (arpu × grossMargin) : null
nrr        = 1 − revenueChurn + expansion
```

La LTV utilise le **churn brut**, sans retrancher l'expansion. C'est la convention
conservatrice standard, et elle évite une LTV infinie quand la rétention nette est négative.

`null` signifie « non défini », pas zéro. L'interface affiche `—` et une infobulle expliquant
pourquoi, jamais une valeur inventée.

### 4.4 Croissance et plafond

```
netChurn     = revenueChurn − expansion
mrrCeiling   = netChurn > 0 ? newMrr / netChurn : null
growthMoM    = mrr > 0 ? (newMrr − mrr × netChurn) / mrr : 0
growthAnnual = (1 + growthMoM)^12 − 1
ruleOf40     = growthAnnual × 100 + netMargin × 100
```

`mrrCeiling = null` correspond à une rétention nette négative : il n'y a pas de plafond.
L'interface l'indique explicitement au lieu d'afficher l'infini.

`growthMoM` est le taux instantané au mois 0, cohérent avec le premier pas de la projection.

### 4.5 Projection

Récurrence sur 36 mois, `mrr_0 = mrr` :

```
mrr_{n+1} = mrr_n × (1 − revenueChurn + expansion) + newMrr
```

`newMrr` est constant : l'hypothèse est un rythme d'acquisition stable. C'est délibérément
conservateur et c'est écrit sous le graphique.

La série est bornée à `0` par le bas.

### 4.6 Valorisation

Aucun seuil de cette section ne produit de discontinuité. C'est une contrainte critique ici :
l'utilisateur traverse les paliers de taille en faisant glisser une jauge, et un saut de
valorisation détruirait la crédibilité de l'outil. Les paliers existent donc comme **libellés**,
jamais comme branchements de calcul.

**Deux bases, mélangées progressivement.** Les petits actifs se négocient sur le profit (SDE) ;
les gros sur le revenu (ARR). Plutôt que de basculer d'une base à l'autre, on calcule les deux
et on les mélange :

```
w = smoothstep(60 000, 140 000, mrr)      // 0 en dessous de 60 k€, 1 au-dessus de 140 k€
valuation = (1 − w) × valuationSde + w × valuationArr
```

`smoothstep(a, b, x)` vaut 0 pour `x ≤ a`, 1 pour `x ≥ b`, et `3t² − 2t³` avec
`t = (x − a) / (b − a)` entre les deux. Sa dérivée est nulle aux deux bornes : la transition est
lisse, sans coude visible.

Le seuil est volontairement haut. Un SaaS bootstrappé et rentable continue de se valoriser au
SDE bien au-delà du million d'ARR ; la bascule sur le revenu concerne les actifs assez gros pour
intéresser un acquéreur financier.

**Multiples de base, continus.** Chaque base a sa propre courbe, interpolée linéairement sur
`log(MRR)` — c'est l'échelle sur laquelle le marché raisonne, un actif à 2 k€ étant plus proche
d'un actif à 4 k€ que d'un actif à 500 €.

| MRR | Multiple SDE | | ARR | Multiple ARR |
|---|---|---|---|---|
| 500 € | 2,2× | | 600 k€ | 2,6× |
| 2 000 € | 2,6× | | 1,2 M€ | 3,0× |
| 5 000 € | 2,9× | | 3 M€ | 3,6× |
| 15 000 € | 3,3× | | 10 M€ | 4,5× |
| 50 000 € | 3,8× | | | |
| 150 000 € | 4,3× | | | |

Ces valeurs correspondent aux transactions réellement observées sur les places de marché
spécialisées et chez les brokers, après la compression des multiples de 2022. Un micro-SaaS à
3 k€ de MRR qui se vend 2,7× son profit annuel est un résultat normal, pas un échec.

**Ajustements, en pourcentage de la base.** Chaque critère produit un delta exprimé en
**pourcentage du multiple de base**, et non en points de multiple. C'est ce qui permet au même
barème de s'appliquer cohéremment aux deux bases, dont les ordres de grandeur diffèrent.
L'interpolation est linéaire par morceaux entre points d'ancrage, écrêtée aux ancrages extrêmes.

| Critère | Ancrages (valeur → delta) |
|---|---|
| `revenueChurn` | 0 % → +20 % · 2 % → +12 % · 3 % → +5 % · 5 % → 0 · 8 % → −15 % · 15 % → −30 % |
| `growthMoM` | 0 % → −10 % · 2 % → 0 · 5 % → +12 % · 10 % → +22 % · 20 % → +35 % |
| `nrr` | 80 % → −12 % · 95 % → −4 % · 100 % → 0 · 110 % → +11 % · 130 % → +22 % |
| `ruleOf40` | 0 → −9 % · 20 → −4 % · 40 → +4 % · 60 → +10 % · 100 → +17 % |
| `grossMargin` | 50 % → −12 % · 70 % → −5 % · 80 % → 0 · 90 % → +6 % |
| `topClientShare` | 0 % → +3 % · 10 % → 0 · 25 % → −9 % · 50 % → −20 % |
| `ageMonths` | 0 → −12 % · 12 → −5 % · 24 → 0 · 48 → +6 % |
| `founderDependency` | low → +6 % · medium → 0 · high → −12 % |
| `techTransferability` | low → −7 % · medium → 0 · high → +4 % |

Les deux derniers critères sont discrets par nature ; la contrainte de continuité ne s'y applique
pas puisqu'ils ne sont pas pilotés par une jauge.

**Écrêtage et résultat.** Le cumul est borné avant application, puis le multiple final est borné
en absolu :

```
adj        = clamp(Σ deltas, −0,60, +0,90)
multiple   = clamp(baseMultiple × (1 + adj), 1,0, 10,0)
```

L'écrêtage du cumul empêche qu'un empilement d'hypothèses toutes optimistes produise un multiple
que le marché ne pratique pas. Quand l'un des deux écrêtages s'applique, l'interface l'indique en
dernière ligne de la décomposition.

**Réconciliation de l'affichage.** La décomposition présente des points de multiple, pas des
pourcentages, parce que « +0,42× » se lit mieux que « +11 % ». La conversion est exacte : la
ligne du critère `i` affiche `baseMultiple × delta_i`, et
`baseMultiple + Σ(baseMultiple × delta_i) = baseMultiple × (1 + Σ delta_i)`. Le total affiché
égale donc toujours le multiple calculé, hors écrêtage — qui est justement matérialisé par sa
propre ligne.

**Montants.**

```
valuationSde = max(0, multiple × sdeAnnual)
valuationArr = multiple × arr
valuation    = (1 − w) × valuationSde + w × valuationArr
low          = valuation × 0,85
high         = valuation × 1,15
```

Le `max(0, …)` sur la composante SDE traite le cas déficitaire : un actif qui perd de l'argent ne
vaut pas un montant négatif, sa valeur de rendement est simplement nulle. Si `sdeAnnual ≤ 0` et
`w = 0`, la valorisation vaut 0 et l'interface affiche « actif déficitaire — pas de valorisation
sur le profit » plutôt qu'un zéro sec, en indiquant les deux leviers concernés (CAC, charges
fixes). Une valorisation négative ne doit jamais s'afficher.

**Libellés de profil.** Purement cosmétiques, affichés en badge sur la carte de valorisation :
`micro` sous 5 k€ de MRR, `bootstrappé` de 5 k€ à 100 k€, `établi` au-delà. Ils ne participent à
aucun calcul.

## 5. Repères de marché et garde-fous

### 5.1 Seuils de santé

Chaque KPI porte un badge vert / ambre / rouge. Le seuil est visible au survol.

| Indicateur | Vert | Ambre | Rouge |
|---|---|---|---|
| Churn de revenu mensuel | ≤ 3 % | 3–5 % | > 5 % |
| LTV:CAC | ≥ 3 | 1,5–3 | < 1,5 |
| Payback CAC | ≤ 12 mois | 12–18 | > 18 |
| NRR | ≥ 100 % | 90–100 % | < 90 % |
| Rule of 40 | ≥ 40 | 20–40 | < 20 |
| Marge brute | ≥ 80 % | 70–80 % | < 70 % |

### 5.2 Repères sur les rails

Quatre jauges portent un tick de repère sur leur rail, avec sa légende dessous. Deux repères
sont fixes, deux sont calculés à partir de l'état courant :

| Jauge | Repère | Nature |
|---|---|---|
| `revenueChurn` | 3 %/mois — médiane B2B | fixe |
| `grossMargin` | 80 % | fixe |
| `cac` | `12 × arpu × grossMargin` — le CAC qui donne un payback de 12 mois | calculé |
| `expansion` | `revenueChurn` — l'expansion qui porte le NRR à 100 % | calculé |

Les deux repères calculés se déplacent quand d'autres jauges bougent. C'est voulu : ils
répondent à « où est la limite *pour moi* », pas « quelle est la moyenne du marché ». Un repère
calculé qui sort de la plage de sa jauge est masqué plutôt qu'écrêté au bord, un tick collé à
l'extrémité étant trompeur.

### 5.3 Zone de prix

L'ARPU détermine une zone de marché et une plage de churn plausible :

| ARPU | Zone | Churn mensuel typique |
|---|---|---|
| < 15 € | B2C / prosumer | 5–8 % |
| 15–50 € | Prosumer / TPE | 3–5 % |
| 50–200 € | PME / B2B | 2–3 % |
| > 200 € | B2B mid-market | 1–2 % |

Si `revenueChurn` est inférieur à la borne basse de la plage correspondante, l'application
affiche une alerte non bloquante : « hypothèse de churn optimiste pour un ARPU de X € ». C'est
un signal, pas une contrainte : l'utilisateur peut avoir raison, et rien n'est verrouillé.

### 5.4 Barème ajustable

Les barèmes du §4.6 sont un point de vue sur le marché, pas une vérité. Deux niveaux de
modification, selon l'engagement :

**Dans l'application.** La carte de valorisation porte un bouton discret « Barème » qui ouvre un
`Popover` contenant une seule commande : le **multiple de base**, pré-rempli avec la valeur issue
de la courbe et surchargeable. Un état surchargé est signalé sur la carte par un badge « barème
personnalisé » et un bouton de réinitialisation. La surcharge est persistée avec les scénarios et
fait partie de `SimulatorInputs`.

Une seule commande, et pas un éditeur de toutes les courbes d'ajustement : le multiple de base est
le seul chiffre dont un utilisateur averti a une opinion propre — « dans mon secteur c'est plutôt
4,5× ». Les pondérations relatives entre churn, croissance et dépendance fondateur relèvent du
modèle, pas de la préférence.

**Dans le code.** Tout le reste — courbes de base, ancrages d'ajustement, seuils de santé, zones
de prix, bornes d'écrêtage — vit exclusivement dans `benchmarks.ts`, en constantes typées et
commentées. Réviser l'application dans un an doit se limiter à éditer ce fichier, sans toucher au
moteur ni aux composants.

## 6. Scénarios

L'utilisateur épingle l'état courant sous forme de scénario nommé. Maximum 3, persistés en
`localStorage` sous une clé versionnée (`saas-simulator:v1`). Un scénario stocke uniquement
`SimulatorInputs` ; les résultats sont recalculés au chargement, ce qui garantit qu'un scénario
sauvegardé avant une évolution du barème reste cohérent avec le barème courant.

La comparaison s'affiche dans une bande sous la carte de valorisation : une colonne par
scénario, avec valorisation, multiple, MRR et le delta relatif au scénario courant. Pas de page
dédiée : la comparaison doit rester dans le champ de vision des jauges.

Si le schéma d'entrée évolue, une clé de version différente invalide les scénarios existants
plutôt que de tenter une migration.

### 6.1 Partage par URL

Un bouton « Copier le lien » sérialise `SimulatorInputs` en JSON compact, l'encode en base64url
et l'écrit dans le fragment d'URL (`#s=…`). Au chargement, un fragment présent écrase les valeurs
par défaut.

Le fragment plutôt que la query : il n'est jamais transmis au serveur ni journalisé, et les
hypothèses financières d'un actif n'ont rien à faire dans des logs. L'application étant
entièrement statique, aucune donnée ne quitte le navigateur.

Un fragment illisible ou d'une version inconnue est ignoré silencieusement au profit des valeurs
par défaut, avec un `toast` non bloquant. Un lien périmé ne doit jamais produire un écran cassé.

## 7. Interface

### 7.1 Structure

Un écran unique, deux colonnes, sans navigation.

- **Colonne gauche**, 360 px, `sticky`, scroll indépendant : le panneau de contrôle.
- **Colonne droite**, fluide : les conséquences.

### 7.2 Panneau de contrôle

Sections repliables (`Accordion`), toutes ouvertes par défaut sauf « Qualité de l'actif » :
Pricing · Clients et acquisition · Rétention · Économie · Qualité de l'actif.

Chaque jauge affiche son libellé, sa valeur formatée à droite, le rail, et le cas échéant sa
légende de repère. La valeur est aussi saisissable au clavier via un champ compact, pour les
utilisateurs qui connaissent leur chiffre exact.

### 7.3 Colonne de résultats

Dans cet ordre :

1. **Carte de valorisation.** Le montant en grand, en `--font-mono`, avec la fourchette et le
   badge de multiple. La carte est `sticky` en haut de la colonne. Le montant est animé entre
   deux valeurs (interpolation sur 300 ms, `ease-out`) pour matérialiser le lien de cause à
   effet.
2. **Grille de KPI.** MRR, ARR, ARPU, LTV, LTV:CAC, payback, NRR, Rule of 40, plafond de MRR.
   Chacun avec son badge de santé.
3. **Projection 36 mois.** Courbe de MRR, asymptote du plafond en pointillé et annotée. Si le
   plafond est `null`, l'asymptote disparaît et une note indique la rétention nette négative.
4. **Décomposition du multiple.** Une ligne par critère, deltas signés et colorés, total en pied.
   Les critères à delta nul restent affichés, en gris : leur neutralité est une information.

### 7.4 Thème

shadcn/ui avec le thème Vercel fourni
(`https://shadcnthemer.com/r/themes/418a8650-514e-483b-a8cd-2c6e619ee97c.json`) : neutre
achromatique, `radius` 0,625 rem. Les deux couleurs de chart du thème portent le sens : ambre
pour la courbe de MRR, bleu-violet pour les éléments de comparaison. Le vert et le rouge sont
réservés aux badges de santé et aux deltas.

Bascule clair / sombre, préférence système par défaut, choix persisté.

### 7.5 Mobile

Sous 1024 px, la mise en page s'empile. Le panneau de contrôle passe dans un `Sheet` déclenché
par une barre inférieure persistante. La carte de valorisation reste visible en haut pendant
l'ajustement des jauges — sans cela, la boucle de rétroaction disparaît et l'application perd
son intérêt sur mobile.

### 7.6 États limites

| Situation | Comportement |
|---|---|
| `Σ mix = 0` | ARPU 0, KPI à `—`, message « répartis le mix entre les plans » |
| `customers = 0` | MRR 0, valorisation 0, projection partant de 0 |
| `revenueChurn = 0` | LTV non définie, affichée `—` avec infobulle |
| `cac = 0` | Payback 0 mois. LTV:CAC non défini : badge « acquisition organique », pas `—` |
| `netChurn ≤ 0` | Pas de plafond ; note explicite sous la courbe |
| `sdeAnnual ≤ 0`, `w = 0` | Valorisation 0 ; message d'actif déficitaire, leviers CAC et charges fixes |
| `sdeAnnual ≤ 0`, `w > 0` | Seule la composante ARR contribue ; note « valorisé sur le revenu, l'exploitation étant déficitaire » |
| Multiple écrêté | Ligne « plafonné à N× » en pied de décomposition |
| Multiple de base surchargé | Badge « barème personnalisé » et bouton de réinitialisation sur la carte |
| Fragment d'URL invalide | Valeurs par défaut, `toast` non bloquant |

### 7.7 Accessibilité

Chaque `Slider` porte un `aria-label` et un `aria-valuetext` formaté (« churn 2,1 pour cent »).
Les badges de santé ne reposent pas uniquement sur la couleur : ils portent un libellé textuel.
La navigation clavier couvre l'ensemble des contrôles.

## 8. Architecture

```
src/
  lib/
    engine/
      types.ts          SimulatorInputs, SimulatorResults, Profile
      interpolate.ts    interpolation linéaire par morceaux, clamp, smoothstep
      benchmarks.ts     barèmes, ancrages, seuils, zones de prix
      revenue.ts        ARPU, MRR, ARR, compte de résultat
      economics.ts      LTV, ratios, NRR, Rule of 40
      projection.ts     série 36 mois, plafond
      valuation.ts      base continue, deltas, fondu SDE/ARR, fourchette
      index.ts          compute(inputs): SimulatorResults
    format.ts           formatage monnaie / pourcentage, locale fr-FR
    logScale.ts         position ↔ valeur des jauges logarithmiques
    urlState.ts         encodage / décodage du fragment de partage
  store/
    simulator.ts        état Zustand : inputs, scénarios, thème
  components/
    controls/           GaugeRow, PricingSection, RetentionSection, ...
    results/            ValuationCard, KpiGrid, ProjectionChart, MultipleBreakdown
    scenarios/          ScenarioBar
    ui/                 primitives shadcn
  App.tsx
```

Le moteur expose une fonction pure `compute(inputs: SimulatorInputs): SimulatorResults`.
Aucun composant ne fait de calcul métier : les composants lisent `SimulatorResults`. Cette
frontière est ce qui rend le moteur testable et l'interface remplaçable.

`benchmarks.ts` est le point unique de vérité pour tout chiffre de marché. Mettre l'application
à jour dans un an doit se limiter à éditer ce fichier.

**Stack** : Vite · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Recharts · Zustand ·
Vitest.

## 9. Tests

Le moteur est développé en TDD. Vitest, tests colocalisés en `*.test.ts`.

- `revenue` : ARPU pondéré, normalisation du mix, mix nul
- `economics` : LTV avec marge brute, `null` à churn nul, payback, NRR, Rule of 40
- `projection` : convergence effective vers `mrrCeiling` à 36 mois, absence de plafond à
  rétention nette négative, monotonie quand `newMrr > mrr × netChurn`
- `valuation` : courbe de base aux ancrages et entre ancrages, réconciliation de la décomposition
  (somme des lignes = multiple affiché), écrêtage du cumul et écrêtage absolu, composante SDE
  nulle et non négative en cas de perte, surcharge du multiple de base
- `interpolate` : valeurs exactes aux ancrages, interpolation linéaire entre deux ancrages,
  écrêtage hors domaine ; `smoothstep` vaut 0 et 1 aux bornes et 0,5 au milieu

**Le test de continuité globale.** Un test balaie chaque jauge sur tout son domaine, à pas fin,
toutes les autres entrées étant fixées, et vérifie qu'entre deux pas consécutifs la valorisation
ne varie jamais de plus d'un seuil relatif. Le balayage de `customers` doit traverser la zone de
fondu SDE→ARR (60 k€ à 140 k€ de MRR), qui est l'endroit exact où une régression réintroduirait
un saut.

Ce test est la garantie exécutable du principe 2. La première version de cette spec contenait une
bascule de base par seuil dur, qui produisait un saut de valorisation de plusieurs centaines de
milliers d'euros au franchissement de 50 000 € de MRR ; c'est ce test qui l'aurait révélé.

L'interface n'est pas testée automatiquement. Le rapport valeur/coût ne le justifie pas à cette
échelle, et le moteur concentre tout le risque de justesse.

## 10. Hors périmètre

Écartés volontairement : connexion Stripe ou toute source de revenu réelle, export PDF, comptes
utilisateurs, multi-devises, saisonnalité, cohortes, distinction churn logo / churn revenu, plans
annuels et remises, éditeur intégral des courbes d'ajustement.

Les plans annuels sont l'extension la plus probable. Ils ne sont pas un simple champ en plus :
un mix mensuel/annuel change le churn effectif, la trésorerie et la base de calcul du MRR. C'est
un travail de modélisation à part entière, qui mérite sa propre spec plutôt qu'un ajout
opportuniste à celle-ci.
