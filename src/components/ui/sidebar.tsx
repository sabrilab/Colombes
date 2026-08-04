import * as React from 'react'
import { Slot } from 'radix-ui'
import { PanelLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/**
 * La barre latérale, sur le modèle de shadcn/ui.
 *
 * Le registre de shadcn n'est pas joignable depuis cet environnement — la
 * politique de sortie réseau refuse `ui.shadcn.com`, 403 sur le CONNECT — donc
 * `npx shadcn add sidebar` ne peut pas s'exécuter ici. Le composant est écrit à
 * la main en respectant son contrat : mêmes noms, mêmes `data-*`, mêmes
 * variables CSS, mêmes réglages. Une future exécution de la commande le
 * remplacera sans que le reste du code bouge, et les jetons `--sidebar-*` sont
 * déjà dans `index.css`.
 *
 * Trois choses la définissent :
 *
 *  — **elle se replie**. En `collapsible="icon"`, elle tombe à la largeur d'une
 *    icône au lieu de disparaître : on garde les repères et on rend la place.
 *    L'état survit au rechargement, dans un cookie, et bascule au clavier ;
 *  — **on choisit sa taille**. C'est l'ajout au composant d'origine, qui fixe
 *    `--sidebar-width` une fois pour toutes : ici le rail se tire à la souris,
 *    entre douze et vingt-six rem, et la largeur est retenue. Un simulateur
 *    ouvert à côté d'un tableur n'a pas besoin de la même colonne qu'une page
 *    de lecture ;
 *  — **elle devient un tiroir au téléphone**. En dessous du point de rupture,
 *    une barre fixe mangerait un tiers de l'écran : c'est une feuille qu'on
 *    ouvre, et la barre du pouce reste la navigation réelle.
 */

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH_STORAGE = 'sidebar_width'
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

/** Bornes de la largeur réglable, en pixels. */
const WIDTH_BOUNDS = { min: 192, max: 416 }

interface SidebarContextValue {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  width: number | null
  setWidth: (width: number | null) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error('useSidebar doit être appelé sous un <SidebarProvider />.')
  return context
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // L'état d'ouverture est lu du cookie à l'initialisation : rendre d'abord
  // ouvert puis refermer ferait sauter la mise en page au chargement.
  const [internalOpen, setInternalOpen] = React.useState(() => {
    const stored = readCookie(SIDEBAR_COOKIE_NAME)
    return stored === null ? defaultOpen : stored === 'true'
  })
  const open = openProp ?? internalOpen

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (setOpenProp) setOpenProp(value)
      else setInternalOpen(value)
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp],
  )

  const [width, setWidthState] = React.useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  })

  const setWidth = React.useCallback((value: number | null) => {
    setWidthState(value)
    if (value === null) window.localStorage.removeItem(SIDEBAR_WIDTH_STORAGE)
    else window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE, String(Math.round(value)))
  }, [])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((value) => !value)
    else setOpen(!open)
  }, [isMobile, open, setOpen])

  // Le raccourci de shadcn, gardé tel quel : on le connaît d'ailleurs.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar])

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      state: open ? 'expanded' : 'collapsed',
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
      width,
      setWidth,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar, width, setWidth],
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': width === null ? SIDEBAR_WIDTH : `${width}px`,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn('group/sidebar-wrapper flex min-h-svh w-full', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'icon',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn('flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          side={side}
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Navigation</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground lg:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* La cale : elle occupe la place dans le flux pendant que la barre
          elle-même est en position fixe. Sans elle, le contenu passerait
          dessous au lieu de se décaler. */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 z-30 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear lg:flex',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-8', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

/**
 * Le rail : la bande cliquable au bord de la barre.
 *
 * Chez shadcn il ne fait que basculer. Ici il se tire aussi, ce qui est tout
 * l'intérêt d'un outil qu'on ouvre à côté d'autre chose. Les deux gestes
 * cohabitent sans se marcher dessus : on ne bascule qu'au relâchement, et
 * seulement si le pointeur n'a pas bougé de plus de trois pixels — en dessous,
 * c'est une main qui tremble, pas une intention de redimensionner.
 */
export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar, setWidth, state } = useSidebar()
  const dragRef = React.useRef<{ startX: number; moved: boolean } | null>(null)

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Resize or collapse the sidebar"
      tabIndex={-1}
      title="Resize or collapse the sidebar"
      onPointerDown={(event) => {
        if (state === 'collapsed') return
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = { startX: event.clientX, moved: false }
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current
        if (!drag) return
        if (Math.abs(event.clientX - drag.startX) > 3) drag.moved = true
        if (!drag.moved) return
        const next = Math.min(WIDTH_BOUNDS.max, Math.max(WIDTH_BOUNDS.min, event.clientX))
        setWidth(next)
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current
        dragRef.current = null
        event.currentTarget.releasePointerCapture?.(event.pointerId)
        if (!drag?.moved) toggleSidebar()
      }}
      className={cn(
        'absolute inset-y-0 z-40 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border lg:flex',
        'in-data-[side=left]:cursor-ew-resize in-data-[side=right]:cursor-ew-resize',
        'in-data-[side=left]:right-0 in-data-[side=right]:left-0',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize',
        '[[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn('relative flex w-full min-w-0 flex-1 flex-col bg-background', className)}
      {...props}
    />
  )
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  )
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  )
}

export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
      {...props}
    />
  )
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  )
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium tracking-[0.16em] text-sidebar-foreground/60 uppercase transition-[margin,opacity] duration-200 ease-linear',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  )
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  isActive?: boolean
  /** Affiché à la place du libellé quand la barre est repliée en icônes. */
  tooltip?: string
}) {
  const Comp = asChild ? Slot.Root : 'button'
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(
        'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-[1.1rem] p-2 text-left text-sm font-semibold outline-hidden transition-[width,height,padding] focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-lume',
        'group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!',
        '[&>svg]:size-[1.15rem] [&>svg]:shrink-0 [&>span:last-child]:truncate',
        className,
      )}
      {...props}
    />
  )

  if (!tooltip || state !== 'collapsed' || isMobile) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
