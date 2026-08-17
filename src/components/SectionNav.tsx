import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import gsap from 'gsap'
import { Compass, GraduationCap, Egg, Gauge } from 'lucide-react'
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
 * L'onde qui part du doigt. GSAP plutôt qu'une transition CSS : il faut jouer
 * la même animation à la demande, plusieurs fois, sur un élément qu'on ne
 * démonte pas — c'est exactement ce qu'une timeline sait faire et ce qu'une
 * classe CSS fait mal.
 */
function useRipple() {
  const layer = useRef<HTMLSpanElement | null>(null)

  return (host: HTMLElement | null, onYellow = false) => {
    if (!host) return
    const dot = document.createElement('span')
    dot.className = `pointer-events-none absolute inset-0 rounded-[1.1rem] ${
      onYellow ? 'bg-foreground/20' : 'bg-lume/25'
    }`
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
  onYellow,
  rail = false,
}: {
  section: Section
  active: boolean
  onSelect: () => void
  /** La barre basse est jaune, l'en-tête est sombre : l'encre s'inverse. */
  onYellow: boolean
  /** En barre latérale : une ligne, icône à gauche, libellé à droite. */
  rail?: boolean
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
        ripple(hostRef.current, onYellow)
        onSelect()
      }}
      aria-current={active ? 'page' : undefined}
      className={`relative isolate flex overflow-hidden rounded-[1.1rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        rail
          ? 'w-full min-h-11 items-center gap-3 px-3 text-sm tracking-tight'
          : 'min-h-14 flex-1 flex-col items-center justify-center gap-1 px-2 text-[11px] leading-none tracking-tight'
      } ${
        onYellow
          ? `focus-visible:outline-foreground/50 ${active ? 'nav-ink' : 'nav-ink-dim'}`
          : `focus-visible:outline-lume/60 ${
              active ? 'text-lume' : 'text-muted-foreground hover:text-foreground'
            }`
      }`}
    >
      {/* La pastille de focus est un seul élément partagé : Motion l'anime
          d'un onglet à l'autre au lieu d'en fondre deux. C'est ce qui donne
          le glissement, et ça reste juste même si l'onglet change de largeur. */}
      {active && (
        <motion.span
          /* Un identifiant par barre. Les trois variantes coexistent dans le
             document — l'une masquée par la requête de média — et un même
             `layoutId` partagé ferait voyager la pastille de l'une à l'autre. */
          layoutId={rail ? 'section-focus-rail' : 'section-focus-bottom'}
          aria-hidden
          className={`absolute inset-0 -z-10 rounded-[1.1rem] ${
            onYellow ? 'nav-focus' : 'nav-focus-dark'
          }`}
          transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
        />
      )}
      <Icon className={rail ? 'size-[1.15rem] shrink-0' : 'size-[1.35rem]'} aria-hidden />
      <span className="leading-none">{t(section.label)}</span>
    </button>
  )
}

/**
 * La navigation principale : barre basse au pouce sur téléphone, colonne dans
 * la barre latérale au-delà. Trois onglets, larges et hauts de cinquante-six
 * pixels — la hauteur d'une barre d'onglets de téléphone, et la raison pour
 * laquelle on l'atteint sans regarder. Même matière que le reste — verre translucide,
 * biseau haut éclairé — et le focus glisse plutôt qu'il ne saute.
 *
 * Une troisième variante a existé, `inline` : les quatre onglets recopiés au
 * milieu de l'en-tête sur grand écran. Elle est partie avec la barre latérale,
 * qui fait le même travail sans imiter un téléphone.
 */
export function SectionNav({ variant }: { variant: 'bottom' | 'rail' }) {
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
          onYellow={variant === 'bottom'}
          rail={variant === 'rail'}
          onSelect={() => navigate(section.hash)}
        />
      ))}
    </>
  )

  if (variant === 'rail') {
    return (
      <nav aria-label="Sections" className="flex flex-col gap-1">
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
