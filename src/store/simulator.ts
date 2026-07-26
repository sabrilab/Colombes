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
    (set) => ({
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
