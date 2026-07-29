import { lazy, Suspense, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ColombesWordmark, DoveLogo } from '@/components/DoveLogo'
import { GRAINS, type GrainId } from '@/lib/learn'
import { useT } from '@/store/simulator'

/** Les scènes portent du calcul et de la 3D : chacune dans son propre morceau. */
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

/**
 * Un module, toujours ouvert. Rien à déplier : un contenu qu'on doit demander
 * à voir est un contenu qu'on suppose optionnel, et celui-ci ne l'est pas.
 */
function GrainCard({ id, index }: { id: GrainId; index: number }) {
  const grain = GRAINS.find((candidate) => candidate.id === id)!
  const Scene = SCENES[id]
  const t = useT()

  return (
    <Card id={`grain-${id}`} className="scroll-mt-24 gap-0 overflow-hidden p-0">
      <div className="card-band relative flex items-start gap-4 overflow-hidden border-b border-border/50 p-4 sm:p-5">
        {/* Le numéro donne l'ordre sans l'imposer : on entre où l'on veut. */}
        <span
          aria-hidden
          className="font-mono text-2xl font-semibold leading-none text-lume/25 tabular-nums sm:text-3xl"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold uppercase tracking-[0.14em] text-lume sm:text-lg">
            {t(grain.question)}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="text-muted-foreground/60">{t('The belief:')} </span>
            {t(grain.misconception)}
          </p>
        </div>

        {/* Filigrane : la colombe déborde du bandeau, à peine visible. */}
        <DoveLogo
          className="pointer-events-none absolute -right-4 -top-3 w-20 text-foreground/[0.04]"
        />
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-foreground/[0.04]" />}>
          <Scene />
        </Suspense>

        {/* Le déclic : une ligne, adossée à un filet citron. */}
        <p className="border-l-2 border-lume/50 pl-3 text-sm leading-relaxed">{t(grain.insight)}</p>
      </div>
    </Card>
  )
}

/**
 * Une volée : la même colombe répétée, qui s'éloigne. Le logo joue son rôle
 * d'ornement ici, et presque nulle part ailleurs — c'est une respiration
 * entre deux modules, pas une décoration de plus.
 */
function Flight() {
  return (
    <div aria-hidden className="flex items-end justify-center gap-3 py-7 sm:gap-5">
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
  const t = useT()

  // Un lien entrant amène son module sous les yeux. Plus rien à ouvrir : ils
  // le sont tous, il n'y a qu'à s'y rendre.
  useEffect(() => {
    if (!openGrain) return
    document
      .getElementById(`grain-${openGrain}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openGrain])

  return (
    <section className="relative mt-14 lg:mt-20" aria-labelledby="learn-title">
      {/* La nappe déborde du cadre et passe derrière tout : une ambiance, pas
          un fond de carte. */}
      <div
        aria-hidden
        className="lume-wash pointer-events-none absolute -inset-x-8 -top-16 bottom-0 -z-10 rounded-[3rem]"
      />

      {/* Bandeau d'ouverture : le verre taillé du bouton citron, à l'échelle. */}
      <div className="lume-slab relative overflow-hidden rounded-2xl px-5 py-9 text-center sm:px-10 sm:py-12">
        <ColombesWordmark className="mx-auto h-2.5 w-auto text-foreground/60 sm:h-3.5" />
        <h2
          id="learn-title"
          className="font-display mx-auto mt-5 max-w-xl text-2xl font-bold uppercase tracking-tight sm:text-4xl"
        >
          {t('Understand what you are adjusting')}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-foreground/70">
          {t(
            'Four things to grasp, in order. Each one is played rather than read: move something, watch what it does, and the sentence underneath will already be obvious.',
          )}
        </p>

        <DoveLogo
          className="pointer-events-none absolute -bottom-10 -right-8 w-40 rotate-12 text-foreground/[0.05] sm:w-52"
        />
      </div>

      <div className="mt-6 space-y-4">
        {GRAINS.map((grain, index) => (
          <div key={grain.id}>
            <GrainCard id={grain.id} index={index} />
            {index === 1 && <Flight />}
          </div>
        ))}
      </div>

      {/* Clôture : le logotype en filigrane, très grand et très effacé. */}
      <div className="relative mt-10 overflow-hidden rounded-2xl border border-border/50 px-6 py-8 text-center">
        <ColombesWordmark
          className="pointer-events-none absolute -bottom-2 left-1/2 w-[140%] max-w-none -translate-x-1/2 text-foreground/[0.035]"
        />
        <p className="relative mx-auto max-w-lg text-xs leading-relaxed text-muted-foreground">
          {t(
            'Every number here comes from the same engine as the simulator: nothing is staged for the demonstration, and anything you see can be reproduced on your own figures.',
          )}
        </p>
      </div>
    </section>
  )
}
