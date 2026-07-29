import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import { Compass, GraduationCap, Bookmark, Gauge } from 'lucide-react'
import { SECTIONS, activeSection, type Section } from '@/lib/sections'
import { navigate, useRoute } from '@/lib/router'
import { useT } from '@/store/simulator'

const ICONS: Record<Section['id'], typeof Gauge> = {
  home: Gauge,
  learn: GraduationCap,
  aviary: Compass,
  saved: Bookmark,
  simulator: Gauge,
  lab: Gauge,
  colombe: Compass,
}

/**
 * L'onde qui part du doigt. GSAP plutôt qu'une transition CSS : il faut jouer
 * la même animation à la demande, plusieurs fois, sur un élément qu'on ne
 * démonte pas — c'est exactement ce qu'une timeline sait faire et ce qu'une
 * classe CSS fait mal.
 */
function useRipple() {
  const layer = useRef<HTMLSpanElement | null>(null)

  return (host: HTMLElement | null) => {
    if (!host) return
    const dot = document.createElement('span')
    dot.className = 'pointer-events-none absolute inset-0 rounded-[1.1rem] bg-lume/25'
    host.appendChild(dot)
    layer.current = dot

    gsap.fromTo(
      dot,
      { scale: 0.55, opacity: 0.85 },
      {
        scale: 1.35,
        opacity: 0,
        duration: 0.55,
        ease: 'expo.out',
        onComplete: () => dot.remove(),
      },
    )
  }
}

function Tab({
  section,
  active,
  onSelect,
}: {
  section: Section
  active: boolean
  onSelect: () => void
}) {
  const hostRef = useRef<HTMLButtonElement>(null)
  const Icon = ICONS[section.id]
  const ripple = useRipple()
  const t = useT()

  return (
    <button
      ref={hostRef}
      type="button"
      onClick={() => {
        ripple(hostRef.current)
        onSelect()
      }}
      aria-current={active ? 'page' : undefined}
      className={`relative isolate flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[1.1rem] px-2 pb-0.5 text-[10px] font-medium leading-none tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lume/60 ${
        active ? 'text-lume' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {/* La pastille de focus est un seul élément partagé : Motion l'anime
          d'un onglet à l'autre au lieu d'en fondre deux. C'est ce qui donne
          le glissement, et ça reste juste même si l'onglet change de largeur. */}
      {active && (
        <motion.span
          layoutId="section-focus"
          aria-hidden
          className="nav-focus absolute inset-0 -z-10 rounded-[1.1rem]"
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
        />
      )}
      <Icon className="size-[1.15rem]" aria-hidden />
      <span className="leading-none">{t(section.label)}</span>
    </button>
  )
}

/**
 * La navigation principale : barre basse au pouce sur téléphone, rangée
 * d'onglets dans l'en-tête au-delà. Même matière que le reste — verre
 * translucide, biseau haut éclairé — et le focus glisse plutôt qu'il ne saute.
 */
export function SectionNav({ variant }: { variant: 'bottom' | 'inline' }) {
  const route = useRoute()
  const active = activeSection(route)
  const reduced = useReducedMotion()
  const railRef = useRef<HTMLDivElement>(null)

  // Entrée de la barre : elle monte une fois, à l'arrivée. Sans ça elle
  // apparaît brutalement au premier rendu, en travers de la page.
  useEffect(() => {
    if (variant !== 'bottom' || reduced) return
    const rail = railRef.current
    if (!rail) return
    const tween = gsap.fromTo(
      rail,
      { yPercent: 120, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.15 },
    )
    return () => {
      tween.kill()
    }
  }, [reduced, variant])

  const tabs = (
    <>
      {SECTIONS.map((section) => (
        <Tab
          key={section.id}
          section={section}
          active={active === section.id}
          onSelect={() => navigate(section.hash)}
        />
      ))}
    </>
  )

  if (variant === 'inline') {
    return (
      <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
        {tabs}
      </nav>
    )
  }

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div ref={railRef} className="nav-glass flex items-stretch gap-0.5 rounded-[1.45rem] p-1">
        {tabs}
      </div>
    </nav>
  )
}
