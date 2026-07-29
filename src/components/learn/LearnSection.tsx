import { lazy, Suspense, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { GRAINS, type GrainId } from '@/lib/learn'
import { useT } from '@/store/simulator'

/** Les scènes portent les moteurs 3D et le calcul : on ne les charge qu'ouvertes. */
const SCENES: Record<GrainId, React.LazyExoticComponent<() => React.JSX.Element>> = {
  levers: lazy(() => import('./scenes/LeversScene').then((m) => ({ default: m.LeversScene }))),
  tiers: lazy(() => import('./scenes/LadderScene').then((m) => ({ default: m.LadderScene }))),
  'what-remains': lazy(() =>
    import('./scenes/CascadeScene').then((m) => ({ default: m.CascadeScene })),
  ),
  multiple: lazy(() =>
    import('./scenes/BuildupScene').then((m) => ({ default: m.BuildupScene })),
  ),
}

function GrainCard({
  id,
  open,
  onToggle,
}: {
  id: GrainId
  open: boolean
  onToggle: () => void
}) {
  const grain = GRAINS.find((candidate) => candidate.id === id)!
  const Scene = SCENES[id]
  const t = useT()

  return (
    <Card id={`grain-${id}`} className="gap-0 overflow-hidden p-0 scroll-mt-24">
      {/* Anatomie des cartes de la volière : bandeau d'identité, puis le fond. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`grain-body-${id}`}
        className="card-band flex items-start justify-between gap-3 border-b border-border/50 p-4 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
            {t(grain.question)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="text-muted-foreground/60">{t('The belief:')} </span>
            {t(grain.misconception)}
          </p>
        </div>
        <ChevronDown
          aria-hidden
          className={`mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div id={`grain-body-${id}`} className="space-y-4 p-4">
          <Suspense
            fallback={<div className="h-64 animate-pulse rounded-xl bg-foreground/[0.04]" />}
          >
            <Scene />
          </Suspense>

          {/* Le déclic : une ligne, jamais un paragraphe. */}
          <p className="border-t border-border/60 pt-3 text-sm leading-relaxed">{t(grain.insight)}</p>
        </div>
      )}
    </Card>
  )
}

/**
 * Une volée : la même colombe répétée, qui s'éloigne. Le logo joue son rôle
 * d'ornement ici, et nulle part ailleurs — c'est une respiration entre deux
 * modules, pas une décoration de plus.
 */
function Flight() {
  return (
    <div aria-hidden className="flex items-end justify-center gap-3 py-6 sm:gap-5">
      {[0, 1, 2, 3, 4].map((index) => (
        <DoveLogo
          key={index}
          className="reveal text-lume"
          // La perspective se joue sur la taille et l'effacement, comme la ronde.
          style={
            {
              width: `${2.4 - index * 0.38}rem`,
              opacity: 1 - index * 0.17,
              marginBottom: `${index * 0.35}rem`,
              '--reveal-order': index,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function LearnSection({ openGrain }: { openGrain?: string }) {
  const [open, setOpen] = useState<GrainId[]>([GRAINS[0].id])
  const t = useT()

  // Un lien entrant ouvre son grain et l'amène sous les yeux.
  useEffect(() => {
    if (!openGrain) return
    const grain = GRAINS.find((candidate) => candidate.id === openGrain)
    if (!grain) return

    setOpen((current) => (current.includes(grain.id) ? current : [...current, grain.id]))
    document
      .getElementById(`grain-${grain.id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openGrain])

  const toggle = (id: GrainId) =>
    setOpen((current) =>
      current.includes(id) ? current.filter((open) => open !== id) : [...current, id],
    )

  return (
    <section className="mt-12 lg:mt-16" aria-labelledby="learn-title">
      {/* Intermède de marque : le logotype prend la parole, une fois. */}
      <div className="flex flex-col items-center gap-4 text-center">
        <ColombesWordmark className="h-3 w-auto text-foreground/70 sm:h-4" />
        <h2
          id="learn-title"
          className="font-display max-w-xl text-2xl font-bold uppercase tracking-tight sm:text-3xl"
        >
          {t('Understand what you are adjusting')}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          {t(
            'Four things to grasp, in order. Each one is played rather than read: move something, watch what it does, and the sentence underneath will already be obvious.',
          )}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {GRAINS.map((grain, index) => (
          <div key={grain.id}>
            <GrainCard
              id={grain.id}
              open={open.includes(grain.id)}
              onToggle={() => toggle(grain.id)}
            />
            {index === 1 && <Flight />}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <DoveLogo className="w-6 text-lume/70" />
        <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
          {t(
            'Every number here comes from the same engine as the simulator: nothing is staged for the demonstration, and anything you see can be reproduced on your own figures.',
          )}
        </p>
      </div>
    </section>
  )
}
