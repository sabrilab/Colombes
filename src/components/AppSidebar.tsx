import { Compass, Egg, Gauge, GraduationCap } from 'lucide-react'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { LanguageToggle } from '@/components/LanguageToggle'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { SECTIONS, activeSection, type Section } from '@/lib/sections'
import { navigate, useRoute } from '@/lib/router'
import { useT } from '@/store/simulator'

const ICONS: Record<Section['id'], typeof Gauge> = {
  ballpark: Gauge,
  learn: GraduationCap,
  aviary: Compass,
  nest: Egg,
  simulator: Gauge,
  lab: Gauge,
  colombe: Compass,
}

/**
 * Le contenu de la barre latérale : la marque, les quatre sections, le compte.
 *
 * Elle accompagne aussi le simulateur complet, et pas seulement les sections.
 * C'est là qu'on passe le plus de temps, souvent à côté d'une autre fenêtre —
 * et c'est précisément l'écran où l'on veut pouvoir replier la navigation pour
 * rendre trois cents pixels au tableau de bord, sans perdre le moyen d'en
 * sortir.
 */
export function AppSidebar({ onAccount }: { onAccount: () => void }) {
  const route = useRoute()
  const active = activeSection(route)
  const t = useT()
  const { setOpenMobile, isMobile } = useSidebar()

  const go = (hash: string) => {
    navigate(hash)
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <button
          type="button"
          onClick={() => go('#/')}
          className="flex h-10 shrink-0 items-center gap-3 overflow-hidden rounded-[1.1rem] px-2"
          aria-label={t('Colombes — back to home')}
        >
          <DoveLogo className="h-6 w-[1.9rem] shrink-0 text-foreground" />
          {/* Le mot disparaît avec la largeur, la colombe reste : repliée, la
              barre doit encore dire de quelle application il s'agit. */}
          <ColombesWordmark className="h-[0.72rem] w-auto text-foreground group-data-[collapsible=icon]:hidden" />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SECTIONS.map((section) => {
              const Icon = ICONS[section.id]
              return (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    isActive={active === section.id}
                    tooltip={t(section.label)}
                    aria-current={active === section.id ? 'page' : undefined}
                    onClick={() => go(section.hash)}
                  >
                    <Icon aria-hidden />
                    <span>{t(section.label)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <Button
            size="sm"
            className="lume-pill flex-1 px-4 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
            onClick={onAccount}
          >
            <span className="group-data-[collapsible=icon]:hidden">{t('Account')}</span>
            <span className="hidden group-data-[collapsible=icon]:inline" aria-hidden>
              @
            </span>
          </Button>
          <LanguageToggle />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
