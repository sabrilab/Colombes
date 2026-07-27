import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { compute } from '@/lib/engine'
import type { SimulatorInputs, SimulatorResults, Tier } from '@/lib/engine/types'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import { addTierTo, removeTierAt } from '@/lib/tiers'
import { readInputsFromHash } from '@/lib/urlState'
import { detectLanguage, translate, type Language } from '@/lib/i18n'

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
}

export const MAX_SAVED_SIMULATIONS = 12

export type PanelMode = 'simple' | 'expert'

interface SimulatorState {
  inputs: SimulatorInputs
  scenarios: Scenario[]
  panelMode: PanelMode
  language: Language
  setLanguage: (language: Language) => void
  setInput: <K extends keyof SimulatorInputs>(key: K, value: SimulatorInputs[K]) => void
  setTier: (index: number, patch: Partial<Tier>) => void
  addTier: () => void
  removeTier: (index: number) => void
  loadInputs: (inputs: SimulatorInputs, basedOn?: string | null) => void
  resetInputs: () => void
  savedSims: SavedSimulation[]
  /** Origine de l'état courant, pour l'attribuer si on l'enregistre. */
  currentBasedOn: string | null
  saveSimulation: (name: string) => void
  renameSimulation: (id: string, name: string) => void
  duplicateSimulation: (id: string) => void
  deleteSimulation: (id: string) => void
  openSimulation: (id: string) => void
  pinScenario: (name: string) => void
  removeScenario: (id: string) => void
  setPanelMode: (mode: PanelMode) => void
}

export const useSimulator = create<SimulatorState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      scenarios: [],
      panelMode: 'expert',
      language: detectLanguage(),

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

      saveSimulation: (name) =>
        set((state) => {
          if (state.savedSims.length >= MAX_SAVED_SIMULATIONS) return state
          const entry: SavedSimulation = {
            id: crypto.randomUUID(),
            name: name.trim() || `Simulation ${state.savedSims.length + 1}`,
            inputs: state.inputs,
            basedOn: state.currentBasedOn,
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

      duplicateSimulation: (id) =>
        set((state) => {
          const source = state.savedSims.find((sim) => sim.id === id)
          if (!source || state.savedSims.length >= MAX_SAVED_SIMULATIONS) return state
          const copy: SavedSimulation = {
            ...source,
            id: crypto.randomUUID(),
            name: `${source.name} (copy)`,
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
