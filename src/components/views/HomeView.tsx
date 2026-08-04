import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PricePad } from '@/components/home/PricePad'
import { MarginPanel } from '@/components/home/MarginPanel'
import { ConceptBento } from '@/components/home/ConceptBento'
import { TierCarousel } from '@/components/home/TierCarousel'
import { animalFor } from '@/lib/pricePad'
import { BILLING_PERIODS, type BillingPeriod } from '@/lib/billingPeriod'
import { describeHiddenAssumptions } from '@/lib/assumptions'
import { compute } from '@/lib/engine'
import { formatCurrency, formatMultiple, formatPercent } from '@/lib/format'
import { quickInputs, type QuickExtras } from '@/lib/quickSim'
import { navigate } from '@/lib/router'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { useSimulator, useT } from '@/store/simulator'

/** Le simulateur « à la louche » : deux curseurs, la valo en direct.
    Tout le reste vient d'hypothèses médianes (quickSim.ts), affichées. */
/**
 * Le sélecteur de cadence : à la semaine, au mois, à l'année.
 *
 * Trois segments et non un menu déroulant. Il y a exactement trois choix, ils
 * tiennent sur une ligne, et un menu demanderait deux gestes pour en changer —
 * alors que tout l'intérêt est de basculer d'une cadence à l'autre pour voir
 * ce que ça donne.
 */
function PeriodPicker({
  period,
  onChange,
}: {
  period: BillingPeriod
  onChange: (period: BillingPeriod) => void
}) {
  const t = useT()

  return (
    <div
      role="radiogroup"
      aria-label={t('Billing period')}
      className="glass-bevel flex shrink-0 items-center gap-0.5 rounded-full p-0.5"
    >
      {BILLING_PERIODS.map((option) => {
        const active = option.id === period
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              active
                ? 'bg-lume text-[oklch(0.2_0.03_112)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(option.label)}
          </button>
        )
      })}
    </div>
  )
}

function MiniSimulator() {
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const [showTiers, setShowTiers] = useState(false)
  /*
   * Les deux dépenses restent déduites tant qu'on n'y a pas touché — un objet
   * vide, et non des valeurs par défaut recopiées. C'est ce qui permet de
   * déplacer la colombe d'un bout à l'autre du pad sans que les coûts perdent
   * tout sens ; dès qu'on tient un curseur, il cesse de suivre.
   */
  const [extras, setExtras] = useState<QuickExtras>({})
  const t = useT()
  const loadInputs = useSimulator((state) => state.loadInputs)

  const inputs = useMemo(() => quickInputs(params, period, extras), [params, period, extras])
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {showTiers ? t('The five tiers') : t('Your app, ballpark')}
        </p>
        <div className="flex items-center gap-2">
          {!showTiers && <PeriodPicker period={period} onChange={setPeriod} />}
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
          <PricePad params={params} onChange={setParams} period={period} />
          <p className="pt-3 text-xs text-muted-foreground">
            {t('Median assumptions applied: churn {churn}/mo, {rest}.', {
              churn: formatPercent(inputs.revenueChurn),
              rest: describeHiddenAssumptions(inputs, t, ['margin', 'fixedCosts']),
            })}
            {/* Facturer à l'année n'est pas qu'une unité : le client s'engage
                douze mois et ne décide qu'au renouvellement. Le moteur le
                compte déjà ; le dire ici évite qu'on croie à un bug quand la
                valorisation monte en changeant de cadence. */}
            {period === 'yearly' && (
              <>
                {' '}
                <span className="text-lume">
                  {t('Billed yearly: the model halves the churn on that commitment.')}
                </span>
              </>
            )}
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

        {/* Ce qui reste, sur toute la largeur. La barre des quatre parts a
            besoin de longueur pour que les segments minces restent lisibles,
            et la question qu'elle pose — qu'est-ce que je garde ? — vient
            après le chiffre, jamais avant. */}
        <div className="order-4 border-t border-border/60 pt-5 lg:col-span-2 lg:row-start-3 lg:mt-2">
          <MarginPanel
            results={results}
            addOn={extras.addOnPerCustomer ?? 0}
            /* Le coût affiché se relit du moteur, jamais de l'état local : c'est
               ce qui garde le champ sur la valeur déduite tant qu'on n'y a pas
               touché, et sur la valeur saisie dès qu'on l'a fait. */
            costPerCustomer={results.revenue.arpu * (1 - inputs.grossMargin)}
            fixedCosts={inputs.fixedCosts}
            period={period}
            onAddOn={(monthly) => setExtras((state) => ({ ...state, addOnPerCustomer: monthly }))}
            onCostPerCustomer={(monthly) =>
              setExtras((state) => ({ ...state, costPerCustomer: monthly }))
            }
            onFixedCosts={(value) => setExtras((state) => ({ ...state, fixedCosts: value }))}
          />
        </div>
      </div>
      )}
    </Card>
  )
}



export function HomeView() {
  const t = useT()

  return (
    <>
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
              {t('What your {app} is really worth', { app: '\u0000' })
                .split('\u0000')
                .flatMap((part, index) =>
                  index === 0
                    ? [part]
                    : [
                        <span key="saas" className="text-lume">
                          {t('subscription app')}
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

        <ConceptBento />

    </>
  )
}
