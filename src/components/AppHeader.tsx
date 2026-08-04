import type { ReactNode } from 'react'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { LanguageToggle } from '@/components/LanguageToggle'
import { navigate } from '@/lib/router'
import { useT } from '@/store/simulator'

interface AppHeaderProps {
  actions?: ReactNode
  /** Les onglets de section, sur grand écran seulement. */
  nav?: ReactNode
  /**
   * Classes ajoutées à l'en-tête. Les sections l'effacent au-delà du point de
   * rupture — marque, navigation et compte vivent alors dans la barre latérale,
   * et un en-tête qui les répéterait mangerait soixante pixels de haut pour rien.
   */
  className?: string
}

export function AppHeader({ actions, nav, className = '' }: AppHeaderProps) {
  const t = useT()

  return (
    <header
      className={`glass-bar sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 px-4 py-3.5 lg:px-6 ${className}`}
    >
      <button
        type="button"
        onClick={() => navigate('#/')}
        className="flex shrink-0 items-center gap-3"
        aria-label={t('Colombes — back to home')}
      >
        <DoveLogo className="h-6 w-[1.9rem] text-foreground" />
        <ColombesWordmark className="h-[0.72rem] w-auto text-foreground" />
      </button>

      {/* Les onglets prennent le centre quand il y a la place ; au téléphone
          ils vivent dans la barre du bas, sous le pouce. */}
      {nav && <div className="ml-4 min-w-0 flex-1">{nav}</div>}

      <div className="ml-auto flex items-center gap-1.5">
        {actions}
        <LanguageToggle />
      </div>
    </header>
  )
}
