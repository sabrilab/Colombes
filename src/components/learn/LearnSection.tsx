import { lazy, Suspense, useEffect } from 'react'
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
 * Un module, à même la page. Rien à déplier, et surtout aucun cadre autour du
 * texte : une carte se justifie quand elle sépare deux choses de nature
 * différente, pas pour poser un titre. Seules les commandes sont cerclées —
 * elles, on doit savoir où les attraper.
 */
function GrainBlock({ id, index }: { id: GrainId; index: number }) {
  const grain = GRAINS.find((candidate) => candidate.id === id)!
  const Scene = SCENES[id]
  const t = useT()

  return (
    <article id={`grain-${id}`} className="scroll-mt-24">
      <div className="flex items-baseline gap-3">
        {/* Le numéro donne l'ordre sans l'imposer : on entre où l'on veut. */}
        <span
          aria-hidden
          className="font-mono text-xl font-semibold leading-none text-lume/30 tabular-nums sm:text-2xl"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="font-display text-base font-semibold uppercase tracking-[0.14em] text-lume sm:text-lg">
          {t(grain.question)}
        </h3>
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        <span className="text-muted-foreground/60">{t('The belief:')} </span>
        {t(grain.misconception)}
      </p>

      <div className="mt-5">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-foreground/[0.04]" />}>
          <Scene />
        </Suspense>
      </div>

      {/* Le déclic : une ligne, adossée à un filet citron. */}
      <p className="mt-5 border-l-2 border-lume/50 pl-3 text-sm leading-relaxed">
        {t(grain.insight)}
      </p>
    </article>
  )
}

/**
 * Une volée : la même colombe répétée, qui s'éloigne. Le logo n'est ornement
 * qu'ici — une respiration entre deux modules, jamais un filigrane rogné par
 * le bord d'une carte.
 */
function Flight() {
  return (
    <div aria-hidden className="flex items-end justify-center gap-3 py-2 sm:gap-5">
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

  useEffect(() => {
    if (!openGrain) return
    document
      .getElementById(`grain-${openGrain}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openGrain])

  return (
    <section className="mt-14 lg:mt-20" aria-labelledby="learn-title">
      {/* Le bandeau d'ouverture est un bouton citron à l'échelle d'une carte :
          même matière que « Affiner dans le simulateur », juste au-dessus. */}
      <div className="lume-slab rounded-2xl px-5 py-9 text-center sm:px-10 sm:py-12">
        <ColombesWordmark className="mx-auto h-2.5 w-auto opacity-55 sm:h-3.5" />
        <h2
          id="learn-title"
          className="font-display mx-auto mt-5 max-w-xl text-2xl font-bold uppercase tracking-tight sm:text-4xl"
        >
          {t('Understand what you are adjusting')}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed opacity-75">
          {t(
            'Four things to grasp, in order. Each one is played rather than read: move something, watch what it does, and the sentence underneath will already be obvious.',
          )}
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {GRAINS.map((grain, index) => (
          <div key={grain.id} className="space-y-12">
            <GrainBlock id={grain.id} index={index} />
            {index === 1 && <Flight />}
          </div>
        ))}
      </div>

      {/* Clôture : le logotype en entier, jamais rogné. */}
      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <ColombesWordmark className="w-40 text-foreground/10 sm:w-56" />
        <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
          {t(
            'Every number here comes from the same engine as the simulator: nothing is staged for the demonstration, and anything you see can be reproduced on your own figures.',
          )}
        </p>
      </div>
    </section>
  )
}
