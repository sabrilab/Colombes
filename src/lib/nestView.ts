import type { SimulatorResults } from './engine/types'
import type { SavedSimulation } from '@/store/simulator'
import { compute } from './engine'
import { evaluateGoal, type Goal, type GoalOutcome } from './goals'
import type { RepoSignals } from './github'
import {
  animalOf,
  provenMrr,
  readinessOf,
  readinessScore,
  statusOf,
  type IdeaStatus,
  type ReadinessCheck,
} from './nest'

/**
 * Ce que le nid montre, une fois tout recoupé.
 *
 * `nest.ts` répond à des questions unitaires — cet œuf a-t-il éclos, que sait-on
 * de lui, quel animal en sort. Ce fichier fait le tour du nid : il assemble
 * chaque idée avec sa simulation calculée et les signaux de son dépôt, puis il
 * les met dans un ordre.
 *
 * Le tri est la seule décision réellement discutable ici, alors elle est écrite
 * plutôt que cachée dans un `sort` au milieu d'un composant :
 *
 *  — **prêtes à éclore** met devant celles auxquelles il manque le moins. C'est
 *    l'ordre par défaut, parce que la question qu'on se pose devant un nid n'est
 *    pas « laquelle est la plus belle » mais « laquelle est la plus proche » ;
 *  — **ce que ça vaudrait** garde l'ordre que l'app sait déjà produire, avec sa
 *    réserve habituelle : c'est une hypothèse, pas un encaissement ;
 *  — **le temps qu'il faut** pour atteindre l'objectif fixé, parce qu'une idée
 *    qui vaut moins mais qui y arrive en huit mois plutôt qu'en trente n'est pas
 *    la même décision ;
 *  — **dernières touchées** sert à reprendre un travail en cours.
 *
 * Une règle traverse les trois : **les abandonnées passent en dernier, toujours**.
 * Elles restent visibles — une idée arrêtée est une information — mais elles ne
 * viennent pas s'intercaler entre deux idées vivantes.
 */

export interface NestIdea {
  sim: SavedSimulation
  results: SimulatorResults
  /** Le chemin jusqu'à l'objectif qu'on s'est fixé, sur la trajectoire simulée. */
  goal: GoalOutcome
  status: IdeaStatus
  /** Les cinq postes, dans l'ordre où on les remplit. */
  checks: ReadinessCheck[]
  /** De 0 à 1 : la part des postes acquis. C'est le niveau dans la coquille. */
  readiness: number
  /** Le palier, une fois éclose. `null` tant que personne ne paie. */
  animal: string | null
  /** Le revenu mensuel réellement encaissé, par opposition au simulé. */
  proven: number
  /** Ce que GitHub a bien voulu dire du dépôt, ou rien. Voir `lib/github.ts`. */
  repo: RepoSignals | null
}

export type NestOrder = 'ready' | 'value' | 'speed' | 'recent'

export const NEST_ORDERS: { id: NestOrder; label: string; note: string }[] = [
  { id: 'ready', label: 'Closest to hatching', note: 'What is missing the least.' },
  { id: 'value', label: 'Worth most', note: 'If the assumptions hold.' },
  { id: 'speed', label: 'Fastest to the goal', note: 'On the current trajectory.' },
  { id: 'recent', label: 'Last touched', note: 'For picking work back up.' },
]

/**
 * Une idée, complète.
 *
 * `signals` vaut `null` quand le dépôt n'est pas lié, qu'il est privé, ou que
 * GitHub n'a pas répondu. Les trois cas se traitent pareil et c'est voulu : on
 * ne sait pas, donc le poste « vivante » n'est pas acquis. Le supposer acquis
 * ferait remonter dans le classement une idée dont personne n'a rien vérifié.
 */
export function nestIdea(
  sim: SavedSimulation,
  goal: Goal,
  signals: RepoSignals | null = null,
): NestIdea {
  const results = compute(sim.inputs)
  const checks = readinessOf(sim, results, signals)

  return {
    sim,
    results,
    goal: evaluateGoal(sim.inputs, results, goal),
    status: statusOf(sim),
    checks,
    readiness: readinessScore(checks),
    animal: animalOf(sim, results),
    proven: provenMrr(sim, results),
    repo: signals,
  }
}

export function buildNest(
  sims: readonly SavedSimulation[],
  goal: Goal,
  signals: ReadonlyMap<string, RepoSignals | null> = new Map(),
): NestIdea[] {
  return sims.map((sim) => nestIdea(sim, goal, (sim.repo ? signals.get(sim.repo) : null) ?? null))
}

/** Les abandonnées derrière, sans exception. Voir l'en-tête. */
function aliveFirst(a: NestIdea, b: NestIdea): number {
  return Number(a.status === 'abandoned') - Number(b.status === 'abandoned')
}

export function orderNest(ideas: readonly NestIdea[], order: NestOrder): NestIdea[] {
  const sorted = [...ideas]

  if (order === 'value') {
    sorted.sort(
      (a, b) => aliveFirst(a, b) || b.results.valuation.value - a.results.valuation.value,
    )
  } else if (order === 'speed') {
    // Une idée qui n'atteint jamais l'objectif passe après toutes celles qui y
    // arrivent, sans être écartée : on ne cache pas une idée parce que le modèle
    // ne lui voit pas de chemin. À délai égal, la valorisation départage.
    sorted.sort(
      (a, b) =>
        aliveFirst(a, b) ||
        (a.goal.monthReached ?? Number.POSITIVE_INFINITY) -
          (b.goal.monthReached ?? Number.POSITIVE_INFINITY) ||
        b.results.valuation.value - a.results.valuation.value,
    )
  } else if (order === 'recent') {
    // Les entrées d'avant le champ de date n'en ont pas : elles passent en
    // dernier plutôt que de prétendre dater de 1970.
    sorted.sort((a, b) => aliveFirst(a, b) || (b.sim.savedAt ?? 0) - (a.sim.savedAt ?? 0))
  } else {
    // À maturité égale — le cas courant, cinq postes ne font que six paliers —
    // c'est la valorisation qui départage, sinon l'ordre serait celui du hasard.
    sorted.sort(
      (a, b) =>
        aliveFirst(a, b) ||
        b.readiness - a.readiness ||
        b.results.valuation.value - a.results.valuation.value,
    )
  }

  return sorted
}

/** Ce que le nid contient, en une ligne : « 4 œufs · 1 éclose ». */
export function nestCensus(ideas: readonly NestIdea[]): Record<IdeaStatus, number> {
  return {
    egg: ideas.filter((idea) => idea.status === 'egg').length,
    hatched: ideas.filter((idea) => idea.status === 'hatched').length,
    abandoned: ideas.filter((idea) => idea.status === 'abandoned').length,
  }
}
