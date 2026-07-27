import type { ReactNode } from 'react'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { navigate } from '@/lib/router'

interface AppHeaderProps {
  actions?: ReactNode
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="glass-bar sticky top-0 z-40 flex items-center justify-between border-b border-border/60 px-4 py-3.5 lg:px-6">
      <button
        type="button"
        onClick={() => navigate('#/')}
        className="flex items-center gap-3"
        aria-label="Colombes — back to home"
      >
        <DoveLogo className="h-6 w-[1.9rem] text-foreground" />
        <ColombesWordmark className="h-[0.72rem] w-auto text-foreground" />
      </button>
      <div className="flex items-center gap-1.5">{actions}</div>
    </header>
  )
}
