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

**Profil et base.** Le profil est déduit du MRR, pas choisi par l'utilisateur, avec une
possibilité de forçage manuel.

| Profil | Condition | Base | Multiple de base |
|---|---|---|---|
| `micro` | MRR < 5 000 € | SDE annuel | 3,0× |
| `bootstrapped` | 5 000 € ≤ MRR < 50 000 € | SDE annuel | 4,0× |
| `established` | MRR ≥ 50 000 € | ARR | 4,0× |

Les micro-actifs et les SaaS bootstrappés se négocient sur le profit ; au-delà d'environ
600 k€ d'ARR, le marché bascule sur des multiples de revenu. C'est la pratique des places de
marché (Acquire.com, Flippa) et des brokers spécialisés.

**Ajustements.** Chaque critère produit un delta additif sur le multiple, par interpolation
linéaire entre points d'ancrage. En dehors des bornes, la valeur est écrêtée à l'ancrage
extrême. Cette forme garantit la continuité exigée au principe 2.

| Critère | Ancrages (valeur → delta) |
|---|---|
| `revenueChurn` | 0 % → +0,80 · 2 % → +0,50 · 3 % → +0,20 · 5 % → 0 · 8 % → −0,60 · 15 % → −1,20 |
| `growthMoM` | 0 % → −0,40 · 2 % → 0 · 5 % → +0,45 · 10 % → +0,90 · 20 % → +1,40 |
| `nrr` | 80 % → −0,50 · 95 % → −0,15 · 100 % → 0 · 110 % → +0,45 · 130 % → +0,90 |
| `ruleOf40` | 0 → −0,35 · 20 → −0,15 · 40 → +0,15 · 60 → +0,40 · 100 → +0,70 |
| `grossMargin` | 50 % → −0,50 · 70 % → −0,20 · 80 % → 0 · 90 % → +0,25 |
| `topClientShare` | 0 % → +0,10 · 10 % → 0 · 25 % → −0,35 · 50 % → −0,80 |
| `ageMonths` | 0 → −0,50 · 12 → −0,20 · 24 → 0 · 48 → +0,25 |
| `founderDependency` | low → +0,25 · medium → 0 · high → −0,50 |
| `techTransferability` | low → −0,30 · medium → 0 · high → +0,15 |

Les deux derniers critères sont discrets par nature ; la contrainte de continuité ne s'y
applique pas puisqu'ils ne sont pas pilotés par une jauge.

**Écrêtage et résultat.**

```
rawMultiple = base + Σ deltas
multiple    = clamp(rawMultiple, 1,0, ceiling[profil])
```

Plafonds : `micro` 6,0× · `bootstrapped` 8,0× · `established` 12,0×. Ils empêchent qu'un
empilement d'hypothèses optimistes produise un multiple que le marché ne pratique pas. Quand
l'écrêtage s'applique, l'interface l'indique en dernière ligne de la décomposition.

```
baseAmount = profil === 'established' ? arr : sdeAnnual
valuation  = max(0, multiple × baseAmount)
low        = valuation × 0,85
high       = valuation × 1,15
```

Si `sdeAnnual ≤ 0` sur un profil valorisé au SDE, la valorisation n'est pas calculée. L'interface
affiche « actif déficitaire — pas de valorisation sur le profit » et invite à réduire le CAC ou
les charges fixes. Une valorisation négative n'a pas de sens et ne doit jamais s'afficher.

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
| `sdeAnnual ≤ 0` sur profil SDE | Pas de valorisation ; message d'actif déficitaire |
| Multiple écrêté | Ligne « plafonné à N× » en pied de décomposition |

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
      interpolate.ts    interpolation linéaire par morceaux + clamp
      benchmarks.ts     barèmes, ancrages, seuils, zones de prix
      revenue.ts        ARPU, MRR, ARR, compte de résultat
      economics.ts      LTV, ratios, NRR, Rule of 40
      projection.ts     série 36 mois, plafond
      valuation.ts      profil, deltas, multiple, fourchette
      index.ts          compute(inputs): SimulatorResults
    format.ts           formatage monnaie / pourcentage, locale fr-FR
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
- `valuation` : sélection du profil aux bornes 5 000 € et 50 000 €, interpolation aux ancrages
  et entre ancrages, écrêtage haut et bas, refus de valoriser un SDE négatif
- `interpolate` : **continuité** — pour chaque courbe d'ajustement, un balayage du domaine par
  pas fin ne doit produire aucun saut supérieur à un epsilon. C'est le test qui protège le
  principe 2.

L'interface n'est pas testée automatiquement. Le rapport valeur/coût ne le justifie pas à cette
échelle, et le moteur concentre tout le risque de justesse.

## 10. Hors périmètre

Écartés volontairement : connexion Stripe ou toute source de revenu réelle, export PDF,
comptes utilisateurs, partage de scénario par URL, multi-devises, saisonnalité, cohortes,
distinction churn logo / churn revenu, plans annuels et remises.

Le partage par URL et les plans annuels sont les deux extensions les plus probables ; le
schéma `SimulatorInputs` est plat et sérialisable, ce qui les laisse ouvertes sans les
implémenter aujourd'hui.
