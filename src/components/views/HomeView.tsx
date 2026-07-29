import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AppHeader } from '@/components/AppHeader'
import { TierBadge } from '@/components/AnimalGlyph'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PricePad } from '@/components/home/PricePad'
import { Landmarks } from '@/components/home/Landmarks'
import { LearnSection } from '@/components/learn/LearnSection'
import { SavedLibrary } from '@/components/home/SavedLibrary'
import { TierCarousel } from '@/components/home/TierCarousel'
import { animalFor } from '@/lib/pricePad'
import { AVIARY, type Colombe } from '@/lib/aviary'
import { describeHiddenAssumptions } from '@/lib/assumptions'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency, formatMultiple, formatPercent } from '@/lib/format'
import { quickInputs } from '@/lib/quickSim'
import { navigate } from '@/lib/router'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { useSimulator, useT } from '@/store/simulator'

/** Le simulateur « à la louche » : deux curseurs, la valo en direct.
    Tout le reste vient d'hypothèses médianes (quickSim.ts), affichées. */
function MiniSimulator() {
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const [showTiers, setShowTiers] = useState(false)
  const t = useT()
  const loadInputs = useSimulator((state) => state.loadInputs)

  const inputs = useMemo(() => quickInputs(params), [params])
  const results = useMemo(() => compute(inputs), [inputs])
  const animatedValue = useAnimatedNumber(results.valuation.value)

  const refine = () => {
    loadInputs(inputs)
    navigate('#/simulateur')
  }

  return (
    <Card
      className="reveal order-2 mt-5 gap-0 overflow-hidden p-4 sm:p-5 lg:mt-8 lg:p-6"
      style={{ '--reveal-order': 2 } as React.CSSProperties}
    >
      {/* Le bascule des paliers vit dans la carte : ils s'y montrent, sans
          panneau qui recouvre tout. */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {showTiers ? t('The five tiers') : t('Your SaaS, ballpark')}
        </p>
        <Button
          variant={showTiers ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-3 text-xs"
          aria-pressed={showTiers}
          onClick={() => setShowTiers((value) => !value)}
        >
          {t('Tiers')}
        </Button>
      </div>

      {showTiers ? (
        <div className="mx-auto max-w-xl py-2">
          <TierCarousel current={animalFor(params.price)} variant="expanded" />
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:gap-x-6 lg:gap-y-0">
        {/* Le chiffre et son animal : en tête sur mobile, colonne de droite
            au-delà. C'est la conséquence du geste — elle doit être à l'écran
            avant le pad, sans quoi on règle à l'aveugle. */}
        <div className="order-1 flex flex-col justify-center lg:col-start-2 lg:row-start-1 lg:self-center lg:border-l lg:border-border/60 lg:pl-6">
          {/* En ligne sur mobile — animal à droite du chiffre, faute de hauteur
              disponible ; empilé au-delà, la ronde au-dessus du nombre. */}
          <div className="flex items-center gap-4 lg:flex-col-reverse lg:items-stretch lg:gap-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground" id="mini-simulateur-valo">
                {t('Estimated valuation')}
              </p>
              <p
                className="metal-number font-mono text-4xl font-semibold tabular-nums lg:text-5xl"
                aria-live="polite"
                aria-labelledby="mini-simulateur-valo"
              >
                {formatCurrency(animatedValue)}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-4 lg:mt-2 lg:gap-x-6">
                <p>
                  <span className="text-xs text-muted-foreground">MRR </span>
                  <span className="font-mono text-lg font-semibold tabular-nums lg:text-xl">
                    {formatCurrency(results.revenue.mrr)}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatMultiple(results.valuation.multiple)} EBITDA
                </p>
              </div>
            </div>

            <div className="w-[7.5rem] shrink-0 sm:w-40 lg:mb-3 lg:w-auto">
              <TierCarousel current={animalFor(params.price)} />
            </div>
          </div>
        </div>

        <div className="order-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <PricePad params={params} onChange={setParams} />
          <p className="pt-3 text-xs text-muted-foreground">
            {t('Median assumptions applied: churn {churn}/mo, {rest}.', {
              churn: formatPercent(inputs.revenueChurn),
              rest: describeHiddenAssumptions(inputs, t),
            })}
          </p>
        </div>

        {/* L'appel à l'action passe sous le pad sur mobile : entre le chiffre
            et la surface de réglage, il repoussait celle-ci hors de l'écran.
            En grille, il reprend sa place sous le chiffre au-delà. */}
        <div className="order-3 lg:col-start-2 lg:row-start-2 lg:self-start lg:border-l lg:border-border/60 lg:pb-2 lg:pl-6">
          <Button className="lume-pill w-full px-5 sm:w-fit" onClick={refine}>
            {t('Refine in the simulator')}
          </Button>
        </div>
      </div>
      )}
    </Card>
  )
}

function ColombeCard({ colombe, order }: { colombe: Colombe; order: number }) {
  const results = useMemo(() => compute(colombe.inputs), [colombe])
  const t = useT()

  return (
    <button
      type="button"
      onClick={() => navigate(`#/colombe/${colombe.id}`)}
      className="reveal group text-left"
      style={{ '--reveal-order': order } as React.CSSProperties}
      aria-label={t('View {name}’s profile', { name: colombe.name })}
    >
      <Card className="h-full gap-0 overflow-hidden p-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-foreground/25 group-focus-visible:border-foreground/40">
        {/* Bandeau d'identité : la marque et son secteur, rien d'autre. */}
        <div className="card-band flex items-center gap-3 border-b border-border/50 p-4">
          <BrandMark
            id={colombe.id}
            className="size-10 shrink-0 rounded-full ring-1 ring-foreground/10"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight">{colombe.name}</p>
            <p className="truncate text-xs text-muted-foreground">{t(colombe.sector)}</p>
          </div>
        </div>

        {/* Socle : un seul chiffre qui compte, et son multiple. */}
        <div className="flex items-end justify-between gap-3 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t('Valuation')}
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatCompactCurrency(results.valuation.value)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="font-mono text-sm text-muted-foreground tabular-nums">
              {formatMultiple(results.valuation.multiple)}
            </p>
            <TierBadge animal={animalFor(results.revenue.arpu).name} />
          </div>
        </div>
      </Card>
    </button>
  )
}

function useAnnounceAccounts() {
  const t = useT()
  return () =>
    toast(t('Accounts are coming soon'), {
      description: t('Until then, your saved simulations live in this browser.'),
    })
}

export function HomeView({ openGrain }: { openGrain?: string }) {
  const t = useT()
  const announceAccounts = useAnnounceAccounts()

  return (
    <>
      <AppHeader
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => navigate('#/simulateur')}
            >
              {t('Full simulator')}
            </Button>
            {/* Les comptes n'existent pas encore : plutôt qu'un bouton mort ou
                un faux formulaire, on dit où vivent les données aujourd'hui. */}
            <Button size="sm" variant="ghost" onClick={announceAccounts}>
              {t('Sign in')}
            </Button>
            <Button size="sm" className="lume-pill px-4" onClick={announceAccounts}>
              {t('Sign up')}
            </Button>
          </>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-14">
        {/* Mobile d'abord : le module — chiffre, animal, pad — passe devant le
            texte d'intention pour tenir dans le premier écran d'un téléphone.
            Au-delà du point de rupture la place ne manque plus, et l'ordre de
            lecture d'origine revient. */}
        <section className="flex flex-col">
          <div className="contents lg:block lg:max-w-2xl">
            <h1
              className="font-display reveal order-1 text-2xl font-bold uppercase tracking-tight sm:text-3xl lg:text-4xl"
              style={{ '--reveal-order': 0 } as React.CSSProperties}
            >
              {t('What your {saas} is really worth', { saas: '\u0000' })
                .split('\u0000')
                .flatMap((part, index) =>
                  index === 0
                    ? [part]
                    : [
                        <span key="saas" className="text-lume">
                          {t('bootstrapped SaaS')}
                        </span>,
                        part,
                      ],
                )}
            </h1>
            <p
              className="reveal order-3 mt-6 text-muted-foreground lg:mt-3"
              style={{ '--reveal-order': 1 } as React.CSSProperties}
            >
              {t(
                'Set a price and a customer count for a first estimate, then see the levers that move the number: churn, pricing, acquisition. Built for founders between €1K and €100K of MRR — that is where the market benchmarks it uses are calibrated.',
              )}
            </p>
          </div>
          <MiniSimulator />
        </section>

        <LearnSection openGrain={openGrain} />

        <SavedLibrary />

        <section className="mt-12 lg:mt-16" aria-label="The aviary">
          <h2
            className="font-display reveal text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            style={{ '--reveal-order': 3 } as React.CSSProperties}
          >
            {t('The aviary')}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVIARY.map((colombe, index) => (
              <ColombeCard key={colombe.id} colombe={colombe} order={4 + index} />
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            {t(
              'Fictional companies, plausible numbers: every profile is calibrated on the simulator’s market benchmarks (Acquire.com, FE International, ChartMogul).',
            )}
          </p>
        </section>

        <Landmarks />
      </main>
    </>
  )
}
