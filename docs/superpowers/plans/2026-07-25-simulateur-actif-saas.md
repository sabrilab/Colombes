# Simulateur d'actif SaaS — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire une application web mono-écran qui simule la valorisation d'un actif SaaS à partir de son pricing, de sa base clients et de sa rétention, entièrement pilotée à la jauge et recalculée en direct.

**Architecture:** Un moteur de calcul en TypeScript pur, sans dépendance React, isolé dans `src/lib/engine/` et exposant une unique fonction pure `compute(inputs): SimulatorResults`. Les composants React ne font aucun calcul métier : ils lisent le résultat. Un store Zustand détient les entrées ; toute modification déclenche un recalcul complet, l'opération étant assez peu coûteuse pour ne pas mériter de mémoïsation.

**Tech Stack:** Vite · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui (thème Vercel) · Recharts 3 · Zustand 5 · Vitest

**Spec de référence :** `docs/superpowers/specs/2026-07-25-simulateur-actif-saas-design.md`

## Global Constraints

- **Unités.** Tous les taux sont stockés en **décimal**, jamais en points de pourcentage : `revenueChurn = 0.021` signifie 2,1 %. Trois exceptions explicites, en unité naturelle : `ruleOf40` en points (0 à 100), `ageMonths` en mois, `paybackMonths` en mois. Chaque table d'ancrages du barème documente son unité.
- **Continuité.** Aucune fonction du moteur ne doit contenir de branchement conditionnel sur un seuil numérique qui modifierait la valorisation de façon discontinue. Les transitions se font par interpolation ou par `smoothstep`. Cette règle est vérifiée par le test de balayage de la tâche 9.
- **`null` n'est pas zéro.** Une grandeur non définie (LTV à churn nul, plafond à rétention nette négative) vaut `null` et s'affiche `—`. Ne jamais substituer `0`, `Infinity` ou `NaN`.
- **Aucune valorisation négative.** La composante SDE est bornée à 0 par le bas.
- **Point unique de vérité.** Tout chiffre de marché — courbes de base, ancrages, seuils de santé, zones de prix, bornes d'écrêtage — vit exclusivement dans `src/lib/engine/benchmarks.ts`. Aucun nombre magique ailleurs.
- **Le moteur ignore React.** Aucun fichier de `src/lib/engine/` n'importe quoi que ce soit de `react`, `zustand` ou d'un composant.
- **Locale.** Formatage en `fr-FR`, devise EUR. Textes d'interface en français.
- **TypeScript strict.** `strict: true`, pas de `any`, pas de `!` non justifié.
- **Aucun appel réseau.** L'application fonctionne hors-ligne. Aucun `fetch`.

---

## Structure de fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/engine/types.ts` | Types partagés : `SimulatorInputs`, `SimulatorResults` et leurs composantes |
| `src/lib/engine/interpolate.ts` | Primitives numériques : `clamp`, `interpolate`, `smoothstep`, `logAnchors` |
| `src/lib/engine/benchmarks.ts` | Toutes les constantes de marché : courbes de base, ancrages d'ajustement, seuils de santé, zones de prix, bornes |
| `src/lib/engine/revenue.ts` | ARPU pondéré, MRR, ARR, compte de résultat mensuel |
| `src/lib/engine/economics.ts` | LTV, LTV:CAC, payback, NRR |
| `src/lib/engine/projection.ts` | Croissance, plafond de MRR, série 36 mois |
| `src/lib/engine/valuation.ts` | Multiple de base continu, deltas, fondu SDE/ARR, fourchette |
| `src/lib/engine/index.ts` | `compute(inputs)` — orchestration, seul point d'entrée public |
| `src/lib/format.ts` | Formatage monnaie, pourcentage, multiple, mois |
| `src/lib/logScale.ts` | Conversion position ↔ valeur des jauges logarithmiques |
| `src/lib/urlState.ts` | Encodage / décodage du fragment de partage |
| `src/lib/defaults.ts` | `DEFAULT_INPUTS` |
| `src/store/simulator.ts` | Store Zustand : entrées, scénarios, thème, persistance |
| `src/components/controls/GaugeRow.tsx` | Une ligne de jauge : libellé, valeur, rail, repère, saisie clavier |
| `src/components/controls/TierRow.tsx` | Un plan tarifaire : prix + part du mix |
| `src/components/controls/ControlPanel.tsx` | Les cinq sections repliables |
| `src/components/results/ValuationCard.tsx` | Montant animé, fourchette, badges, popover de barème |
| `src/components/results/KpiGrid.tsx` | Grille de KPI avec badges de santé |
| `src/components/results/ProjectionChart.tsx` | Courbe 36 mois et asymptote |
| `src/components/results/MultipleBreakdown.tsx` | Décomposition ligne à ligne |
| `src/components/scenarios/ScenarioBar.tsx` | Épinglage et comparaison |
| `src/components/ThemeToggle.tsx` | Bascule clair / sombre |
| `src/App.tsx` | Mise en page deux colonnes, `Sheet` mobile |

---

### Task 1: Échafaudage du projet et thème

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `components.json`, `.gitignore`

**Interfaces:**
- Consumes: rien
- Produces: alias `@/` vers `src/`, variables CSS du thème Vercel, `pnpm dev` / `pnpm build` / `pnpm test` fonctionnels

- [ ] **Step 1: Échafauder Vite dans un sous-dossier puis remonter les fichiers**

Le dossier du projet contient déjà `docs/` et `.git/`, ce qui rend `pnpm create vite .` interactif. On passe par un dossier temporaire pour rester déterministe.

```bash
cd "/Users/svbri/Saas Playbook app"
pnpm create vite@latest .scaffold --template react-ts
mv .scaffold/* . 2>/dev/null
mv .scaffold/.[!.]* . 2>/dev/null
rmdir .scaffold
```

- [ ] **Step 2: Installer les dépendances**

```bash
cd "/Users/svbri/Saas Playbook app"
pnpm install
pnpm add zustand recharts
pnpm add -D tailwindcss @tailwindcss/vite @types/node vitest
```

- [ ] **Step 3: Configurer Vite (plugin Tailwind, alias, Vitest)**

Remplacer intégralement `vite.config.ts` :

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Vitest lit la configuration de Vite : l'environnement `node` suffit, le moteur n'ayant aucune dépendance au DOM.

- [ ] **Step 4: Déclarer l'alias côté TypeScript**

Ajouter dans `tsconfig.json`, à la racine de l'objet, aux côtés de `files` et `references` :

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Ajouter les deux mêmes clés dans `compilerOptions` de `tsconfig.app.json`, que le CLI shadcn et l'éditeur consultent.

- [ ] **Step 5: Charger Tailwind**

Remplacer intégralement `src/index.css` :

```css
@import "tailwindcss";
```

Supprimer `src/App.css`, non utilisé.

- [ ] **Step 6: Initialiser shadcn/ui**

Le CLI shadcn a été réécrit en v4 : `--base-color` y a disparu au profit d'un système de
`--preset`, et `--base` y désigne désormais la bibliothèque de composants. On épingle la
dernière version d'avant la réécriture, dont la surface de commandes est celle décrite ici.

```bash
cd "/Users/svbri/Saas Playbook app"
pnpm dlx shadcn@3.8.5 init --base-color neutral --yes
```

Attendu : création de `components.json`, de `src/lib/utils.ts`, et injection des variables de thème dans `src/index.css`.

- [ ] **Step 7: Appliquer le thème Vercel**

```bash
cd "/Users/svbri/Saas Playbook app"
pnpm dlx shadcn@3.8.5 add https://shadcnthemer.com/r/themes/418a8650-514e-483b-a8cd-2c6e619ee97c.json --yes
```

Attendu : `src/index.css` contient désormais des blocs `:root` et `.dark` avec des couleurs en `oklch`, dont `--radius: 0.625rem` et cinq `--chart-*`.

- [ ] **Step 8: Installer les primitives shadcn nécessaires**

```bash
cd "/Users/svbri/Saas Playbook app"
pnpm dlx shadcn@3.8.5 add slider card badge accordion popover button toggle-group sheet tooltip sonner input label separator --yes
```

- [ ] **Step 9: Écran de vérification**

Remplacer intégralement `src/App.tsx` :

```tsx
export default function App() {
  return (
    <main className="min-h-svh bg-background text-foreground p-8">
      <h1 className="text-2xl font-medium">Simulateur d'actif SaaS</h1>
      <p className="text-muted-foreground mt-2">Échafaudage opérationnel.</p>
    </main>
  )
}
```

- [ ] **Step 10: Vérifier que tout compile**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm build
```

Attendu : `✓ built in …`, aucune erreur TypeScript.

- [ ] **Step 11: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add -A
git commit -m "chore: échafaudage Vite + Tailwind v4 + shadcn avec thème Vercel"
```

---

### Task 2: Types du moteur

**Files:**
- Create: `src/lib/engine/types.ts`

**Interfaces:**
- Consumes: rien
- Produces: `Tier`, `Level`, `SimulatorInputs`, `Revenue`, `Economics`, `Growth`, `ValuationLine`, `Valuation`, `ProfileLabel`, `SimulatorResults`, `Health`

Cette tâche ne contient pas de test : un fichier de types purs n'a pas de comportement à vérifier, et sa justesse est établie par la compilation des tâches suivantes qui le consomment.

- [ ] **Step 1: Écrire les types**

Créer `src/lib/engine/types.ts` :

```ts
export type Level = 'low' | 'medium' | 'high'
export type ProfileLabel = 'micro' | 'bootstrapped' | 'established'
export type Health = 'good' | 'warn' | 'bad'

export interface Tier {
  name: string
  /** Prix mensuel en euros. */
  price: number
  /** Part du mix, en décimal non normalisé. */
  mix: number
}

export interface SimulatorInputs {
  tiers: [Tier, Tier, Tier]
  customers: number
  newCustomersPerMonth: number
  /** Coût d'acquisition par client, en euros. */
  cac: number
  /** Churn de revenu mensuel brut, décimal. */
  revenueChurn: number
  /** Revenu d'expansion mensuel, décimal. */
  expansion: number
  /** Marge brute, décimal. */
  grossMargin: number
  /** Charges fixes mensuelles hors acquisition, en euros. */
  fixedCosts: number
  founderDependency: Level
  techTransferability: Level
  /** Part du MRR portée par le plus gros client, décimal. */
  topClientShare: number
  ageMonths: number
  /** `null` = suivre la courbe de barème. */
  baseMultipleOverride: number | null
}

export interface Revenue {
  arpu: number
  mrr: number
  arr: number
  newMrr: number
  variableCost: number
  acquisitionCost: number
  sdeMonthly: number
  sdeAnnual: number
  netMargin: number
}

export interface Economics {
  ltv: number | null
  ltvCacRatio: number | null
  paybackMonths: number | null
  nrr: number
}

export interface Growth {
  netChurn: number
  /** `null` si la rétention nette est négative : il n'y a pas de plafond. */
  mrrCeiling: number | null
  growthMoM: number
  growthAnnual: number
  /** En points, pas en décimal. */
  ruleOf40: number
}

export interface ValuationLine {
  key: string
  label: string
  /** Delta en pourcentage du multiple de base, décimal. */
  deltaPct: number
  /** Le même delta converti en points de multiple, pour l'affichage. */
  deltaMultiple: number
}

export interface Valuation {
  baseMultiple: number
  isOverridden: boolean
  lines: ValuationLine[]
  adjSum: number
  adjClamped: boolean
  multiple: number
  multipleClamped: boolean
  /** Poids de la base ARR dans le fondu, de 0 à 1. */
  arrWeight: number
  valuationSde: number
  valuationArr: number
  value: number
  low: number
  high: number
  profileLabel: ProfileLabel
  isLossMaking: boolean
}

export interface SimulatorResults {
  revenue: Revenue
  economics: Economics
  growth: Growth
  /** 37 points : mois 0 à 36. */
  projection: number[]
  valuation: Valuation
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/types.ts
git commit -m "feat(engine): types du simulateur"
```

---

### Task 3: Primitives numériques

**Files:**
- Create: `src/lib/engine/interpolate.ts`
- Test: `src/lib/engine/interpolate.test.ts`

**Interfaces:**
- Consumes: rien
- Produces: `Anchor` (type `readonly [number, number]`), `clamp(x, min, max): number`, `interpolate(anchors, x): number`, `smoothstep(a, b, x): number`, `logAnchors(pairs): Anchor[]`

`interpolate` est le socle de la continuité exigée par les contraintes globales. Ses ancrages sont supposés triés par `x` croissant ; hors du domaine, elle renvoie la valeur de l'ancrage extrême le plus proche plutôt que d'extrapoler.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/engine/interpolate.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { clamp, interpolate, logAnchors, smoothstep, type Anchor } from './interpolate'

const ANCHORS: Anchor[] = [
  [0, 10],
  [10, 20],
  [20, 0],
]

describe('clamp', () => {
  it('laisse passer une valeur dans les bornes', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('écrête en bas et en haut', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('interpolate', () => {
  it('rend la valeur exacte à chaque ancrage', () => {
    expect(interpolate(ANCHORS, 0)).toBe(10)
    expect(interpolate(ANCHORS, 10)).toBe(20)
    expect(interpolate(ANCHORS, 20)).toBe(0)
  })

  it('interpole linéairement entre deux ancrages', () => {
    expect(interpolate(ANCHORS, 5)).toBeCloseTo(15)
    expect(interpolate(ANCHORS, 15)).toBeCloseTo(10)
  })

  it('écrête hors du domaine au lieu d extrapoler', () => {
    expect(interpolate(ANCHORS, -100)).toBe(10)
    expect(interpolate(ANCHORS, 100)).toBe(0)
  })

  it('est continue sur tout le domaine', () => {
    let previous = interpolate(ANCHORS, -5)
    for (let x = -5; x <= 25; x += 0.01) {
      const current = interpolate(ANCHORS, x)
      expect(Math.abs(current - previous)).toBeLessThan(0.05)
      previous = current
    }
  })
})

describe('smoothstep', () => {
  it('vaut 0 sous la borne basse et 1 au-dessus de la borne haute', () => {
    expect(smoothstep(10, 20, 5)).toBe(0)
    expect(smoothstep(10, 20, 10)).toBe(0)
    expect(smoothstep(10, 20, 20)).toBe(1)
    expect(smoothstep(10, 20, 99)).toBe(1)
  })

  it('vaut 0,5 au milieu', () => {
    expect(smoothstep(10, 20, 15)).toBeCloseTo(0.5)
  })

  it('a une dérivée nulle aux bornes', () => {
    // Une fonction à dérivée nulle croît quadratiquement près de sa borne :
    // f(e) / f(e/2) tend vers 4. Une rampe linéaire donnerait 2, quelle que
    // soit sa pente — c'est ce rapport, et non la petitesse de f(e), qui
    // distingue réellement une dérivée nulle.
    const epsilon = 1e-3

    const atZero = smoothstep(0, 1, epsilon) / smoothstep(0, 1, epsilon / 2)
    expect(atZero).toBeCloseTo(4, 1)

    const atOne =
      (1 - smoothstep(0, 1, 1 - epsilon)) / (1 - smoothstep(0, 1, 1 - epsilon / 2))
    expect(atOne).toBeCloseTo(4, 1)
  })
})

describe('logAnchors', () => {
  it('remplace chaque abscisse par son logarithme décimal', () => {
    const result = logAnchors([
      [100, 1],
      [1000, 2],
    ])
    expect(result[0][0]).toBeCloseTo(2)
    expect(result[1][0]).toBeCloseTo(3)
    expect(result[0][1]).toBe(1)
  })

  it('protège le logarithme d une abscisse nulle', () => {
    expect(logAnchors([[0, 5]])[0][0]).toBe(0)
  })
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/interpolate.test.ts
```

Attendu : échec, `Failed to resolve import "./interpolate"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/engine/interpolate.ts` :

```ts
export type Anchor = readonly [x: number, y: number]

export function clamp(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max)
}

/**
 * Interpolation linéaire par morceaux entre ancrages triés par x croissant.
 * Hors du domaine, renvoie l'ancrage extrême le plus proche : on n'extrapole
 * jamais un barème de marché au-delà de ce qu'il décrit.
 */
export function interpolate(anchors: readonly Anchor[], x: number): number {
  if (anchors.length === 0) return 0
  if (x <= anchors[0][0]) return anchors[0][1]

  const last = anchors[anchors.length - 1]
  if (x >= last[0]) return last[1]

  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i]
    const [x1, y1] = anchors[i + 1]
    if (x <= x1) {
      const span = x1 - x0
      if (span === 0) return y1
      return y0 + ((x - x0) / span) * (y1 - y0)
    }
  }

  return last[1]
}

/** Transition lisse de 0 à 1, à dérivée nulle aux deux bornes. */
export function smoothstep(a: number, b: number, x: number): number {
  if (b === a) return x < a ? 0 : 1
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Reporte des ancrages sur une échelle logarithmique décimale. */
export function logAnchors(pairs: readonly Anchor[]): Anchor[] {
  return pairs.map(([x, y]) => [Math.log10(Math.max(x, 1)), y] as Anchor)
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/interpolate.test.ts
```

Attendu : `Test Files 1 passed`, 11 tests passés.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/interpolate.ts src/lib/engine/interpolate.test.ts
git commit -m "feat(engine): interpolation par morceaux, clamp et smoothstep"
```

---

### Task 4: Barèmes de marché

**Files:**
- Create: `src/lib/engine/benchmarks.ts`
- Test: `src/lib/engine/benchmarks.test.ts`

**Interfaces:**
- Consumes: `Anchor`, `logAnchors` de `interpolate.ts` ; `Health`, `Level` de `types.ts`
- Produces: `SDE_BASE_ANCHORS`, `ARR_BASE_ANCHORS`, `ARR_BLEND_FROM`, `ARR_BLEND_TO`, `ADJUSTMENT_ANCHORS`, `LEVEL_DELTAS`, `ADJ_SUM_MIN`, `ADJ_SUM_MAX`, `MULTIPLE_MIN`, `MULTIPLE_MAX`, `VALUATION_SPREAD`, `PROJECTION_MONTHS`, `PRICE_ZONES`, `priceZoneFor(arpu)`, `healthOf(metric, value)`, `HEALTH_THRESHOLDS`

Ce fichier est le point unique de vérité imposé par les contraintes globales. Réviser l'application dans un an doit se limiter à l'éditer.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/engine/benchmarks.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { interpolate } from './interpolate'
import {
  ADJUSTMENT_ANCHORS,
  ARR_BASE_ANCHORS,
  LEVEL_DELTAS,
  SDE_BASE_ANCHORS,
  healthOf,
  priceZoneFor,
} from './benchmarks'

describe('courbes de base', () => {
  it('rend les multiples de la spec aux ancrages SDE', () => {
    expect(interpolate(SDE_BASE_ANCHORS, Math.log10(500))).toBeCloseTo(2.2)
    expect(interpolate(SDE_BASE_ANCHORS, Math.log10(5000))).toBeCloseTo(2.9)
    expect(interpolate(SDE_BASE_ANCHORS, Math.log10(150000))).toBeCloseTo(4.3)
  })

  it('rend les multiples de la spec aux ancrages ARR', () => {
    expect(interpolate(ARR_BASE_ANCHORS, Math.log10(600000))).toBeCloseTo(2.6)
    expect(interpolate(ARR_BASE_ANCHORS, Math.log10(10000000))).toBeCloseTo(4.5)
  })

  it('croît avec la taille', () => {
    const small = interpolate(SDE_BASE_ANCHORS, Math.log10(1000))
    const large = interpolate(SDE_BASE_ANCHORS, Math.log10(100000))
    expect(large).toBeGreaterThan(small)
  })
})

describe('ancrages d ajustement', () => {
  it('annule le delta de churn au repère de 5 %', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0.05)).toBeCloseTo(0)
  })

  it('récompense un churn faible et pénalise un churn fort', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0)).toBeCloseTo(0.2)
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0.15)).toBeCloseTo(-0.3)
  })

  it('annule le delta de NRR à 100 %', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.nrr, 1)).toBeCloseTo(0)
  })

  it('annule le delta de marge brute à 80 %', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.grossMargin, 0.8)).toBeCloseTo(0)
  })

  it('exprime la Rule of 40 en points et non en décimal', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.ruleOf40, 40)).toBeCloseTo(0.04)
  })
})

describe('LEVEL_DELTAS', () => {
  it('neutralise le niveau medium', () => {
    expect(LEVEL_DELTAS.founderDependency.medium).toBe(0)
    expect(LEVEL_DELTAS.techTransferability.medium).toBe(0)
  })

  it('pénalise une forte dépendance au fondateur', () => {
    expect(LEVEL_DELTAS.founderDependency.high).toBeLessThan(0)
    expect(LEVEL_DELTAS.founderDependency.low).toBeGreaterThan(0)
  })
})

describe('priceZoneFor', () => {
  it('classe l ARPU dans la bonne zone', () => {
    expect(priceZoneFor(9).key).toBe('b2c')
    expect(priceZoneFor(29).key).toBe('smb')
    expect(priceZoneFor(120).key).toBe('b2b')
    expect(priceZoneFor(400).key).toBe('midmarket')
  })

  it('couvre toute la plage des ARPU positifs', () => {
    for (const arpu of [0, 0.5, 14.99, 15, 50, 200, 10000]) {
      expect(priceZoneFor(arpu)).toBeDefined()
    }
  })

  it('donne une plage de churn plausible croissante vers le bas de gamme', () => {
    expect(priceZoneFor(9).churnMin).toBeGreaterThan(priceZoneFor(400).churnMin)
  })
})

describe('healthOf', () => {
  it('juge le churn selon les seuils de la spec', () => {
    expect(healthOf('revenueChurn', 0.02)).toBe('good')
    expect(healthOf('revenueChurn', 0.04)).toBe('warn')
    expect(healthOf('revenueChurn', 0.07)).toBe('bad')
  })

  it('juge le ratio LTV:CAC dans le sens croissant', () => {
    expect(healthOf('ltvCacRatio', 4)).toBe('good')
    expect(healthOf('ltvCacRatio', 2)).toBe('warn')
    expect(healthOf('ltvCacRatio', 1)).toBe('bad')
  })

  it('juge le payback dans le sens décroissant', () => {
    expect(healthOf('paybackMonths', 8)).toBe('good')
    expect(healthOf('paybackMonths', 15)).toBe('warn')
    expect(healthOf('paybackMonths', 24)).toBe('bad')
  })

  it('rend null pour une valeur non définie', () => {
    expect(healthOf('ltvCacRatio', null)).toBeNull()
  })
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/benchmarks.test.ts
```

Attendu : échec, `Failed to resolve import "./benchmarks"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/engine/benchmarks.ts` :

```ts
import { logAnchors, type Anchor } from './interpolate'
import type { Health, Level } from './types'

/**
 * Point unique de vérité pour tout chiffre de marché.
 *
 * Sources : transactions observées sur les places de marché spécialisées
 * (Acquire.com, Empire Flippers, Flippa) et chez les brokers SaaS
 * (FE International, Quiet Light), après la compression des multiples de 2022.
 * Révision annuelle recommandée — ce fichier doit rester le seul à éditer.
 */

/** Multiple du SDE annuel, indexé sur log10(MRR mensuel en euros). */
export const SDE_BASE_ANCHORS: Anchor[] = logAnchors([
  [500, 2.2],
  [2_000, 2.6],
  [5_000, 2.9],
  [15_000, 3.3],
  [50_000, 3.8],
  [150_000, 4.3],
])

/** Multiple de l'ARR, indexé sur log10(ARR en euros). */
export const ARR_BASE_ANCHORS: Anchor[] = logAnchors([
  [600_000, 2.6],
  [1_200_000, 3.0],
  [3_000_000, 3.6],
  [10_000_000, 4.5],
])

/** Bornes du fondu SDE → ARR, en MRR mensuel. */
export const ARR_BLEND_FROM = 60_000
export const ARR_BLEND_TO = 140_000

/**
 * Deltas exprimés en pourcentage du multiple de base, en décimal.
 * Unité de l'abscisse indiquée par courbe.
 */
export const ADJUSTMENT_ANCHORS = {
  /** Abscisse : churn de revenu mensuel, décimal. */
  revenueChurn: [
    [0, 0.2],
    [0.02, 0.12],
    [0.03, 0.05],
    [0.05, 0],
    [0.08, -0.15],
    [0.15, -0.3],
  ] as Anchor[],
  /** Abscisse : croissance mensuelle du MRR, décimal. */
  growthMoM: [
    [0, -0.1],
    [0.02, 0],
    [0.05, 0.12],
    [0.1, 0.22],
    [0.2, 0.35],
  ] as Anchor[],
  /** Abscisse : NRR, décimal (1 = 100 %). */
  nrr: [
    [0.8, -0.12],
    [0.95, -0.04],
    [1, 0],
    [1.1, 0.11],
    [1.3, 0.22],
  ] as Anchor[],
  /** Abscisse : Rule of 40, en points. */
  ruleOf40: [
    [0, -0.09],
    [20, -0.04],
    [40, 0.04],
    [60, 0.1],
    [100, 0.17],
  ] as Anchor[],
  /** Abscisse : marge brute, décimal. */
  grossMargin: [
    [0.5, -0.12],
    [0.7, -0.05],
    [0.8, 0],
    [0.9, 0.06],
  ] as Anchor[],
  /** Abscisse : part du plus gros client, décimal. */
  topClientShare: [
    [0, 0.03],
    [0.1, 0],
    [0.25, -0.09],
    [0.5, -0.2],
  ] as Anchor[],
  /** Abscisse : ancienneté, en mois. */
  ageMonths: [
    [0, -0.12],
    [12, -0.05],
    [24, 0],
    [48, 0.06],
  ] as Anchor[],
} as const

/** Critères discrets : non pilotés par une jauge, la continuité ne s'applique pas. */
export const LEVEL_DELTAS: Record<'founderDependency' | 'techTransferability', Record<Level, number>> = {
  founderDependency: { low: 0.06, medium: 0, high: -0.12 },
  techTransferability: { low: -0.07, medium: 0, high: 0.04 },
}

/** Bornes du cumul des deltas, avant application au multiple de base. */
export const ADJ_SUM_MIN = -0.6
export const ADJ_SUM_MAX = 0.9

/** Bornes absolues du multiple final. */
export const MULTIPLE_MIN = 1
export const MULTIPLE_MAX = 10

/** Demi-largeur de la fourchette affichée. */
export const VALUATION_SPREAD = 0.15

export const PROJECTION_MONTHS = 36

export interface PriceZone {
  key: 'b2c' | 'smb' | 'b2b' | 'midmarket'
  label: string
  /** Borne haute d'ARPU, exclue. */
  maxArpu: number
  churnMin: number
  churnMax: number
}

export const PRICE_ZONES: PriceZone[] = [
  { key: 'b2c', label: 'B2C / prosumer', maxArpu: 15, churnMin: 0.05, churnMax: 0.08 },
  { key: 'smb', label: 'Prosumer / TPE', maxArpu: 50, churnMin: 0.03, churnMax: 0.05 },
  { key: 'b2b', label: 'PME / B2B', maxArpu: 200, churnMin: 0.02, churnMax: 0.03 },
  { key: 'midmarket', label: 'B2B mid-market', maxArpu: Infinity, churnMin: 0.01, churnMax: 0.02 },
]

export function priceZoneFor(arpu: number): PriceZone {
  return PRICE_ZONES.find((zone) => arpu < zone.maxArpu) ?? PRICE_ZONES[PRICE_ZONES.length - 1]
}

export type HealthMetric =
  | 'revenueChurn'
  | 'ltvCacRatio'
  | 'paybackMonths'
  | 'nrr'
  | 'ruleOf40'
  | 'grossMargin'

interface Threshold {
  /** 'up' : plus c'est haut, mieux c'est. 'down' : l'inverse. */
  direction: 'up' | 'down'
  good: number
  warn: number
  label: string
}

export const HEALTH_THRESHOLDS: Record<HealthMetric, Threshold> = {
  revenueChurn: { direction: 'down', good: 0.03, warn: 0.05, label: 'Bon ≤ 3 %/mois, à surveiller jusqu à 5 %' },
  ltvCacRatio: { direction: 'up', good: 3, warn: 1.5, label: 'Bon ≥ 3, à surveiller jusqu à 1,5' },
  paybackMonths: { direction: 'down', good: 12, warn: 18, label: 'Bon ≤ 12 mois, à surveiller jusqu à 18' },
  nrr: { direction: 'up', good: 1, warn: 0.9, label: 'Bon ≥ 100 %, à surveiller jusqu à 90 %' },
  ruleOf40: { direction: 'up', good: 40, warn: 20, label: 'Bon ≥ 40, à surveiller jusqu à 20' },
  grossMargin: { direction: 'up', good: 0.8, warn: 0.7, label: 'Bon ≥ 80 %, à surveiller jusqu à 70 %' },
}

export function healthOf(metric: HealthMetric, value: number | null): Health | null {
  if (value === null || !Number.isFinite(value)) return null
  const { direction, good, warn } = HEALTH_THRESHOLDS[metric]
  if (direction === 'up') {
    if (value >= good) return 'good'
    return value >= warn ? 'warn' : 'bad'
  }
  if (value <= good) return 'good'
  return value <= warn ? 'warn' : 'bad'
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/benchmarks.test.ts
```

Attendu : `Test Files 1 passed`, 17 tests passés.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/benchmarks.ts src/lib/engine/benchmarks.test.ts
git commit -m "feat(engine): barèmes de marché, seuils de santé et zones de prix"
```

---

### Task 5: Revenu et compte de résultat

**Files:**
- Create: `src/lib/engine/revenue.ts`
- Test: `src/lib/engine/revenue.test.ts`

**Interfaces:**
- Consumes: `SimulatorInputs`, `Revenue` de `types.ts`
- Produces: `computeRevenue(inputs: SimulatorInputs): Revenue`

La normalisation du mix est le point délicat : les parts saisies ne somment pas nécessairement à 1, et une somme nulle doit produire un ARPU de 0 plutôt qu'une division par zéro.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/engine/revenue.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { computeRevenue } from './revenue'
import type { SimulatorInputs } from './types'

function inputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    tiers: [
      { name: 'Starter', price: 10, mix: 0.5 },
      { name: 'Pro', price: 20, mix: 0.5 },
      { name: 'Scale', price: 100, mix: 0 },
    ],
    customers: 100,
    newCustomersPerMonth: 10,
    cac: 50,
    revenueChurn: 0.03,
    expansion: 0.01,
    grossMargin: 0.8,
    fixedCosts: 500,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.1,
    ageMonths: 24,
    baseMultipleOverride: null,
    ...overrides,
  }
}

describe('computeRevenue', () => {
  it('pondère l ARPU par le mix', () => {
    expect(computeRevenue(inputs()).arpu).toBeCloseTo(15)
  })

  it('normalise un mix qui ne somme pas à 1', () => {
    const result = computeRevenue(
      inputs({
        tiers: [
          { name: 'A', price: 10, mix: 30 },
          { name: 'B', price: 20, mix: 30 },
          { name: 'C', price: 100, mix: 0 },
        ],
      }),
    )
    expect(result.arpu).toBeCloseTo(15)
  })

  it('rend un ARPU nul quand le mix est entièrement à zéro', () => {
    const result = computeRevenue(
      inputs({
        tiers: [
          { name: 'A', price: 10, mix: 0 },
          { name: 'B', price: 20, mix: 0 },
          { name: 'C', price: 100, mix: 0 },
        ],
      }),
    )
    expect(result.arpu).toBe(0)
    expect(result.mrr).toBe(0)
    expect(Number.isNaN(result.arpu)).toBe(false)
  })

  it('ignore un plan à prix nul sans fausser la pondération', () => {
    const result = computeRevenue(
      inputs({
        tiers: [
          { name: 'Gratuit', price: 0, mix: 0.5 },
          { name: 'Pro', price: 20, mix: 0.5 },
          { name: 'Scale', price: 100, mix: 0 },
        ],
      }),
    )
    expect(result.arpu).toBeCloseTo(10)
  })

  it('dérive MRR, ARR et nouveau MRR de l ARPU', () => {
    const result = computeRevenue(inputs())
    expect(result.mrr).toBeCloseTo(1500)
    expect(result.arr).toBeCloseTo(18000)
    expect(result.newMrr).toBeCloseTo(150)
  })

  it('calcule le compte de résultat mensuel', () => {
    const result = computeRevenue(inputs())
    expect(result.variableCost).toBeCloseTo(300)
    expect(result.acquisitionCost).toBeCloseTo(500)
    expect(result.sdeMonthly).toBeCloseTo(200)
    expect(result.sdeAnnual).toBeCloseTo(2400)
    expect(result.netMargin).toBeCloseTo(200 / 1500)
  })

  it('admet un SDE négatif sans le tronquer', () => {
    const result = computeRevenue(inputs({ fixedCosts: 5000 }))
    expect(result.sdeMonthly).toBeLessThan(0)
  })

  it('rend une marge nette nulle plutôt que NaN quand le MRR est nul', () => {
    const result = computeRevenue(inputs({ customers: 0 }))
    expect(result.mrr).toBe(0)
    expect(result.netMargin).toBe(0)
  })
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/revenue.test.ts
```

Attendu : échec, `Failed to resolve import "./revenue"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/engine/revenue.ts` :

```ts
import type { Revenue, SimulatorInputs } from './types'

export function computeRevenue(inputs: SimulatorInputs): Revenue {
  const mixTotal = inputs.tiers.reduce((sum, tier) => sum + Math.max(tier.mix, 0), 0)

  const arpu =
    mixTotal > 0
      ? inputs.tiers.reduce((sum, tier) => sum + tier.price * (Math.max(tier.mix, 0) / mixTotal), 0)
      : 0

  const mrr = inputs.customers * arpu
  const arr = mrr * 12
  const newMrr = inputs.newCustomersPerMonth * arpu

  const variableCost = mrr * (1 - inputs.grossMargin)
  const acquisitionCost = inputs.newCustomersPerMonth * inputs.cac
  const sdeMonthly = mrr - variableCost - acquisitionCost - inputs.fixedCosts
  const sdeAnnual = sdeMonthly * 12
  const netMargin = mrr > 0 ? sdeMonthly / mrr : 0

  return { arpu, mrr, arr, newMrr, variableCost, acquisitionCost, sdeMonthly, sdeAnnual, netMargin }
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/revenue.test.ts
```

Attendu : `Test Files 1 passed`, 8 tests passés.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/revenue.ts src/lib/engine/revenue.test.ts
git commit -m "feat(engine): ARPU pondéré, MRR et compte de résultat"
```

---

### Task 6: Unit economics

**Files:**
- Create: `src/lib/engine/economics.ts`
- Test: `src/lib/engine/economics.test.ts`

**Interfaces:**
- Consumes: `SimulatorInputs`, `Revenue`, `Economics` de `types.ts`
- Produces: `computeEconomics(inputs: SimulatorInputs, revenue: Revenue): Economics`

La LTV utilise le churn brut sans retrancher l'expansion : convention conservatrice qui évite une LTV infinie à rétention nette négative.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/engine/economics.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { computeEconomics } from './economics'
import { computeRevenue } from './revenue'
import type { SimulatorInputs } from './types'

function inputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    tiers: [
      { name: 'Starter', price: 10, mix: 0.5 },
      { name: 'Pro', price: 20, mix: 0.5 },
      { name: 'Scale', price: 100, mix: 0 },
    ],
    customers: 100,
    newCustomersPerMonth: 10,
    cac: 50,
    revenueChurn: 0.03,
    expansion: 0.01,
    grossMargin: 0.8,
    fixedCosts: 500,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.1,
    ageMonths: 24,
    baseMultipleOverride: null,
    ...overrides,
  }
}

function economicsOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  return computeEconomics(i, computeRevenue(i))
}

describe('computeEconomics', () => {
  it('calcule la LTV sur la marge brute et le churn brut', () => {
    expect(economicsOf().ltv).toBeCloseTo((15 * 0.8) / 0.03)
  })

  it('ignore l expansion dans la LTV', () => {
    const withExpansion = economicsOf({ expansion: 0.02 })
    const withoutExpansion = economicsOf({ expansion: 0 })
    expect(withExpansion.ltv).toBeCloseTo(withoutExpansion.ltv as number)
  })

  it('rend une LTV nulle-définie quand le churn est nul', () => {
    const result = economicsOf({ revenueChurn: 0 })
    expect(result.ltv).toBeNull()
    expect(result.ltvCacRatio).toBeNull()
  })

  it('calcule le ratio LTV:CAC', () => {
    const result = economicsOf()
    expect(result.ltvCacRatio).toBeCloseTo(400 / 50)
  })

  it('laisse le ratio non défini quand le CAC est nul', () => {
    const result = economicsOf({ cac: 0 })
    expect(result.ltvCacRatio).toBeNull()
  })

  it('calcule le payback en mois', () => {
    expect(economicsOf().paybackMonths).toBeCloseTo(50 / (15 * 0.8))
  })

  it('rend un payback nul pour une acquisition organique', () => {
    expect(economicsOf({ cac: 0 }).paybackMonths).toBe(0)
  })

  it('laisse le payback non défini quand la marge unitaire est nulle', () => {
    const result = economicsOf({ grossMargin: 0 })
    expect(result.paybackMonths).toBeNull()
  })

  it('calcule le NRR à partir du churn et de l expansion', () => {
    expect(economicsOf().nrr).toBeCloseTo(0.98)
    expect(economicsOf({ expansion: 0.05 }).nrr).toBeCloseTo(1.02)
  })
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/economics.test.ts
```

Attendu : échec, `Failed to resolve import "./economics"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/engine/economics.ts` :

```ts
import type { Economics, Revenue, SimulatorInputs } from './types'

export function computeEconomics(inputs: SimulatorInputs, revenue: Revenue): Economics {
  const unitMargin = revenue.arpu * inputs.grossMargin

  const ltv = inputs.revenueChurn > 0 ? unitMargin / inputs.revenueChurn : null
  const ltvCacRatio = ltv !== null && inputs.cac > 0 ? ltv / inputs.cac : null
  const paybackMonths = unitMargin > 0 ? inputs.cac / unitMargin : null
  const nrr = 1 - inputs.revenueChurn + inputs.expansion

  return { ltv, ltvCacRatio, paybackMonths, nrr }
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/economics.test.ts
```

Attendu : `Test Files 1 passed`, 9 tests passés.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/economics.ts src/lib/engine/economics.test.ts
git commit -m "feat(engine): LTV, ratio LTV:CAC, payback et NRR"
```

---

### Task 7: Croissance, plafond et projection

**Files:**
- Create: `src/lib/engine/projection.ts`
- Test: `src/lib/engine/projection.test.ts`

**Interfaces:**
- Consumes: `SimulatorInputs`, `Revenue`, `Growth` de `types.ts` ; `PROJECTION_MONTHS` de `benchmarks.ts`
- Produces: `computeGrowth(inputs, revenue): Growth`, `computeProjection(inputs, revenue): number[]`

Le plafond de MRR est l'idée centrale de l'application : avec un churn net positif, la récurrence converge vers `newMrr / netChurn`. Le test de convergence est le plus important de ce fichier.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/engine/projection.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { computeGrowth, computeProjection } from './projection'
import { computeRevenue } from './revenue'
import type { SimulatorInputs } from './types'

function inputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    tiers: [
      { name: 'Starter', price: 10, mix: 0.5 },
      { name: 'Pro', price: 20, mix: 0.5 },
      { name: 'Scale', price: 100, mix: 0 },
    ],
    customers: 100,
    newCustomersPerMonth: 10,
    cac: 50,
    revenueChurn: 0.05,
    expansion: 0,
    grossMargin: 0.8,
    fixedCosts: 500,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.1,
    ageMonths: 24,
    baseMultipleOverride: null,
    ...overrides,
  }
}

function growthOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  return computeGrowth(i, computeRevenue(i))
}

function projectionOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  return computeProjection(i, computeRevenue(i))
}

describe('computeGrowth', () => {
  it('calcule le churn net', () => {
    expect(growthOf({ revenueChurn: 0.05, expansion: 0.02 }).netChurn).toBeCloseTo(0.03)
  })

  it('calcule le plafond de MRR', () => {
    expect(growthOf().mrrCeiling).toBeCloseTo(150 / 0.05)
  })

  it('supprime le plafond quand la rétention nette est négative', () => {
    expect(growthOf({ revenueChurn: 0.02, expansion: 0.03 }).mrrCeiling).toBeNull()
  })

  it('supprime le plafond quand le churn net est exactement nul', () => {
    expect(growthOf({ revenueChurn: 0.03, expansion: 0.03 }).mrrCeiling).toBeNull()
  })

  it('calcule la croissance mensuelle instantanée', () => {
    expect(growthOf().growthMoM).toBeCloseTo((150 - 1500 * 0.05) / 1500)
  })

  it('annualise la croissance de façon composée', () => {
    const g = growthOf()
    expect(g.growthAnnual).toBeCloseTo((1 + g.growthMoM) ** 12 - 1)
  })

  it('exprime la Rule of 40 en points', () => {
    const i = inputs()
    const revenue = computeRevenue(i)
    const g = computeGrowth(i, revenue)
    expect(g.ruleOf40).toBeCloseTo(g.growthAnnual * 100 + revenue.netMargin * 100)
  })

  it('rend une croissance nulle plutôt que NaN quand le MRR est nul', () => {
    expect(growthOf({ customers: 0 }).growthMoM).toBe(0)
  })
})

describe('computeProjection', () => {
  it('rend 37 points, du mois 0 au mois 36', () => {
    const series = projectionOf()
    expect(series).toHaveLength(37)
  })

  it('démarre au MRR courant', () => {
    expect(projectionOf()[0]).toBeCloseTo(1500)
  })

  it('applique la récurrence de la spec au premier pas', () => {
    expect(projectionOf()[1]).toBeCloseTo(1500 * 0.95 + 150)
  })

  it('converge vers le plafond quand le churn net est positif', () => {
    const series = projectionOf({ customers: 1 })
    const ceiling = 150 / 0.05
    expect(series[36]).toBeGreaterThan(ceiling * 0.8)
    expect(series[36]).toBeLessThan(ceiling)
  })

  it('approche le plafond par le haut quand on démarre au-dessus', () => {
    const series = projectionOf({ customers: 1000 })
    const ceiling = 150 / 0.05
    expect(series[0]).toBeGreaterThan(ceiling)
    expect(series[36]).toBeLessThan(series[0])
    expect(series[36]).toBeGreaterThan(ceiling)
  })

  it('croît sans borne quand la rétention nette est négative', () => {
    const series = projectionOf({ revenueChurn: 0.02, expansion: 0.04 })
    expect(series[36]).toBeGreaterThan(series[18])
    expect(series[18]).toBeGreaterThan(series[0])
  })

  it('ne descend jamais sous zéro', () => {
    const series = projectionOf({ customers: 0, newCustomersPerMonth: 0 })
    expect(series.every((value) => value >= 0)).toBe(true)
  })
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/projection.test.ts
```

Attendu : échec, `Failed to resolve import "./projection"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/engine/projection.ts` :

```ts
import { PROJECTION_MONTHS } from './benchmarks'
import type { Growth, Revenue, SimulatorInputs } from './types'

export function computeGrowth(inputs: SimulatorInputs, revenue: Revenue): Growth {
  const netChurn = inputs.revenueChurn - inputs.expansion

  // Point fixe de la récurrence : mrr* × netChurn = newMrr.
  // À rétention nette négative ou nulle, il n'y a pas de plafond.
  const mrrCeiling = netChurn > 0 ? revenue.newMrr / netChurn : null

  const growthMoM = revenue.mrr > 0 ? (revenue.newMrr - revenue.mrr * netChurn) / revenue.mrr : 0
  const growthAnnual = (1 + growthMoM) ** 12 - 1
  const ruleOf40 = growthAnnual * 100 + revenue.netMargin * 100

  return { netChurn, mrrCeiling, growthMoM, growthAnnual, ruleOf40 }
}

export function computeProjection(inputs: SimulatorInputs, revenue: Revenue): number[] {
  const retention = 1 - inputs.revenueChurn + inputs.expansion
  const series: number[] = [revenue.mrr]

  for (let month = 1; month <= PROJECTION_MONTHS; month++) {
    const next = series[month - 1] * retention + revenue.newMrr
    series.push(Math.max(0, next))
  }

  return series
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/projection.test.ts
```

Attendu : `Test Files 1 passed`, 15 tests passés.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/projection.ts src/lib/engine/projection.test.ts
git commit -m "feat(engine): croissance, plafond de MRR et projection 36 mois"
```

---

### Task 8: Valorisation

**Files:**
- Create: `src/lib/engine/valuation.ts`
- Test: `src/lib/engine/valuation.test.ts`

**Interfaces:**
- Consumes: `SimulatorInputs`, `Revenue`, `Economics`, `Growth`, `Valuation`, `ValuationLine`, `ProfileLabel` de `types.ts` ; `clamp`, `interpolate`, `smoothstep` de `interpolate.ts` ; l'ensemble des constantes de `benchmarks.ts`
- Produces: `profileLabelFor(mrr: number): ProfileLabel`, `computeValuation(inputs, revenue, economics, growth): Valuation`

Trois points méritent attention.

Le **multiple de base est unique**, obtenu en mélangeant les deux courbes avec le même poids `w` que les montants : `baseMultiple = (1 − w) × baseSde + w × baseArr`. Un seul multiple, donc une seule décomposition affichable, et aucune discontinuité au passage d'une base à l'autre.

Les **`deltaMultiple` sont calculés sur le cumul non écrêté**, afin que `baseMultiple + Σ deltaMultiple` reconcilie exactement avec le multiple avant écrêtage. L'écrêtage a sa propre ligne d'affichage ; le mêler aux lignes de critères rendrait le total incohérent.

Les **libellés de profil ne participent à aucun calcul.** Ils utilisent des seuils durs, ce qui est sans danger : changer un libellé de badge ne déplace pas un euro.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/engine/valuation.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { computeEconomics } from './economics'
import { computeGrowth } from './projection'
import { computeRevenue } from './revenue'
import { computeValuation, profileLabelFor } from './valuation'
import { ADJ_SUM_MAX, MULTIPLE_MAX, MULTIPLE_MIN } from './benchmarks'
import type { SimulatorInputs } from './types'

function inputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    tiers: [
      { name: 'Starter', price: 9, mix: 0.4 },
      { name: 'Pro', price: 29, mix: 0.5 },
      { name: 'Scale', price: 79, mix: 0.1 },
    ],
    customers: 700,
    newCustomersPerMonth: 40,
    cac: 180,
    revenueChurn: 0.025,
    expansion: 0.008,
    grossMargin: 0.85,
    fixedCosts: 3000,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.08,
    ageMonths: 30,
    baseMultipleOverride: null,
    ...overrides,
  }
}

function valuationOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  const revenue = computeRevenue(i)
  const growth = computeGrowth(i, revenue)
  const economics = computeEconomics(i, revenue)
  return { valuation: computeValuation(i, revenue, economics, growth), revenue }
}

describe('profileLabelFor', () => {
  it('étiquette selon les paliers de la spec', () => {
    expect(profileLabelFor(2000)).toBe('micro')
    expect(profileLabelFor(5000)).toBe('bootstrapped')
    expect(profileLabelFor(99_000)).toBe('bootstrapped')
    expect(profileLabelFor(100_000)).toBe('established')
  })
})

describe('computeValuation — décomposition', () => {
  it('produit une ligne par critère du barème', () => {
    const { valuation } = valuationOf()
    expect(valuation.lines).toHaveLength(9)
    expect(valuation.lines.map((line) => line.key)).toContain('founderDependency')
  })

  it('réconcilie la somme des lignes avec le multiple, hors écrêtage', () => {
    const { valuation } = valuationOf()
    expect(valuation.adjClamped).toBe(false)
    expect(valuation.multipleClamped).toBe(false)
    const sum = valuation.lines.reduce((total, line) => total + line.deltaMultiple, 0)
    expect(valuation.baseMultiple + sum).toBeCloseTo(valuation.multiple, 6)
  })

  it('convertit chaque delta en points de multiple sur la base', () => {
    const { valuation } = valuationOf()
    for (const line of valuation.lines) {
      expect(line.deltaMultiple).toBeCloseTo(valuation.baseMultiple * line.deltaPct, 9)
    }
  })

  it('conserve les lignes à delta nul', () => {
    const { valuation } = valuationOf({ founderDependency: 'medium' })
    const line = valuation.lines.find((candidate) => candidate.key === 'founderDependency')
    expect(line).toBeDefined()
    expect(line?.deltaPct).toBe(0)
  })
})

describe('computeValuation — multiple', () => {
  it('récompense un churn faible par rapport à un churn fort', () => {
    const low = valuationOf({ revenueChurn: 0.01 }).valuation.multiple
    const high = valuationOf({ revenueChurn: 0.1 }).valuation.multiple
    expect(low).toBeGreaterThan(high)
  })

  it('pénalise une forte dépendance au fondateur', () => {
    const independent = valuationOf({ founderDependency: 'low' }).valuation.multiple
    const dependent = valuationOf({ founderDependency: 'high' }).valuation.multiple
    expect(independent).toBeGreaterThan(dependent)
  })

  it('écrête le cumul des deltas quand tout est optimal', () => {
    const { valuation } = valuationOf({
      revenueChurn: 0,
      expansion: 0.09,
      grossMargin: 0.95,
      topClientShare: 0,
      ageMonths: 96,
      founderDependency: 'low',
      techTransferability: 'high',
      newCustomersPerMonth: 400,
    })
    expect(valuation.adjClamped).toBe(true)
    expect(valuation.adjSum).toBeCloseTo(ADJ_SUM_MAX)
  })

  it('maintient le multiple dans ses bornes absolues', () => {
    const { valuation } = valuationOf({ revenueChurn: 0.15, grossMargin: 0.5, ageMonths: 0 })
    expect(valuation.multiple).toBeGreaterThanOrEqual(MULTIPLE_MIN)
    expect(valuation.multiple).toBeLessThanOrEqual(MULTIPLE_MAX)
  })

  it('respecte la surcharge du multiple de base', () => {
    const { valuation } = valuationOf({ baseMultipleOverride: 6 })
    expect(valuation.isOverridden).toBe(true)
    expect(valuation.baseMultiple).toBe(6)
  })

  it('suit la courbe quand la surcharge est nulle', () => {
    const { valuation } = valuationOf({ baseMultipleOverride: null })
    expect(valuation.isOverridden).toBe(false)
    expect(valuation.baseMultiple).toBeGreaterThan(2)
    expect(valuation.baseMultiple).toBeLessThan(5)
  })
})

describe('computeValuation — montants', () => {
  it('valorise sur le SDE seul en dessous de la zone de fondu', () => {
    const { valuation } = valuationOf()
    expect(valuation.arrWeight).toBe(0)
    expect(valuation.value).toBeCloseTo(valuation.valuationSde)
  })

  it('valorise sur l ARR seul au-dessus de la zone de fondu', () => {
    const { valuation } = valuationOf({ customers: 20_000 })
    expect(valuation.arrWeight).toBe(1)
    expect(valuation.value).toBeCloseTo(valuation.valuationArr)
  })

  it('mélange les deux bases dans la zone de fondu', () => {
    const { valuation, revenue } = valuationOf({ customers: 3800 })
    expect(revenue.mrr).toBeGreaterThan(60_000)
    expect(revenue.mrr).toBeLessThan(140_000)
    expect(valuation.arrWeight).toBeGreaterThan(0)
    expect(valuation.arrWeight).toBeLessThan(1)
  })

  it('annule la composante SDE d un actif déficitaire au lieu de la rendre négative', () => {
    const { valuation } = valuationOf({ fixedCosts: 100_000 })
    expect(valuation.isLossMaking).toBe(true)
    expect(valuation.valuationSde).toBe(0)
    expect(valuation.value).toBeGreaterThanOrEqual(0)
  })

  it('encadre la valeur par une fourchette symétrique', () => {
    const { valuation } = valuationOf()
    expect(valuation.low).toBeCloseTo(valuation.value * 0.85)
    expect(valuation.high).toBeCloseTo(valuation.value * 1.15)
  })
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/valuation.test.ts
```

Attendu : échec, `Failed to resolve import "./valuation"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/engine/valuation.ts` :

```ts
import {
  ADJ_SUM_MAX,
  ADJ_SUM_MIN,
  ADJUSTMENT_ANCHORS,
  ARR_BASE_ANCHORS,
  ARR_BLEND_FROM,
  ARR_BLEND_TO,
  LEVEL_DELTAS,
  MULTIPLE_MAX,
  MULTIPLE_MIN,
  SDE_BASE_ANCHORS,
  VALUATION_SPREAD,
} from './benchmarks'
import { clamp, interpolate, smoothstep } from './interpolate'
import type {
  Economics,
  Growth,
  ProfileLabel,
  Revenue,
  SimulatorInputs,
  Valuation,
  ValuationLine,
} from './types'

/** Purement cosmétique : ces seuils ne participent à aucun calcul. */
export function profileLabelFor(mrr: number): ProfileLabel {
  if (mrr < 5_000) return 'micro'
  return mrr < 100_000 ? 'bootstrapped' : 'established'
}

export function computeValuation(
  inputs: SimulatorInputs,
  revenue: Revenue,
  economics: Economics,
  growth: Growth,
): Valuation {
  // Poids de la base ARR. smoothstep a une dérivée nulle aux bornes :
  // la bascule profit → revenu est lisse, sans coude visible.
  const arrWeight = smoothstep(ARR_BLEND_FROM, ARR_BLEND_TO, revenue.mrr)

  const baseSde = interpolate(SDE_BASE_ANCHORS, Math.log10(Math.max(revenue.mrr, 1)))
  const baseArr = interpolate(ARR_BASE_ANCHORS, Math.log10(Math.max(revenue.arr, 1)))
  const curveBase = (1 - arrWeight) * baseSde + arrWeight * baseArr

  const baseMultiple = inputs.baseMultipleOverride ?? curveBase
  const isOverridden = inputs.baseMultipleOverride !== null

  const deltas: Array<Pick<ValuationLine, 'key' | 'label' | 'deltaPct'>> = [
    {
      key: 'revenueChurn',
      label: 'Churn',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.revenueChurn, inputs.revenueChurn),
    },
    {
      key: 'growthMoM',
      label: 'Croissance mensuelle',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.growthMoM, growth.growthMoM),
    },
    { key: 'nrr', label: 'NRR', deltaPct: interpolate(ADJUSTMENT_ANCHORS.nrr, economics.nrr) },
    {
      key: 'ruleOf40',
      label: 'Rule of 40',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.ruleOf40, growth.ruleOf40),
    },
    {
      key: 'grossMargin',
      label: 'Marge brute',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.grossMargin, inputs.grossMargin),
    },
    {
      key: 'topClientShare',
      label: 'Concentration client',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.topClientShare, inputs.topClientShare),
    },
    {
      key: 'ageMonths',
      label: 'Ancienneté',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.ageMonths, inputs.ageMonths),
    },
    {
      key: 'founderDependency',
      label: 'Dépendance fondateur',
      deltaPct: LEVEL_DELTAS.founderDependency[inputs.founderDependency],
    },
    {
      key: 'techTransferability',
      label: 'Transférabilité technique',
      deltaPct: LEVEL_DELTAS.techTransferability[inputs.techTransferability],
    },
  ]

  // deltaMultiple est calculé sur le cumul non écrêté, pour que
  // baseMultiple + Σ deltaMultiple reconcilie avec le multiple avant écrêtage.
  const lines: ValuationLine[] = deltas.map((delta) => ({
    ...delta,
    deltaMultiple: baseMultiple * delta.deltaPct,
  }))

  const rawAdjSum = lines.reduce((total, line) => total + line.deltaPct, 0)
  const adjSum = clamp(rawAdjSum, ADJ_SUM_MIN, ADJ_SUM_MAX)
  const adjClamped = adjSum !== rawAdjSum

  const rawMultiple = baseMultiple * (1 + adjSum)
  const multiple = clamp(rawMultiple, MULTIPLE_MIN, MULTIPLE_MAX)
  const multipleClamped = multiple !== rawMultiple

  // Un actif déficitaire n'a pas une valeur de rendement négative : elle est nulle.
  const valuationSde = Math.max(0, multiple * revenue.sdeAnnual)
  const valuationArr = multiple * revenue.arr
  const value = (1 - arrWeight) * valuationSde + arrWeight * valuationArr

  return {
    baseMultiple,
    isOverridden,
    lines,
    adjSum,
    adjClamped,
    multiple,
    multipleClamped,
    arrWeight,
    valuationSde,
    valuationArr,
    value,
    low: value * (1 - VALUATION_SPREAD),
    high: value * (1 + VALUATION_SPREAD),
    profileLabel: profileLabelFor(revenue.mrr),
    isLossMaking: revenue.sdeAnnual <= 0,
  }
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/valuation.test.ts
```

Attendu : `Test Files 1 passed`, 16 tests passés.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/valuation.ts src/lib/engine/valuation.test.ts
git commit -m "feat(engine): multiple continu, fondu SDE/ARR et décomposition"
```

---

### Task 9: Orchestration et test de continuité globale

**Files:**
- Create: `src/lib/engine/index.ts`, `src/lib/defaults.ts`
- Test: `src/lib/engine/index.test.ts`

**Interfaces:**
- Consumes: toutes les fonctions des tâches 5 à 8
- Produces: `compute(inputs: SimulatorInputs): SimulatorResults`, `DEFAULT_INPUTS: SimulatorInputs`, et la ré-exportation publique des types et de `healthOf`

C'est la tâche qui verrouille la contrainte de continuité. Le test de balayage parcourt chaque jauge sur tout son domaine et échoue si la valorisation saute. C'est lui qui aurait révélé la bascule par seuil dur écartée pendant la conception.

Le seuil de 2 % est choisi pour discriminer sans être fragile : un pas de balayage fait varier la valorisation de bien moins de 1 % dans les conditions normales, alors qu'une bascule de base produirait un saut de plusieurs dizaines de points.

- [ ] **Step 1: Écrire `DEFAULT_INPUTS`**

Créer `src/lib/defaults.ts` :

```ts
import type { SimulatorInputs } from '@/lib/engine/types'

export const DEFAULT_INPUTS: SimulatorInputs = {
  tiers: [
    { name: 'Starter', price: 9, mix: 0.4 },
    { name: 'Pro', price: 29, mix: 0.5 },
    { name: 'Scale', price: 79, mix: 0.1 },
  ],
  customers: 760,
  newCustomersPerMonth: 45,
  cac: 180,
  revenueChurn: 0.021,
  expansion: 0.008,
  grossMargin: 0.85,
  fixedCosts: 3_500,
  founderDependency: 'medium',
  techTransferability: 'medium',
  topClientShare: 0.08,
  ageMonths: 30,
  baseMultipleOverride: null,
}
```

- [ ] **Step 2: Écrire les tests**

Créer `src/lib/engine/index.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { compute } from './index'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import type { SimulatorInputs } from './types'

function withInput(patch: Partial<SimulatorInputs>): SimulatorInputs {
  return { ...DEFAULT_INPUTS, ...patch }
}

/** Plus grand saut relatif entre deux pas consécutifs. */
function maxRelativeJump(values: number[]): number {
  let worst = 0
  for (let i = 1; i < values.length; i++) {
    const scale = Math.max(Math.abs(values[i]), Math.abs(values[i - 1]), 1_000)
    worst = Math.max(worst, Math.abs(values[i] - values[i - 1]) / scale)
  }
  return worst
}

function sweepValuation(
  apply: (x: number) => SimulatorInputs,
  from: number,
  to: number,
  steps = 1_500,
): number[] {
  const values: number[] = []
  for (let i = 0; i <= steps; i++) {
    values.push(compute(apply(from + ((to - from) * i) / steps)).valuation.value)
  }
  return values
}

describe('compute', () => {
  it('assemble toutes les composantes du résultat', () => {
    const results = compute(DEFAULT_INPUTS)
    expect(results.revenue.mrr).toBeGreaterThan(0)
    expect(results.economics.ltv).not.toBeNull()
    expect(results.growth.mrrCeiling).not.toBeNull()
    expect(results.projection).toHaveLength(37)
    expect(results.valuation.value).toBeGreaterThan(0)
  })

  it('est une fonction pure : deux appels identiques rendent le même résultat', () => {
    expect(compute(DEFAULT_INPUTS)).toEqual(compute(DEFAULT_INPUTS))
  })

  it('ne mute pas ses entrées', () => {
    const snapshot = structuredClone(DEFAULT_INPUTS)
    compute(DEFAULT_INPUTS)
    expect(DEFAULT_INPUTS).toEqual(snapshot)
  })

  it('ne produit jamais NaN sur des entrées dégénérées', () => {
    const results = compute(
      withInput({
        customers: 0,
        newCustomersPerMonth: 0,
        revenueChurn: 0,
        expansion: 0,
        grossMargin: 0,
        cac: 0,
        tiers: [
          { name: 'A', price: 0, mix: 0 },
          { name: 'B', price: 0, mix: 0 },
          { name: 'C', price: 0, mix: 0 },
        ],
      }),
    )
    expect(Number.isNaN(results.valuation.value)).toBe(false)
    expect(Number.isFinite(results.valuation.multiple)).toBe(true)
    expect(results.projection.every(Number.isFinite)).toBe(true)
  })

  it('ne rend jamais une valorisation négative', () => {
    const results = compute(withInput({ fixedCosts: 100_000, cac: 2_000 }))
    expect(results.valuation.value).toBeGreaterThanOrEqual(0)
  })
})

describe('continuité de la valorisation', () => {
  it('reste continue en balayant le nombre de clients à travers la zone de fondu', () => {
    const values = sweepValuation((x) => withInput({ customers: Math.round(x) }), 0, 20_000, 3_000)
    expect(maxRelativeJump(values)).toBeLessThan(0.02)
  })

  it('reste continue en balayant le churn', () => {
    expect(
      maxRelativeJump(sweepValuation((x) => withInput({ revenueChurn: x }), 0, 0.15)),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant l expansion', () => {
    expect(
      maxRelativeJump(sweepValuation((x) => withInput({ expansion: x }), 0, 0.1)),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant le prix du plan Pro', () => {
    expect(
      maxRelativeJump(
        sweepValuation(
          (x) =>
            withInput({
              tiers: [
                DEFAULT_INPUTS.tiers[0],
                { ...DEFAULT_INPUTS.tiers[1], price: x },
                DEFAULT_INPUTS.tiers[2],
              ],
            }),
          0,
          500,
        ),
      ),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant le mix du plan Scale', () => {
    expect(
      maxRelativeJump(
        sweepValuation(
          (x) =>
            withInput({
              tiers: [
                DEFAULT_INPUTS.tiers[0],
                DEFAULT_INPUTS.tiers[1],
                { ...DEFAULT_INPUTS.tiers[2], mix: x },
              ],
            }),
          0,
          1,
        ),
      ),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant le CAC à travers le passage en perte', () => {
    expect(maxRelativeJump(sweepValuation((x) => withInput({ cac: x }), 0, 2_000))).toBeLessThan(0.02)
  })

  it('reste continue en balayant les charges fixes à travers le passage en perte', () => {
    expect(
      maxRelativeJump(sweepValuation((x) => withInput({ fixedCosts: x }), 0, 100_000)),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant la marge brute', () => {
    expect(
      maxRelativeJump(sweepValuation((x) => withInput({ grossMargin: x }), 0.5, 0.99)),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant l acquisition', () => {
    expect(
      maxRelativeJump(
        sweepValuation((x) => withInput({ newCustomersPerMonth: Math.round(x) }), 0, 1_000),
      ),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant la concentration client', () => {
    expect(
      maxRelativeJump(sweepValuation((x) => withInput({ topClientShare: x }), 0, 0.6)),
    ).toBeLessThan(0.02)
  })

  it('reste continue en balayant l ancienneté', () => {
    expect(
      maxRelativeJump(sweepValuation((x) => withInput({ ageMonths: x }), 0, 96)),
    ).toBeLessThan(0.02)
  })
})
```

- [ ] **Step 3: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/index.test.ts
```

Attendu : échec, `Failed to resolve import "./index"`.

- [ ] **Step 4: Écrire l'orchestration**

Créer `src/lib/engine/index.ts` :

```ts
import { computeEconomics } from './economics'
import { computeGrowth, computeProjection } from './projection'
import { computeRevenue } from './revenue'
import { computeValuation } from './valuation'
import type { SimulatorInputs, SimulatorResults } from './types'

/**
 * Seul point d'entrée public du moteur. Fonction pure : aucune mutation
 * de l'argument, aucun effet de bord, aucun accès au temps ou au hasard.
 */
export function compute(inputs: SimulatorInputs): SimulatorResults {
  const revenue = computeRevenue(inputs)
  const economics = computeEconomics(inputs, revenue)
  const growth = computeGrowth(inputs, revenue)
  const projection = computeProjection(inputs, revenue)
  const valuation = computeValuation(inputs, revenue, economics, growth)

  return { revenue, economics, growth, projection, valuation }
}

export { healthOf, priceZoneFor, HEALTH_THRESHOLDS, PRICE_ZONES } from './benchmarks'
export type { HealthMetric, PriceZone } from './benchmarks'
export * from './types'
```

- [ ] **Step 5: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/engine/index.test.ts
```

Attendu : `Test Files 1 passed`, 16 tests passés. Si un test de continuité échoue, c'est qu'un branchement par seuil s'est glissé dans le moteur — corriger le moteur, jamais le seuil du test.

- [ ] **Step 6: Lancer toute la suite**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run
```

Attendu : 7 fichiers de test, 107 tests passés.

- [ ] **Step 7: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/engine/index.ts src/lib/engine/index.test.ts src/lib/defaults.ts
git commit -m "feat(engine): compute() et test de continuité par balayage"
```

---

### Task 10: Formatage, échelle logarithmique et partage par URL

**Files:**
- Create: `src/lib/format.ts`, `src/lib/logScale.ts`, `src/lib/urlState.ts`
- Test: `src/lib/logScale.test.ts`, `src/lib/urlState.test.ts`

**Interfaces:**
- Consumes: `SimulatorInputs` de `@/lib/engine/types`, `DEFAULT_INPUTS` de `@/lib/defaults`
- Produces: `formatCurrency`, `formatCompactCurrency`, `formatPercent`, `formatMultiple`, `formatMonths`, `formatNullable` ; `LOG_STEPS`, `positionToValue(position, max)`, `valueToPosition(value, max)` ; `encodeInputs(inputs)`, `decodeInputs(fragment)`, `readInputsFromHash()`, `buildShareUrl(inputs)`

`format.ts` n'est pas testé : ce sont des enveloppes minces autour de `Intl`, dont le comportement varie avec la version d'ICU. Les tester reviendrait à tester la plateforme.

`decodeInputs` doit être défensif : un fragment tronqué, tronqué au copier-coller ou produit par une version antérieure ne doit jamais casser l'écran.

- [ ] **Step 1: Écrire le formatage**

Créer `src/lib/format.ts` :

```ts
const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currency.format(Math.round(value))
}

export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits).replace('.', ',')} %`
}

export function formatMultiple(value: number, signed = false): string {
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2).replace('.', ',')}×`
}

export function formatMonths(value: number): string {
  return `${Math.round(value)} mois`
}

/** Rend le tiret cadratin pour une grandeur non définie, jamais un zéro inventé. */
export function formatNullable(value: number | null, format: (v: number) => string): string {
  return value === null || !Number.isFinite(value) ? '—' : format(value)
}
```

- [ ] **Step 2: Écrire les tests de l'échelle logarithmique**

Créer `src/lib/logScale.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { LOG_STEPS, positionToValue, valueToPosition } from './logScale'

describe('positionToValue', () => {
  it('rend exactement 0 à la position 0', () => {
    expect(positionToValue(0, 20_000)).toBe(0)
  })

  it('rend 1 à la première position non nulle', () => {
    expect(positionToValue(1, 20_000)).toBe(1)
  })

  it('rend le maximum à la dernière position', () => {
    expect(positionToValue(LOG_STEPS, 20_000)).toBe(20_000)
  })

  it('croît de façon monotone', () => {
    let previous = -1
    for (let position = 0; position <= LOG_STEPS; position++) {
      const value = positionToValue(position, 20_000)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('donne une résolution fine dans le bas de l échelle', () => {
    expect(positionToValue(Math.round(LOG_STEPS / 2), 20_000)).toBeLessThan(200)
  })

  it('rend des entiers', () => {
    for (const position of [7, 55, 123, 200]) {
      expect(Number.isInteger(positionToValue(position, 20_000))).toBe(true)
    }
  })
})

describe('valueToPosition', () => {
  it('est l inverse de positionToValue aux extrémités', () => {
    expect(valueToPosition(0, 20_000)).toBe(0)
    expect(valueToPosition(20_000, 20_000)).toBe(LOG_STEPS)
  })

  it('fait un aller-retour stable', () => {
    for (const value of [1, 12, 340, 5_000, 20_000]) {
      const roundTrip = positionToValue(valueToPosition(value, 20_000), 20_000)
      expect(Math.abs(roundTrip - value) / Math.max(value, 1)).toBeLessThan(0.05)
    }
  })

  it('écrête une valeur hors bornes', () => {
    expect(valueToPosition(-10, 20_000)).toBe(0)
    expect(valueToPosition(99_999, 20_000)).toBe(LOG_STEPS)
  })
})
```

- [ ] **Step 3: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/logScale.test.ts
```

Attendu : échec, `Failed to resolve import "./logScale"`.

- [ ] **Step 4: Écrire l'échelle logarithmique**

Créer `src/lib/logScale.ts` :

```ts
/**
 * Les jauges de volume couvrent quatre ordres de grandeur. Une échelle
 * linéaire rendrait impossible le réglage fin sous 500, qui est la zone
 * la plus fréquente. Le logarithme n'étant pas défini en 0, la position 0
 * est réservée à la valeur 0 et les positions 1..LOG_STEPS couvrent [1, max].
 */
export const LOG_STEPS = 240

export function positionToValue(position: number, max: number): number {
  if (position <= 0) return 0
  const t = Math.min(position - 1, LOG_STEPS - 1) / (LOG_STEPS - 1)
  return Math.round(max ** t)
}

export function valueToPosition(value: number, max: number): number {
  if (value <= 0) return 0
  if (value >= max) return LOG_STEPS
  const t = Math.log10(value) / Math.log10(max)
  return Math.round(t * (LOG_STEPS - 1)) + 1
}
```

- [ ] **Step 5: Lancer les tests pour les voir passer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/logScale.test.ts
```

Attendu : `Test Files 1 passed`, 9 tests passés.

- [ ] **Step 6: Écrire les tests du partage par URL**

Créer `src/lib/urlState.test.ts` :

```ts
import { describe, expect, it } from 'vitest'
import { decodeInputs, encodeInputs } from './urlState'
import { DEFAULT_INPUTS } from './defaults'

describe('encodeInputs / decodeInputs', () => {
  it('fait un aller-retour sans perte', () => {
    expect(decodeInputs(encodeInputs(DEFAULT_INPUTS))).toEqual(DEFAULT_INPUTS)
  })

  it('préserve une surcharge de multiple', () => {
    const inputs = { ...DEFAULT_INPUTS, baseMultipleOverride: 5.5 }
    expect(decodeInputs(encodeInputs(inputs))?.baseMultipleOverride).toBe(5.5)
  })

  it('produit un fragment sûr pour une URL', () => {
    expect(encodeInputs(DEFAULT_INPUTS)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rend null sur un fragment illisible plutôt que de lever', () => {
    expect(decodeInputs('pas-du-base64-valide!!')).toBeNull()
    expect(decodeInputs('')).toBeNull()
    expect(decodeInputs('YWJj')).toBeNull()
  })

  it('rend null sur un objet de forme inattendue', () => {
    const truncated = btoa(JSON.stringify({ customers: 10 }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(decodeInputs(truncated)).toBeNull()
  })

  it('rend null quand le nombre de plans est incorrect', () => {
    const wrongTiers = { ...DEFAULT_INPUTS, tiers: [DEFAULT_INPUTS.tiers[0]] }
    expect(decodeInputs(encodeInputs(wrongTiers as never))).toBeNull()
  })
})
```

- [ ] **Step 7: Lancer les tests pour les voir échouer**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/urlState.test.ts
```

Attendu : échec, `Failed to resolve import "./urlState"`.

- [ ] **Step 8: Écrire le partage par URL**

Créer `src/lib/urlState.ts` :

```ts
import type { Level, SimulatorInputs, Tier } from '@/lib/engine/types'

/**
 * L'état voyage dans le fragment et non dans la query : un fragment n'est
 * jamais transmis au serveur ni journalisé, et les hypothèses financières
 * d'un actif n'ont rien à faire dans des logs.
 */
const HASH_KEY = 's'
const LEVELS: Level[] = ['low', 'medium', 'high']

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
}

export function encodeInputs(inputs: SimulatorInputs): string {
  return toBase64Url(JSON.stringify(inputs))
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTier(value: unknown): value is Tier {
  if (typeof value !== 'object' || value === null) return false
  const tier = value as Record<string, unknown>
  return typeof tier.name === 'string' && isNumber(tier.price) && isNumber(tier.mix)
}

/** Rend `null` sur toute entrée douteuse : un lien périmé ne casse pas l'écran. */
export function decodeInputs(fragment: string): SimulatorInputs | null {
  if (!fragment) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(fromBase64Url(fragment))
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Record<string, unknown>

  if (!Array.isArray(candidate.tiers) || candidate.tiers.length !== 3) return null
  if (!candidate.tiers.every(isTier)) return null

  const numericKeys = [
    'customers',
    'newCustomersPerMonth',
    'cac',
    'revenueChurn',
    'expansion',
    'grossMargin',
    'fixedCosts',
    'topClientShare',
    'ageMonths',
  ] as const
  if (!numericKeys.every((key) => isNumber(candidate[key]))) return null

  if (!LEVELS.includes(candidate.founderDependency as Level)) return null
  if (!LEVELS.includes(candidate.techTransferability as Level)) return null

  const override = candidate.baseMultipleOverride
  if (override !== null && !isNumber(override)) return null

  return candidate as unknown as SimulatorInputs
}

export function readInputsFromHash(): SimulatorInputs | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fragment = params.get(HASH_KEY)
  return fragment ? decodeInputs(fragment) : null
}

export function buildShareUrl(inputs: SimulatorInputs): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${HASH_KEY}=${encodeInputs(inputs)}`
}
```

- [ ] **Step 9: Lancer les tests pour les voir passer**

Le décodage utilise `btoa` / `atob`, absents de l'environnement `node` de Vitest sur les runtimes anciens mais présents sur Node 18+. Vérifier :

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run src/lib/urlState.test.ts
```

Attendu : `Test Files 1 passed`, 6 tests passés.

- [ ] **Step 10: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/format.ts src/lib/logScale.ts src/lib/logScale.test.ts src/lib/urlState.ts src/lib/urlState.test.ts
git commit -m "feat: formatage fr-FR, échelle logarithmique et partage par fragment"
```

---

### Task 11: Store Zustand

**Files:**
- Create: `src/store/simulator.ts`

**Interfaces:**
- Consumes: `DEFAULT_INPUTS`, `readInputsFromHash`, `compute`, `SimulatorInputs`, `SimulatorResults`
- Produces: `useSimulator()` avec `{ inputs, scenarios, theme, setInput, setTier, resetInputs, pinScenario, removeScenario, setTheme }` ; `useResults(): SimulatorResults`

Le store ne détient que les entrées. Les résultats sont dérivés à la lecture par `useResults`, ce qui garantit qu'ils ne peuvent jamais être désynchronisés. `compute` prend moins d'une milliseconde : mémoïser serait une complexité sans contrepartie.

Les scénarios ne stockent que `SimulatorInputs`. Un scénario épinglé avant une révision du barème se recalcule donc avec le barème courant, ce qui est la seule sémantique cohérente pour un outil de comparaison.

- [ ] **Step 1: Écrire le store**

Créer `src/store/simulator.ts` :

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { compute } from '@/lib/engine'
import type { SimulatorInputs, SimulatorResults, Tier } from '@/lib/engine/types'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import { readInputsFromHash } from '@/lib/urlState'

export interface Scenario {
  id: string
  name: string
  inputs: SimulatorInputs
}

export const MAX_SCENARIOS = 3

interface SimulatorState {
  inputs: SimulatorInputs
  scenarios: Scenario[]
  theme: 'light' | 'dark'
  setInput: <K extends keyof SimulatorInputs>(key: K, value: SimulatorInputs[K]) => void
  setTier: (index: 0 | 1 | 2, patch: Partial<Tier>) => void
  resetInputs: () => void
  pinScenario: (name: string) => void
  removeScenario: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
}

function initialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useSimulator = create<SimulatorState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      scenarios: [],
      theme: initialTheme(),

      setInput: (key, value) => set((state) => ({ inputs: { ...state.inputs, [key]: value } })),

      setTier: (index, patch) =>
        set((state) => {
          const tiers = [...state.inputs.tiers] as SimulatorInputs['tiers']
          tiers[index] = { ...tiers[index], ...patch }
          return { inputs: { ...state.inputs, tiers } }
        }),

      resetInputs: () => set({ inputs: DEFAULT_INPUTS }),

      pinScenario: (name) =>
        set((state) => {
          if (state.scenarios.length >= MAX_SCENARIOS) return state
          const id = `${name}-${state.scenarios.length}-${state.inputs.customers}`
          return { scenarios: [...state.scenarios, { id, name, inputs: state.inputs }] }
        }),

      removeScenario: (id) =>
        set((state) => ({ scenarios: state.scenarios.filter((scenario) => scenario.id !== id) })),

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
    }),
    {
      // Clé versionnée : une évolution du schéma d'entrée invalide les
      // scénarios existants plutôt que de tenter une migration hasardeuse.
      name: 'saas-simulator:v1',
      partialize: (state) => ({ scenarios: state.scenarios, theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) document.documentElement.classList.toggle('dark', state.theme === 'dark')
      },
    },
  ),
)

/** Un fragment de partage prime sur les valeurs par défaut, au premier rendu seulement. */
export function applyHashInputs(): boolean {
  const fromHash = readInputsFromHash()
  if (!fromHash) return false
  useSimulator.setState({ inputs: fromHash })
  return true
}

export function useResults(): SimulatorResults {
  return compute(useSimulator((state) => state.inputs))
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/store/simulator.ts
git commit -m "feat(store): état Zustand, scénarios persistés et thème"
```

---

### Task 12: Jauge et plan tarifaire

**Files:**
- Modify: `src/components/ui/slider.tsx` (remplacement intégral)
- Create: `src/components/controls/GaugeRow.tsx`, `src/components/controls/TierRow.tsx`

**Interfaces:**
- Consumes: `LOG_STEPS`, `positionToValue`, `valueToPosition` de `@/lib/logScale` ; `Tier` de `@/lib/engine/types`
- Produces: `<GaugeRow>` avec les props `{ label, value, onChange, min?, max, step?, scale?, format, marker?, markerLabel?, hint? }` ; `<TierRow>` avec `{ tier, index, onChange }`

Le composant `Slider` généré par shadcn ne permet pas de nommer le curseur ni de lui donner un texte de valeur lisible, ce qu'exige l'accessibilité de la spec. On le remplace par une version équivalente qui forward `thumbLabel` et `thumbValueText` jusqu'au `Thumb` Radix, seul élément portant `role="slider"`.

Le repère de marché est positionné en pourcentage du rail. Un repère calculé qui sortirait de la plage de sa jauge est masqué plutôt qu'écrêté au bord : un tick collé à l'extrémité laisserait croire que la limite est atteinte.

- [ ] **Step 1: Remplacer le composant Slider**

Remplacer intégralement `src/components/ui/slider.tsx` :

```tsx
import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  /** Nom accessible du curseur. Radix ne le porte que sur le Thumb. */
  thumbLabel?: string
  /** Valeur lue par les lecteurs d'écran, formatée. */
  thumbValueText?: string
}

function Slider({ className, thumbLabel, thumbValueText, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        aria-valuetext={thumbValueText}
        className="block size-4 shrink-0 rounded-full border border-primary/50 bg-background shadow-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
```

- [ ] **Step 2: Écrire la jauge**

Créer `src/components/controls/GaugeRow.tsx` :

```tsx
import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { LOG_STEPS, positionToValue, valueToPosition } from '@/lib/logScale'

interface GaugeRowProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max: number
  step?: number
  scale?: 'linear' | 'log'
  format: (value: number) => string
  /**
   * Facteur appliqué dans le champ de saisie. Vaut 100 pour les jauges en
   * pourcentage, afin qu'on tape « 2,1 » et non « 0,021 ».
   */
  inputScale?: number
  /** Repère de marché, dans l'unité de la jauge. */
  marker?: number | null
  markerLabel?: string
  hint?: string
}

export function GaugeRow({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  scale = 'linear',
  format,
  inputScale = 1,
  marker = null,
  markerLabel,
  hint,
}: GaugeRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const isLog = scale === 'log'

  const sliderValue = isLog ? valueToPosition(value, max) : value
  const sliderMin = isLog ? 0 : min
  const sliderMax = isLog ? LOG_STEPS : max
  const sliderStep = isLog ? 1 : step

  function handleChange(next: number[]) {
    onChange(isLog ? positionToValue(next[0], max) : next[0])
  }

  function startEditing() {
    setDraft(String(Number((value * inputScale).toFixed(4))))
    setEditing(true)
  }

  /** Accepte la virgule décimale française, écrête aux bornes, ignore une saisie illisible. */
  function commitEditing() {
    const parsed = Number(draft.replace(',', '.'))
    if (Number.isFinite(parsed)) {
      onChange(Math.min(Math.max(parsed / inputScale, min), max))
    }
    setEditing(false)
  }

  const markerPosition =
    marker === null || marker < min || marker > max
      ? null
      : isLog
        ? (valueToPosition(marker, max) / LOG_STEPS) * 100
        : ((marker - min) / (max - min)) * 100

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{label}</span>
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEditing}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitEditing()
              if (event.key === 'Escape') setEditing(false)
            }}
            className="h-7 w-24 text-right font-mono text-sm tabular-nums"
            aria-label={`${label} — saisie directe`}
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            onFocus={startEditing}
            className="rounded-sm px-1 font-mono text-sm tabular-nums hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${label} : ${format(value)}. Activer pour saisir une valeur exacte.`}
          >
            {format(value)}
          </button>
        )}
      </div>

      <div className="relative">
        <Slider
          value={[sliderValue]}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          onValueChange={handleChange}
          thumbLabel={label}
          thumbValueText={format(value)}
        />
        {markerPosition !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-muted-foreground/60"
            style={{ left: `${markerPosition}%` }}
          />
        )}
      </div>

      {(markerLabel ?? hint) && (
        <p className="text-xs text-muted-foreground">{markerLabel ?? hint}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Écrire le plan tarifaire**

Créer `src/components/controls/TierRow.tsx` :

```tsx
import { GaugeRow } from './GaugeRow'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { Tier } from '@/lib/engine/types'

interface TierRowProps {
  tier: Tier
  index: 0 | 1 | 2
  onChange: (index: 0 | 1 | 2, patch: Partial<Tier>) => void
}

export function TierRow({ tier, index, onChange }: TierRowProps) {
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <p className="text-sm font-medium">{tier.name}</p>
      <GaugeRow
        label={`Prix ${tier.name}`}
        value={tier.price}
        onChange={(price) => onChange(index, { price })}
        max={500}
        step={1}
        format={formatCurrency}
      />
      <GaugeRow
        label={`Part ${tier.name}`}
        value={tier.mix}
        onChange={(mix) => onChange(index, { mix })}
        max={1}
        step={0.01}
        format={(value) => formatPercent(value, 0)}
        inputScale={100}
      />
    </div>
  )
}
```

- [ ] **Step 4: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/components/ui/slider.tsx src/components/controls/GaugeRow.tsx src/components/controls/TierRow.tsx
git commit -m "feat(ui): jauge accessible avec repère de marché et plans tarifaires"
```

---

### Task 13: Panneau de contrôle

**Files:**
- Create: `src/components/controls/ControlPanel.tsx`

**Interfaces:**
- Consumes: `<GaugeRow>`, `<TierRow>`, `useSimulator`, `useResults`, `priceZoneFor` de `@/lib/engine`, primitives `Accordion` et `ToggleGroup`
- Produces: `<ControlPanel />`, sans props — il lit et écrit directement dans le store

Les deux repères calculés du §5.2 de la spec se déplacent avec l'état : le CAC de référence vaut `12 × arpu × grossMargin`, et l'expansion de référence vaut le churn courant, celle qui porte le NRR à 100 %.

L'alerte de zone de prix est un signal, jamais un blocage : l'utilisateur peut avoir raison contre la médiane du marché.

- [ ] **Step 1: Écrire le panneau**

Créer `src/components/controls/ControlPanel.tsx` :

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GaugeRow } from './GaugeRow'
import { TierRow } from './TierRow'
import { useResults, useSimulator } from '@/store/simulator'
import { priceZoneFor } from '@/lib/engine'
import { formatCurrency, formatMonths, formatPercent } from '@/lib/format'
import type { Level } from '@/lib/engine/types'

const LEVEL_LABELS: Record<Level, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
}

function LevelToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: Level
  onChange: (value: Level) => void
}) {
  return (
    <div className="space-y-2 py-2">
      <span className="text-sm">{label}</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as Level)}
        className="w-full"
        aria-label={label}
      >
        {(Object.keys(LEVEL_LABELS) as Level[]).map((level) => (
          <ToggleGroupItem key={level} value={level} className="flex-1 text-xs">
            {LEVEL_LABELS[level]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

export function ControlPanel() {
  const inputs = useSimulator((state) => state.inputs)
  const setInput = useSimulator((state) => state.setInput)
  const setTier = useSimulator((state) => state.setTier)
  const { revenue } = useResults()

  const zone = priceZoneFor(revenue.arpu)
  const churnLooksOptimistic = revenue.arpu > 0 && inputs.revenueChurn < zone.churnMin

  // Repères calculés : ils répondent à « où est la limite pour moi »,
  // pas à « quelle est la moyenne du marché ».
  const cacMarker = 12 * revenue.arpu * inputs.grossMargin

  return (
    <Accordion type="multiple" defaultValue={['pricing', 'clients', 'retention', 'economy']}>
      <AccordionItem value="pricing">
        <AccordionTrigger>Pricing</AccordionTrigger>
        <AccordionContent>
          {inputs.tiers.map((tier, index) => (
            <TierRow key={tier.name} tier={tier} index={index as 0 | 1 | 2} onChange={setTier} />
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            ARPU pondéré {formatCurrency(revenue.arpu)} · zone {zone.label}, churn typique{' '}
            {formatPercent(zone.churnMin, 0)} à {formatPercent(zone.churnMax, 0)}
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="clients">
        <AccordionTrigger>Clients et acquisition</AccordionTrigger>
        <AccordionContent>
          <GaugeRow
            label="Clients"
            value={inputs.customers}
            onChange={(value) => setInput('customers', value)}
            max={20_000}
            scale="log"
            format={(value) => value.toLocaleString('fr-FR')}
          />
          <GaugeRow
            label="Nouveaux clients / mois"
            value={inputs.newCustomersPerMonth}
            onChange={(value) => setInput('newCustomersPerMonth', value)}
            max={1_000}
            scale="log"
            format={(value) => value.toLocaleString('fr-FR')}
          />
          <GaugeRow
            label="CAC"
            value={inputs.cac}
            onChange={(value) => setInput('cac', value)}
            max={2_000}
            format={formatCurrency}
            marker={cacMarker}
            markerLabel={`Repère ${formatCurrency(cacMarker)} — payback de 12 mois`}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="retention">
        <AccordionTrigger>Rétention</AccordionTrigger>
        <AccordionContent>
          <GaugeRow
            label="Churn de revenu / mois"
            value={inputs.revenueChurn}
            onChange={(value) => setInput('revenueChurn', value)}
            max={0.15}
            step={0.001}
            format={(value) => formatPercent(value)}
            inputScale={100}
            marker={0.03}
            markerLabel="Repère 3 %/mois — médiane B2B"
          />
          <GaugeRow
            label="Expansion / mois"
            value={inputs.expansion}
            onChange={(value) => setInput('expansion', value)}
            max={0.1}
            step={0.001}
            format={(value) => formatPercent(value)}
            inputScale={100}
            marker={inputs.revenueChurn}
            markerLabel={`Repère ${formatPercent(inputs.revenueChurn)} — NRR à 100 %`}
          />
          {churnLooksOptimistic && (
            <p role="status" className="pt-2 text-xs text-amber-600 dark:text-amber-500">
              Hypothèse de churn optimiste pour un ARPU de {formatCurrency(revenue.arpu)} : la zone{' '}
              {zone.label} tourne plutôt autour de {formatPercent(zone.churnMin, 0)}.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="economy">
        <AccordionTrigger>Économie</AccordionTrigger>
        <AccordionContent>
          <GaugeRow
            label="Marge brute"
            value={inputs.grossMargin}
            onChange={(value) => setInput('grossMargin', value)}
            min={0.5}
            max={0.99}
            step={0.01}
            format={(value) => formatPercent(value, 0)}
            inputScale={100}
            marker={0.8}
            markerLabel="Repère 80 %"
          />
          <GaugeRow
            label="Charges fixes / mois"
            value={inputs.fixedCosts}
            onChange={(value) => setInput('fixedCosts', value)}
            max={100_000}
            step={100}
            format={formatCurrency}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="quality">
        <AccordionTrigger>Qualité de l'actif</AccordionTrigger>
        <AccordionContent>
          <LevelToggle
            label="Dépendance au fondateur"
            value={inputs.founderDependency}
            onChange={(value) => setInput('founderDependency', value)}
          />
          <LevelToggle
            label="Transférabilité technique"
            value={inputs.techTransferability}
            onChange={(value) => setInput('techTransferability', value)}
          />
          <GaugeRow
            label="Part du plus gros client"
            value={inputs.topClientShare}
            onChange={(value) => setInput('topClientShare', value)}
            max={0.6}
            step={0.01}
            format={(value) => formatPercent(value, 0)}
            inputScale={100}
          />
          <GaugeRow
            label="Ancienneté"
            value={inputs.ageMonths}
            onChange={(value) => setInput('ageMonths', value)}
            max={96}
            format={formatMonths}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/components/controls/ControlPanel.tsx
git commit -m "feat(ui): panneau de contrôle, repères calculés et alerte de zone de prix"
```

---

### Task 14: Carte de valorisation

**Files:**
- Create: `src/lib/useAnimatedNumber.ts`, `src/components/results/ValuationCard.tsx`

**Interfaces:**
- Consumes: `useResults`, `useSimulator`, `formatCurrency`, `formatMultiple`, primitives `Card`, `Badge`, `Popover`, `Button`, `Input`
- Produces: `useAnimatedNumber(target: number, duration?: number): number`, `<ValuationCard />`

L'animation du montant n'est pas décorative : c'est elle qui matérialise le lien entre le geste sur la jauge et sa conséquence. Elle respecte `prefers-reduced-motion`, auquel cas la valeur saute directement à sa cible.

Le popover de barème ne contient qu'une commande, le multiple de base. Les pondérations relatives entre critères relèvent du modèle, pas de la préférence de l'utilisateur.

- [ ] **Step 1: Écrire le hook d'animation**

Créer `src/lib/useAnimatedNumber.ts` :

```ts
import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Interpole vers `target` en ease-out. Rend la cible directement si l'utilisateur limite les animations. */
export function useAnimatedNumber(target: number, duration = 300): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      fromRef.current = target
      setDisplay(target)
      return
    }

    const from = fromRef.current
    const start = performance.now()

    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      const current = from + (target - from) * eased
      setDisplay(current)
      fromRef.current = current
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return display
}
```

- [ ] **Step 2: Écrire la carte**

Créer `src/components/results/ValuationCard.tsx` :

```tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { formatCurrency, formatMultiple } from '@/lib/format'
import { useResults, useSimulator } from '@/store/simulator'
import type { ProfileLabel } from '@/lib/engine/types'

const PROFILE_LABELS: Record<ProfileLabel, string> = {
  micro: 'Micro-actif',
  bootstrapped: 'SaaS bootstrappé',
  established: 'SaaS établi',
}

export function ValuationCard() {
  const { valuation, revenue } = useResults()
  const override = useSimulator((state) => state.inputs.baseMultipleOverride)
  const setInput = useSimulator((state) => state.setInput)
  const animated = useAnimatedNumber(valuation.value)

  const basis =
    valuation.arrWeight === 0
      ? "de l'EBE"
      : valuation.arrWeight === 1
        ? "de l'ARR"
        : "mixte profit / revenu"

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Valorisation estimée</p>
          <p className="font-mono text-4xl tabular-nums" aria-live="polite">
            {formatCurrency(animated)}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Barème
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="base-multiple">Multiple de base</Label>
              <Input
                id="base-multiple"
                type="number"
                min={0.5}
                max={15}
                step={0.1}
                value={override ?? Number(valuation.baseMultiple.toFixed(2))}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setInput('baseMultipleOverride', Number.isFinite(next) ? next : null)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Par défaut, la courbe du barème donne {formatMultiple(valuation.baseMultiple)} pour
                ce niveau de MRR.
              </p>
            </div>
            {valuation.isOverridden && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput('baseMultipleOverride', null)}
              >
                Revenir au barème
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {formatMultiple(valuation.multiple)} {basis}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(valuation.low)} — {formatCurrency(valuation.high)}
        </span>
        <Badge variant="outline">{PROFILE_LABELS[valuation.profileLabel]}</Badge>
        {valuation.isOverridden && <Badge variant="outline">Barème personnalisé</Badge>}
      </div>

      {valuation.isLossMaking && valuation.arrWeight === 0 && (
        <p role="status" className="mt-3 text-sm text-amber-600 dark:text-amber-500">
          Actif déficitaire — pas de valorisation sur le profit. Les deux leviers sont le CAC
          ({formatCurrency(revenue.acquisitionCost)} par mois) et les charges fixes.
        </p>
      )}

      {valuation.isLossMaking && valuation.arrWeight > 0 && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Valorisé sur le revenu, l'exploitation étant déficitaire.
        </p>
      )}
    </Card>
  )
}
```

- [ ] **Step 3: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 4: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/lib/useAnimatedNumber.ts src/components/results/ValuationCard.tsx
git commit -m "feat(ui): carte de valorisation animée et surcharge de barème"
```

---

### Task 15: Grille de KPI

**Files:**
- Create: `src/components/results/KpiGrid.tsx`

**Interfaces:**
- Consumes: `useResults`, `healthOf`, `HEALTH_THRESHOLDS` de `@/lib/engine`, `formatNullable`, primitives `Card`, `Tooltip`
- Produces: `<KpiGrid />`

Les badges de santé ne reposent pas uniquement sur la couleur : chacun porte un libellé textuel, faute de quoi l'information disparaît pour une partie des utilisateurs.

- [ ] **Step 1: Écrire la grille**

Créer `src/components/results/KpiGrid.tsx` :

```tsx
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HEALTH_THRESHOLDS, healthOf, type HealthMetric } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency, formatMonths, formatNullable, formatPercent } from '@/lib/format'
import { useResults, useSimulator } from '@/store/simulator'
import type { Health } from '@/lib/engine/types'

const HEALTH_STYLES: Record<Health, string> = {
  good: 'text-emerald-600 dark:text-emerald-500',
  warn: 'text-amber-600 dark:text-amber-500',
  bad: 'text-red-600 dark:text-red-500',
}

const HEALTH_WORDS: Record<Health, string> = {
  good: 'bon',
  warn: 'à surveiller',
  bad: 'critique',
}

interface TileProps {
  label: string
  value: string
  metric?: HealthMetric
  raw?: number | null
  note?: string
}

function Tile({ label, value, metric, raw = null, note }: TileProps) {
  const health = metric ? healthOf(metric, raw) : null

  const body = (
    <Card className="gap-1 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-mono text-lg tabular-nums ${health ? HEALTH_STYLES[health] : ''}`}>
        {value}
      </p>
      {health && (
        <p className="text-[11px] text-muted-foreground">{HEALTH_WORDS[health]}</p>
      )}
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </Card>
  )

  if (!metric) return body

  return (
    <Tooltip>
      <TooltipTrigger asChild>{body}</TooltipTrigger>
      <TooltipContent>{HEALTH_THRESHOLDS[metric].label}</TooltipContent>
    </Tooltip>
  )
}

export function KpiGrid() {
  const { revenue, economics, growth } = useResults()
  const grossMargin = useSimulator((state) => state.inputs.grossMargin)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <Tile label="MRR" value={formatCurrency(revenue.mrr)} />
      <Tile label="ARR" value={formatCompactCurrency(revenue.arr)} />
      <Tile label="ARPU" value={formatCurrency(revenue.arpu)} />
      <Tile
        label="Marge brute"
        value={formatPercent(grossMargin, 0)}
        metric="grossMargin"
        raw={grossMargin}
      />
      <Tile label="LTV" value={formatNullable(economics.ltv, formatCurrency)} />
      <Tile
        label="LTV:CAC"
        value={formatNullable(economics.ltvCacRatio, (v) => `${v.toFixed(1).replace('.', ',')}×`)}
        metric="ltvCacRatio"
        raw={economics.ltvCacRatio}
        note={economics.ltvCacRatio === null ? 'acquisition organique' : undefined}
      />
      <Tile
        label="Payback"
        value={formatNullable(economics.paybackMonths, formatMonths)}
        metric="paybackMonths"
        raw={economics.paybackMonths}
      />
      <Tile
        label="NRR"
        value={formatPercent(economics.nrr, 0)}
        metric="nrr"
        raw={economics.nrr}
      />
      <Tile
        label="Rule of 40"
        value={growth.ruleOf40.toFixed(0)}
        metric="ruleOf40"
        raw={growth.ruleOf40}
      />
      <Tile
        label="Plafond de MRR"
        value={formatNullable(growth.mrrCeiling, formatCurrency)}
        note={growth.mrrCeiling === null ? 'rétention nette négative' : undefined}
      />
    </div>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie. Si `revenue` est signalé comme déclaré mais non utilisé, c'est normal : il sert aux tuiles MRR, ARR et ARPU — vérifier plutôt que la tuile de marge brute lit bien `grossMargin`.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/components/results/KpiGrid.tsx
git commit -m "feat(ui): grille de KPI avec badges de santé"
```

---

### Task 16: Courbe de projection

**Files:**
- Create: `src/components/results/ProjectionChart.tsx`

**Interfaces:**
- Consumes: `useResults`, `formatCompactCurrency`, `formatCurrency`, Recharts, primitive `Card`
- Produces: `<ProjectionChart />`

L'asymptote est l'élément le plus important du graphique : c'est elle qui rend le churn viscéral. Quand la rétention nette est négative, elle disparaît et une note explique pourquoi, plutôt que de tracer une ligne à l'infini.

- [ ] **Step 1: Écrire le graphique**

Créer `src/components/results/ProjectionChart.tsx` :

```tsx
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { useResults } from '@/store/simulator'

export function ProjectionChart() {
  const { projection, growth } = useResults()
  const data = projection.map((mrr, month) => ({ month, mrr }))

  return (
    <Card className="p-5">
      <p className="text-sm font-medium">Projection 36 mois</p>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(month: number) => `M${month}`}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={5}
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'MRR']}
              labelFormatter={(month: number) => `Mois ${month}`}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--popover-foreground)',
                fontSize: 12,
              }}
            />
            {growth.mrrCeiling !== null && (
              <ReferenceLine
                y={growth.mrrCeiling}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: `Plafond ${formatCurrency(growth.mrrCeiling)}`,
                  position: 'insideTopLeft',
                  fill: 'var(--muted-foreground)',
                  fontSize: 11,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {growth.mrrCeiling !== null
          ? `À churn et acquisition constants, le MRR converge vers ${formatCurrency(growth.mrrCeiling)}. Relever ce plafond passe par moins de churn ou plus d'acquisition.`
          : "Rétention nette négative : l'expansion dépasse le churn, il n'y a pas de plafond."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Hypothèse : rythme d'acquisition constant sur toute la période.
      </p>
    </Card>
  )
}
```

L'animation de Recharts est désactivée : la courbe se redessine à chaque mouvement de jauge, et une transition la rendrait molle au lieu de réactive.

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/components/results/ProjectionChart.tsx
git commit -m "feat(ui): courbe de projection et asymptote du plafond"
```

---

### Task 17: Décomposition du multiple

**Files:**
- Create: `src/components/results/MultipleBreakdown.tsx`

**Interfaces:**
- Consumes: `useResults`, `formatMultiple`, `formatPercent`, primitive `Card`
- Produces: `<MultipleBreakdown />`

Les lignes à delta nul restent affichées, en gris : la neutralité d'un critère est une information, et les faire disparaître ferait croire qu'ils ne sont pas pris en compte.

L'écrêtage, quand il s'applique, occupe sa propre ligne. C'est ce qui permet au total affiché d'égaler toujours le multiple réellement utilisé.

- [ ] **Step 1: Écrire la décomposition**

Créer `src/components/results/MultipleBreakdown.tsx` :

```tsx
import { Card } from '@/components/ui/card'
import { formatMultiple, formatPercent } from '@/lib/format'
import { useResults } from '@/store/simulator'

export function MultipleBreakdown() {
  const { valuation } = useResults()
  const sorted = [...valuation.lines].sort((a, b) => b.deltaMultiple - a.deltaMultiple)

  return (
    <Card className="p-5">
      <p className="text-sm font-medium">Construction du multiple</p>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">
            Base {valuation.isOverridden ? '(personnalisée)' : '(barème)'}
          </dt>
          <dd className="font-mono tabular-nums">{formatMultiple(valuation.baseMultiple)}</dd>
        </div>

        {sorted.map((line) => (
          <div key={line.key} className="flex justify-between gap-4">
            <dt className={line.deltaPct === 0 ? 'text-muted-foreground/60' : 'text-muted-foreground'}>
              {line.label}
            </dt>
            <dd
              className={`font-mono tabular-nums ${
                line.deltaPct > 0
                  ? 'text-emerald-600 dark:text-emerald-500'
                  : line.deltaPct < 0
                    ? 'text-red-600 dark:text-red-500'
                    : 'text-muted-foreground/60'
              }`}
            >
              {line.deltaPct === 0 ? '—' : formatMultiple(line.deltaMultiple, true)}
            </dd>
          </div>
        ))}

        {valuation.adjClamped && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              Cumul écrêté à {formatPercent(valuation.adjSum, 0)}
            </dt>
            <dd className="font-mono tabular-nums text-muted-foreground">ajusté</dd>
          </div>
        )}

        {valuation.multipleClamped && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Plafonné au maximum du barème</dt>
            <dd className="font-mono tabular-nums text-muted-foreground">
              {formatMultiple(valuation.multiple)}
            </dd>
          </div>
        )}

        <div className="flex justify-between gap-4 border-t border-border pt-2">
          <dt className="font-medium">Multiple ajusté</dt>
          <dd className="font-mono font-medium tabular-nums">
            {formatMultiple(valuation.multiple)}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/components/results/MultipleBreakdown.tsx
git commit -m "feat(ui): décomposition du multiple ligne à ligne"
```

---

### Task 18: Scénarios épinglés et partage

**Files:**
- Create: `src/components/scenarios/ScenarioBar.tsx`

**Interfaces:**
- Consumes: `useSimulator`, `useResults`, `MAX_SCENARIOS`, `compute` de `@/lib/engine`, `buildShareUrl`, `toast` de `sonner`
- Produces: `<ScenarioBar />`

Chaque scénario stocké ne contient que ses entrées : sa valorisation est recalculée à l'affichage avec le barème courant. C'est la seule sémantique cohérente pour comparer deux hypothèses.

Le bouton de partage écrit dans le presse-papiers. Rien n'est envoyé nulle part : l'application est statique et le lien voyage par les moyens de l'utilisateur.

- [ ] **Step 1: Écrire la barre de scénarios**

Créer `src/components/scenarios/ScenarioBar.tsx` :

```tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { compute } from '@/lib/engine'
import { buildShareUrl } from '@/lib/urlState'
import { formatCompactCurrency, formatMultiple } from '@/lib/format'
import { MAX_SCENARIOS, useResults, useSimulator } from '@/store/simulator'

export function ScenarioBar() {
  const scenarios = useSimulator((state) => state.scenarios)
  const inputs = useSimulator((state) => state.inputs)
  const pinScenario = useSimulator((state) => state.pinScenario)
  const removeScenario = useSimulator((state) => state.removeScenario)
  const { valuation } = useResults()
  const [name, setName] = useState('')

  function handlePin() {
    const label = name.trim() || `Scénario ${scenarios.length + 1}`
    pinScenario(label)
    setName('')
  }

  async function handleShare() {
    await navigator.clipboard.writeText(buildShareUrl(inputs))
    toast('Lien copié dans le presse-papiers')
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom du scénario"
          className="h-9 w-44"
          aria-label="Nom du scénario à épingler"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handlePin}
          disabled={scenarios.length >= MAX_SCENARIOS}
        >
          Épingler ce scénario
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          Copier le lien
        </Button>
        {scenarios.length >= MAX_SCENARIOS && (
          <span className="text-xs text-muted-foreground">
            Maximum {MAX_SCENARIOS} scénarios — en retirer un pour en épingler un autre.
          </span>
        )}
      </div>

      {scenarios.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {scenarios.map((scenario) => {
            const pinned = compute(scenario.inputs).valuation
            const delta = valuation.value - pinned.value
            const relative = pinned.value > 0 ? delta / pinned.value : 0

            return (
              <div key={scenario.id} className="rounded-md bg-muted/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium">{scenario.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-xs"
                    onClick={() => removeScenario(scenario.id)}
                    aria-label={`Retirer le scénario ${scenario.name}`}
                  >
                    Retirer
                  </Button>
                </div>
                <p className="font-mono text-lg tabular-nums">
                  {formatCompactCurrency(pinned.value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMultiple(pinned.multiple)} ·{' '}
                  {formatCompactCurrency(compute(scenario.inputs).revenue.mrr)} de MRR
                </p>
                <p
                  className={`text-xs ${
                    delta >= 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-red-600 dark:text-red-500'
                  }`}
                >
                  Écart avec l'état courant : {delta >= 0 ? '+' : ''}
                  {formatCompactCurrency(delta)} ({(relative * 100).toFixed(0)} %)
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/components/scenarios/ScenarioBar.tsx
git commit -m "feat(ui): épinglage, comparaison de scénarios et partage par lien"
```

---

### Task 19: Bascule de thème et mise en page

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/App.tsx` (remplacement intégral), `src/main.tsx`

**Interfaces:**
- Consumes: tous les composants des tâches 13 à 18, `applyHashInputs`, primitives `Sheet`, `Button`, `Toaster`, `TooltipProvider`
- Produces: `<ThemeToggle />`, `<App />`

Sous 1024 px, le panneau de contrôle passe dans un `Sheet`, mais la carte de valorisation reste au-dessus du contenu : sans elle, la boucle de rétroaction disparaît et l'application perd son intérêt sur mobile.

- [ ] **Step 1: Écrire la bascule de thème**

Créer `src/components/ThemeToggle.tsx` :

```tsx
import { Button } from '@/components/ui/button'
import { useSimulator } from '@/store/simulator'

export function ThemeToggle() {
  const theme = useSimulator((state) => state.theme)
  const setTheme = useSimulator((state) => state.setTheme)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
    >
      {theme === 'dark' ? 'Clair' : 'Sombre'}
    </Button>
  )
}
```

- [ ] **Step 2: Écrire la mise en page**

Remplacer intégralement `src/App.tsx` :

```tsx
import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { ValuationCard } from '@/components/results/ValuationCard'
import { KpiGrid } from '@/components/results/KpiGrid'
import { ProjectionChart } from '@/components/results/ProjectionChart'
import { MultipleBreakdown } from '@/components/results/MultipleBreakdown'
import { ScenarioBar } from '@/components/scenarios/ScenarioBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { applyHashInputs } from '@/store/simulator'

function Results() {
  return (
    <div className="space-y-3">
      {/* Collante : sans elle en vue, le lien entre le geste et sa conséquence disparaît. */}
      <div className="sticky top-4 z-10 lg:top-6">
        <ValuationCard />
      </div>
      <ScenarioBar />
      <KpiGrid />
      <ProjectionChart />
      <MultipleBreakdown />
    </div>
  )
}

export default function App() {
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    applyHashInputs()
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-svh bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-base font-medium">Simulateur d'actif SaaS</h1>
            <p className="text-xs text-muted-foreground">
              Pricing, rétention et valorisation, en direct
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  Réglages
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Panneau de contrôle</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">
                  <ControlPanel />
                </div>
              </SheetContent>
            </Sheet>
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto flex max-w-[1600px] gap-6 p-4 lg:p-6">
          <aside className="hidden w-[360px] shrink-0 lg:block">
            <div className="sticky top-6 max-h-[calc(100svh-3rem)] overflow-y-auto pr-2">
              <ControlPanel />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <Results />
          </main>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
```

- [ ] **Step 3: Vérifier que `main.tsx` importe la feuille de style**

`src/main.tsx` doit contenir `import './index.css'`. Le laisser inchangé s'il est déjà présent ; l'ajouter sinon.

- [ ] **Step 4: Construire et vérifier**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm build
```

Attendu : `✓ built in …`, aucune erreur TypeScript.

- [ ] **Step 5: Commit**

```bash
cd "/Users/svbri/Saas Playbook app"
git add src/App.tsx src/components/ThemeToggle.tsx src/main.tsx
git commit -m "feat(ui): mise en page deux colonnes, panneau mobile et bascule de thème"
```

---

### Task 20: Vérification finale

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: l'application complète
- Produces: un dépôt vérifié et documenté

Cette tâche ne produit pas de fonctionnalité : elle établit par des preuves que ce qui précède fonctionne. Aucune affirmation de succès sans la sortie de commande correspondante.

- [ ] **Step 1: Lancer toute la suite de tests**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec vitest run
```

Attendu : 9 fichiers de test, 122 tests passés, aucun échec.

- [ ] **Step 2: Vérifier les types sur tout le projet**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm exec tsc --noEmit -p tsconfig.app.json
```

Attendu : aucune sortie.

- [ ] **Step 3: Construire pour la production**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm build
```

Attendu : `✓ built in …`.

- [ ] **Step 4: Vérifier l'absence d'appel réseau**

La contrainte globale interdit tout `fetch`. Vérifier qu'aucun n'a été introduit :

```bash
cd "/Users/svbri/Saas Playbook app" && grep -rn "fetch(\|XMLHttpRequest\|axios" src/ || echo "aucun appel réseau"
```

Attendu : `aucun appel réseau`.

- [ ] **Step 5: Vérifier l'isolation du moteur**

```bash
cd "/Users/svbri/Saas Playbook app" && grep -rn "from 'react'\|from 'zustand'\|@/components" src/lib/engine/ || echo "moteur isolé"
```

Attendu : `moteur isolé`.

- [ ] **Step 6: Vérifier l'application dans le navigateur**

```bash
cd "/Users/svbri/Saas Playbook app" && pnpm dev
```

Ouvrir l'URL affichée et contrôler point par point :

1. Faire glisser la jauge « Clients » de 0 à son maximum : la valorisation évolue **sans aucun saut**, y compris en traversant 60 k€ puis 140 k€ de MRR. C'est la vérification visuelle du test de continuité.
2. Porter le prix du plan Pro de 29 € à 39 € : ARPU, MRR, LTV, plafond et valorisation montent tous.
3. Porter le churn à 8 % : le plafond de MRR chute, la courbe s'aplatit plus bas, le multiple baisse, le badge de churn passe au rouge.
4. Porter l'expansion au-dessus du churn : l'asymptote disparaît et la note de rétention nette négative apparaît.
5. Porter les charges fixes à 100 000 € : le message d'actif déficitaire apparaît, la valorisation ne devient pas négative.
6. Mettre le churn à 0 : la LTV affiche `—` et non `0` ni `Infinity`.
7. Ouvrir le popover « Barème », saisir 6 : le badge « barème personnalisé » apparaît, la décomposition repart de 6,00×, et « Revenir au barème » restaure la courbe.
8. Épingler un scénario, modifier le churn, vérifier que l'écart s'affiche.
9. Cliquer « Copier le lien », ouvrir le lien dans un nouvel onglet : les réglages sont restaurés à l'identique.
10. Réduire la fenêtre sous 1024 px : le panneau bascule dans le `Sheet`, la carte de valorisation reste visible.
11. Basculer en thème sombre, recharger : le thème est conservé.
12. Naviguer au clavier seul, `Tab` puis flèches : chaque jauge est atteignable et manipulable.

- [ ] **Step 7: Écrire le README**

Créer `README.md` :

```markdown
# Simulateur d'actif SaaS

Simule la valorisation d'un actif SaaS à partir de son pricing, de sa base clients et de sa
rétention. Tout se manipule à la jauge et se recalcule en direct.

## Démarrer

```bash
pnpm install
pnpm dev
```

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Construction de production |
| `pnpm exec vitest run` | Suite de tests du moteur |

## Comment ça marche

Le moteur de calcul est du TypeScript pur, isolé dans `src/lib/engine/`, sans aucune dépendance
à React. Il expose une seule fonction pure, `compute(inputs)`. Les composants ne font aucun
calcul métier : ils lisent son résultat.

Deux idées structurent le modèle, tirées du *SaaS Playbook* de Rob Walling :

- **Le churn est un plafond.** À churn et acquisition constants, le MRR converge vers
  `nouveau MRR / churn net`. La courbe de projection trace cette asymptote.
- **Le prix est le levier le plus sous-utilisé.** Le MRR n'est pas une saisie : il dérive du
  pricing et du nombre de clients.

La valorisation mélange progressivement une base profit (SDE) et une base revenu (ARR), et
construit son multiple par ajustements continus. Aucun seuil ne provoque de saut : un test de
balayage parcourt chaque jauge sur tout son domaine pour le garantir.

## Réviser les barèmes

Tous les chiffres de marché vivent dans `src/lib/engine/benchmarks.ts` — courbes de base,
ancrages d'ajustement, seuils de santé, zones de prix. C'est le seul fichier à éditer pour
mettre l'outil à jour. Le multiple de base se surcharge aussi depuis l'interface, via le
bouton « Barème » de la carte de valorisation.

## Portée

Un simulateur, pas un outil de vérification : aucune connexion à Stripe, aucun revenu réel,
aucun appel réseau. Tout tourne dans le navigateur, hors-ligne. Les liens de partage encodent
l'état dans le fragment d'URL, qui n'est jamais transmis à un serveur.
```

- [ ] **Step 8: Commit final**

```bash
cd "/Users/svbri/Saas Playbook app"
git add README.md
git commit -m "docs: README du simulateur"
```
