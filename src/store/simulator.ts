import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { compute } from '@/lib/engine'
import type { SimulatorInputs, SimulatorResults, Tier } from '@/lib/engine/types'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import { addTierTo, removeTierAt } from '@/lib/tiers'
import { readInputsFromHash } from '@/lib/urlState'

export interface Scenario {
  id: string
  name: string
  inputs: SimulatorInputs
}

export const MAX_SCENARIOS = 3

export type PanelMode = 'simple' | 'expert'

interface SimulatorState {
  inputs: SimulatorInputs
  scenarios: Scenario[]
  theme: 'light' | 'dark'
  panelMode: PanelMode
  setInput: <K extends keyof SimulatorInputs>(key: K, value: SimulatorInputs[K]) => void
  setTier: (index: number, patch: Partial<Tier>) => void
  addTier: () => void
  removeTier: (index: number) => void
  loadInputs: (inputs: SimulatorInputs) => void
  resetInputs: () => void
  pinScenario: (name: string) => void
  removeScenario: (id: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  setPanelMode: (mode: PanelMode) => void
}

function initialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useSimulator = create<SimulatorState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      scenarios: [],
      theme: initialTheme(),
      panelMode: 'expert',

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

      loadInputs: (inputs) => set({ inputs }),

      resetInputs: () => set({ inputs: DEFAULT_INPUTS }),

      pinScenario: (name) =>
        set((state) => {
          if (state.scenarios.length >= MAX_SCENARIOS) return state
          const id = crypto.randomUUID()
          return { scenarios: [...state.scenarios, { id, name, inputs: state.inputs }] }
        }),

      removeScenario: (id) =>
        set((state) => ({ scenarios: state.scenarios.filter((scenario) => scenario.id !== id) })),

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },

      setPanelMode: (mode) => set({ panelMode: mode }),
    }),
    {
      // Clé versionnée : une évolution du schéma d'entrée invalide les
      // scénarios existants plutôt que de tenter une migration hasardeuse.
      name: 'saas-simulator:v1',
      partialize: (state) => ({
        scenarios: state.scenarios,
        theme: state.theme,
        panelMode: state.panelMode,
      }),
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
