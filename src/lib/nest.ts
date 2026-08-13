import type { SimulatorResults } from './engine/types'
import type { SavedSimulation } from '@/store/simulator'
import { animalFor } from './pricePad'
import type { RepoSignals } from './github'

/**
 * Le nid : des œufs qui éclosent.
 *
 * Une idée entre ici comme un œuf. Elle n'en sort pas parce qu'on l'a bien
 * notée, ni parce qu'on y croit fort : **elle éclot quand quelqu'un paie**. Ce
 * seuil-là n'est pas une figure de style, c'est le seul fait que ni toi ni un
 * modèle ne pouvez inventer, et c'est aussi celui que toute l'app sait traiter —
 * un client qui paie a un revenu par client, donc un palier, donc un animal.
 *
 * D'où le lien avec la volière, qui existait déjà sans destination : le nid est
 * son antichambre. Un œuf qui éclot devient la souris, le lapin ou le cerf que
 * son revenu par client désigne, et rejoint les animaux. Un œuf qu'on abandonne
 * reste un œuf, avec sa date et sa raison — parce qu'un portefeuille qui ne fait
 * qu'accumuler est un cimetière avec un beau classement.
 *
 * Rien ici n'est stocké en double : l'état se **déduit** de ce qu'on sait. Un
 * statut écrit à côté des faits finirait par les contredire.
 */

export type IdeaStatus = 'egg' | 'hatched' | 'abandoned'

export function statusOf(sim: SavedSimulation): IdeaStatus {
  if (sim.abandonedAt) return 'abandoned'
  return (sim.provenCustomers ?? 0) > 0 ? 'hatched' : 'egg'
}

/**
 * Ce qu'on sait d'une idée, poste par poste.
 *
 * Une note sur dix cacherait ce qui la compose ; cinq cases nommées le montrent.
 * Chacune porte sa provenance, et c'est la partie qui compte : `measured` sort
 * d'un fait qu'on n'a pas choisi — le dépôt a bougé ou non, quelqu'un paie ou
 * non — quand `declared` sort de ta bouche. Une idée dont les cinq cases sont
 * déclarées est une idée sur laquelle personne ne s'est encore prononcé que toi.
 */
export interface ReadinessCheck {
  key: 'told' | 'priced' | 'coded' | 'alive' | 'paid'
  label: string
  hint: string
  done: boolean
  kind: 'declared' | 'measured'
}

/** Le dernier poste est la condition d'éclosion : on ne peut pas en ajouter un après. */
export function readinessOf(
  sim: SavedSimulation,
  results: SimulatorResults,
  repo: RepoSignals | null,
): ReadinessCheck[] {
  return [
    {
      key: 'told',
      label: 'Told',
      hint: 'What it is, in one line.',
      done: Boolean(sim.note?.trim()),
      kind: 'declared',
    },
    {
      key: 'priced',
      label: 'Priced',
      hint: 'A price someone would pay.',
      done: results.revenue.arpu > 0,
      kind: 'declared',
    },
    {
      key: 'coded',
      label: 'Coded',
      hint: 'A repository exists.',
      done: Boolean(sim.repo),
      kind: 'measured',
    },
    {
      key: 'alive',
      label: 'Alive',
      hint: 'Pushed within the last month.',
      // Sans dépôt lié, on ne sait pas : c'est faux plutôt qu'optimiste.
      done: repo !== null && !repo.isArchived && repo.daysSincePush <= 30,
      kind: 'measured',
    },
    {
      key: 'paid',
      label: 'Paid',
      hint: 'At least one customer pays. This is what hatches it.',
      done: (sim.provenCustomers ?? 0) > 0,
      kind: 'measured',
    },
  ]
}

/** De 0 à 1. C'est ce qui remplit l'œuf, et rien d'autre ne le remplit. */
export function readinessScore(checks: readonly ReadinessCheck[]): number {
  if (checks.length === 0) return 0
  return checks.filter((check) => check.done).length / checks.length
}

/**
 * L'animal d'une idée éclose, lu sur son revenu par client.
 *
 * `null` tant qu'elle n'a pas éclos : afficher un animal sur une idée que
 * personne n'a payée reviendrait à ranger une intention parmi les entreprises.
 */
export function animalOf(sim: SavedSimulation, results: SimulatorResults): string | null {
  return statusOf(sim) === 'hatched' ? animalFor(results.revenue.arpu).name : null
}

/**
 * Le revenu réellement encaissé, par mois.
 *
 * La simulation dit ce que l'idée vaudrait avec la clientèle qu'on lui suppose ;
 * ceci dit ce qu'elle rapporte avec celle qui paie vraiment. Les deux chiffres
 * doivent cohabiter sans se confondre — c'est toute la différence entre un œuf
 * et un animal.
 */
export function provenMrr(sim: SavedSimulation, results: SimulatorResults): number {
  return (sim.provenCustomers ?? 0) * results.revenue.arpu
}
