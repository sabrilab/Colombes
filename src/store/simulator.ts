import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { compute } from '@/lib/engine'
import type { SimulatorInputs, SimulatorResults, Tier } from '@/lib/engine/types'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import { addTierTo, removeTierAt } from '@/lib/tiers'
import { readInputsFromHash } from '@/lib/urlState'
import { detectLanguage, translate, type Language } from '@/lib/i18n'
import type { Goal } from '@/lib/goals'

export interface Scenario {
  id: string
  name: string
  inputs: SimulatorInputs
}

export const MAX_SCENARIOS = 3

/** Une simulation gardée par l'utilisateur, au-delà de la session. */
export interface SavedSimulation {
  id: string
  name: string
  inputs: SimulatorInputs
  /** Identifiant de la colombe dont elle est partie, s'il y en a une. */
  basedOn: string | null
  /**
   * Ce que c'est, en une ligne : le produit, à qui on le vend, d'où viennent
   * les clients. Sans elle, douze entrées deviennent douze noms qu'on ne sait
   * plus relier à une idée trois semaines plus tard — et comparer deux
   * valorisations dont on a oublié les hypothèses ne sert à rien.
   */
  note?: string
  /**
   * Le dépôt public de l'idée, « owner/repo ». Il sert à deux choses : ouvrir le
   * code d'un clic, et lire quelques signaux vérifiables — depuis quand ça
   * existe, quand ça a bougé pour la dernière fois. Voir `lib/github.ts`.
   */
  repo?: string
  /**
   * Quand elle a été enregistrée ou reprise. Facultative : les entrées d'avant
   * ce champ n'en ont pas, et une date inventée serait pire qu'une date absente.
   */
  savedAt?: number
  /**
   * Les clients qui paient **vraiment**, par opposition à ceux que la simulation
   * suppose. C'est le seul fait qu'on ne peut ni deviner ni modéliser, et c'est
   * pour ça qu'il décide de l'éclosion : voir `lib/nest.ts`.
   */
  provenCustomers?: number
  /** Abandonnée le… Un œuf qu'on renonce à couver garde sa date et sa raison. */
  abandonedAt?: number
  abandonReason?: string
  /**
   * Ce qui est arrivé à l'idée, daté.
   *
   * C'est la mémoire dont dépend tout le reste : un classement d'il y a un mois
   * est inexplicable sans le journal des décisions qui l'ont produit. On y écrit
   * les faits — pas les intentions — et jamais rien qu'on ne puisse relire.
   */
  journal?: JournalEntry[]
}

export interface JournalEntry {
  at: number
  text: string
}

/** Au-delà, on coupe la queue : un journal sert à se souvenir, pas à archiver. */
const MAX_JOURNAL = 40

export const MAX_SAVED_SIMULATIONS = 12

export type PanelMode = 'simple' | 'expert'

interface SimulatorState {
  inputs: SimulatorInputs
  scenarios: Scenario[]
  panelMode: PanelMode
  language: Language
  setLanguage: (language: Language) => void
  goal: Goal
  setGoal: (goal: Goal) => void
  setInput: <K extends keyof SimulatorInputs>(key: K, value: SimulatorInputs[K]) => void
  setTier: (index: number, patch: Partial<Tier>) => void
  addTier: () => void
  removeTier: (index: number) => void
  loadInputs: (inputs: SimulatorInputs, basedOn?: string | null) => void
  resetInputs: () => void
  savedSims: SavedSimulation[]
  /** Origine de l'état courant, pour l'attribuer si on l'enregistre. */
  currentBasedOn: string | null
  saveSimulation: (name: string, note?: string) => void
  renameSimulation: (id: string, name: string) => void
  /** Change le contexte d'une idée — sa ligne et son dépôt — sans toucher aux réglages. */
  describeSimulation: (id: string, patch: { note?: string; repo?: string }) => void
  /** Combien de clients paient vraiment. Passer au-dessus de zéro fait éclore l'œuf. */
  setProvenCustomers: (id: string, customers: number) => void
  /** Renoncer à couver, ou reprendre. La raison est gardée, pas la honte. */
  abandonSimulation: (id: string, reason: string) => void
  reviveSimulation: (id: string) => void
  duplicateSimulation: (id: string) => void
  deleteSimulation: (id: string) => void
  openSimulation: (id: string) => void
  pinScenario: (name: string) => void
  removeScenario: (id: string) => void
  setPanelMode: (mode: PanelMode) => void
}

/**
 * Ajoute une ligne au journal d'une idée, et date la touche.
 *
 * Toujours par ici : une mise à jour qui oublierait le journal produirait un
 * historique à trous, c'est-à-dire un historique auquel on ne peut pas se fier.
 */
function journalise(sim: SavedSimulation, text: string): SavedSimulation {
  const entry: JournalEntry = { at: Date.now(), text }
  return {
    ...sim,
    savedAt: entry.at,
    journal: [entry, ...(sim.journal ?? [])].slice(0, MAX_JOURNAL),
  }
}

export const useSimulator = create<SimulatorState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      scenarios: [],
      panelMode: 'expert',
      language: detectLanguage(),
      goal: { metric: 'mrr', target: 30_000, months: 18 },

      setGoal: (goal) => set({ goal }),

      setLanguage: (language) => set({ language }),

      setInput: (key, value) => set((state) => ({ inputs: { ...state.inputs, [key]: value } })),

      setTier: (index, patch) =>
        set((state) => {
          const tiers = state.inputs.tiers.map((tier, i) =>
            i === index ? { ...tier, ...patch } : tier,
          )
          return { inputs: { ...state.inputs, tiers } }
        }),

      addTier: () =>
        set((state) => ({ inputs: { ...state.inputs, tiers: addTierTo(state.inputs.tiers) } })),

      removeTier: (index) =>
        set((state) => ({
          inputs: { ...state.inputs, tiers: removeTierAt(state.inputs.tiers, index) },
        })),

      loadInputs: (inputs, basedOn = null) => set({ inputs, currentBasedOn: basedOn }),

      resetInputs: () => set({ inputs: DEFAULT_INPUTS, currentBasedOn: null }),

      savedSims: [],
      currentBasedOn: null,

      saveSimulation: (name, note) =>
        set((state) => {
          if (state.savedSims.length >= MAX_SAVED_SIMULATIONS) return state
          const entry: SavedSimulation = {
            id: crypto.randomUUID(),
            name: name.trim() || `Simulation ${state.savedSims.length + 1}`,
            inputs: state.inputs,
            basedOn: state.currentBasedOn,
            note: note?.trim() || undefined,
            savedAt: Date.now(),
            journal: [{ at: Date.now(), text: 'Déposée dans le nid' }],
          }
          // La dernière enregistrée arrive en tête : c'est celle qu'on rouvre.
          return { savedSims: [entry, ...state.savedSims] }
        }),

      renameSimulation: (id, name) =>
        set((state) => ({
          savedSims: state.savedSims.map((sim) =>
            sim.id === id ? { ...sim, name: name.trim() || sim.name } : sim,
          ),
        })),

      setProvenCustomers: (id, customers) =>
        set((state) => ({
          savedSims: state.savedSims.map((sim) => {
            if (sim.id !== id) return sim
            const next = Math.max(0, Math.round(customers))
            const before = sim.provenCustomers ?? 0
            // L'éclosion se dit une fois, au franchissement : la répéter à chaque
            // client ajouté noierait l'événement qui compte.
            const note =
              before === 0 && next > 0
                ? `Éclosion — ${next} client${next > 1 ? 's' : ''} qui paient`
                : `Clients qui paient : ${before} → ${next}`
            return { ...journalise(sim, note), provenCustomers: next || undefined }
          }),
        })),

      abandonSimulation: (id, reason) =>
        set((state) => ({
          savedSims: state.savedSims.map((sim) =>
            sim.id === id
              ? {
                  ...journalise(sim, `Abandonnée — ${reason.trim() || 'sans raison donnée'}`),
                  abandonedAt: Date.now(),
                  abandonReason: reason.trim() || undefined,
                }
              : sim,
          ),
        })),

      reviveSimulation: (id) =>
        set((state) => ({
          savedSims: state.savedSims.map((sim) =>
            sim.id === id
              ? {
                  ...journalise(sim, 'Reprise'),
                  abandonedAt: undefined,
                  abandonReason: undefined,
                }
              : sim,
          ),
        })),

      describeSimulation: (id, patch) =>
        set((state) => ({
          savedSims: state.savedSims.map((sim) =>
            sim.id === id
              ? {
                  ...journalise(
                    sim,
                    'repo' in patch
                      ? patch.repo
                        ? `Dépôt lié — ${patch.repo}`
                        : 'Dépôt retiré'
                      : 'Description mise à jour',
                  ),
                  // Un champ vidé efface la valeur au lieu de garder l'ancienne :
                  // sinon on ne peut jamais retirer un dépôt collé par erreur.
                  ...('note' in patch ? { note: patch.note?.trim() || undefined } : {}),
                  ...('repo' in patch ? { repo: patch.repo?.trim() || undefined } : {}),
                }
              : sim,
          ),
        })),

      duplicateSimulation: (id) =>
        set((state) => {
          const source = state.savedSims.find((sim) => sim.id === id)
          if (!source || state.savedSims.length >= MAX_SAVED_SIMULATIONS) return state
          const copy: SavedSimulation = {
            ...source,
            id: crypto.randomUUID(),
            name: `${source.name} (copy)`,
            savedAt: Date.now(),
          }
          const index = state.savedSims.indexOf(source)
          const savedSims = [...state.savedSims]
          savedSims.splice(index + 1, 0, copy)
          return { savedSims }
        }),

      deleteSimulation: (id) =>
        set((state) => ({ savedSims: state.savedSims.filter((sim) => sim.id !== id) })),

      openSimulation: (id) =>
        set((state) => {
          const sim = state.savedSims.find((entry) => entry.id === id)
          return sim ? { inputs: sim.inputs, currentBasedOn: sim.basedOn } : state
        }),

      pinScenario: (name) =>
        set((state) => {
          if (state.scenarios.length >= MAX_SCENARIOS) return state
          const id = crypto.randomUUID()
          return { scenarios: [...state.scenarios, { id, name, inputs: state.inputs }] }
        }),

      removeScenario: (id) =>
        set((state) => ({ scenarios: state.scenarios.filter((scenario) => scenario.id !== id) })),

      setPanelMode: (mode) => set({ panelMode: mode }),
    }),
    {
      // Clé versionnée : une évolution du schéma d'entrée invalide les
      // scénarios existants plutôt que de tenter une migration hasardeuse.
      name: 'saas-simulator:v1',
      partialize: (state) => ({
        scenarios: state.scenarios,
        panelMode: state.panelMode,
        language: state.language,
        goal: state.goal,
        savedSims: state.savedSims,
      }),
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

/** Traducteur lié à la langue courante. Les composants n'appellent que lui. */
export function useT() {
  const language = useSimulator((state) => state.language)
  return (text: string, vars?: Record<string, string | number>) =>
    translate(language, text, vars)
}
