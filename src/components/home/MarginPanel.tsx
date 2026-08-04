import { Input } from '@/components/ui/input'
import { formatCurrency, formatPrice } from '@/lib/format'
import { billingPeriodOption, fromMonthly, toMonthly, type BillingPeriod } from '@/lib/billingPeriod'
import type { SimulatorResults } from '@/lib/engine/types'
import { useT } from '@/store/simulator'

/**
 * Ce que chaque client ajoute, et ce qu'il en reste.
 *
 * Le mini-simulateur montrait un revenu et une valorisation, et posait la marge
 * en hypothèse muette au bas du panneau. Or la question qu'on se pose vraiment
 * est par client : celui-ci me paie six euros de plus, il m'en coûte deux à
 * servir — au bout du compte, l'abonnement fait combien, et je garde quoi ?
 *
 * D'où trois montants qu'on tape, et ni pourcentage ni curseur. Une part du
 * revenu demande de traduire soi-même, et un curseur demande de viser :
 * quelqu'un qui sait que son client paie six euros de plus veut écrire six.
 *
 *  — **le supplément**, ce que le client paie en plus de l'abonnement de base.
 *    Il s'additionne au prix, donc il déplace l'abonnement total, le palier où
 *    l'on se situe et le coût d'acquisition qu'on peut se permettre ;
 *  — **le coût de service** : hébergement, jetons d'inférence revendus, support ;
 *  — **l'équipe et les outils**, seul montant qui ne soit pas par client — un
 *    freelance à deux mille euros coûte deux mille euros qu'on ait dix clients
 *    ou mille.
 *
 * Les deux premiers se saisissent dans la cadence choisie au-dessus du panneau,
 * et l'équivalent mensuel s'affiche dessous : c'est la conversion qu'on ne veut
 * pas faire de tête, six euros par semaine faisant vingt-six euros par mois et
 * non vingt-quatre.
 *
 * L'acquisition apparaît dans la barre sans champ : elle est déduite du coût
 * d'acquisition et du rythme d'entrée. La montrer sans la rendre saisissable est
 * le seul choix honnête — elle mange une part réelle du revenu, et prétendre
 * l'inverse ferait un bénéfice imaginaire.
 *
 * Aucun chiffre n'est recalculé ici : abonnement total, parts et bénéfice
 * viennent tous de `compute()`, le moteur de production.
 */

/** Une ligne de saisie : un libellé, un montant, son unité, sa conversion. */
function AmountRow({
  label,
  hint,
  value,
  unit,
  monthly,
  onChange,
}: {
  label: string
  hint: string
  value: number
  unit: string
  /** L'équivalent mensuel, quand la cadence saisie n'est pas le mois. */
  monthly?: string
  onChange: (value: number) => void
}) {
  const t = useT()

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-sm">{t(label)}</span>
        <div className="relative shrink-0">
          <span
            className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground"
            aria-hidden
          >
            €
          </span>
          <Input
            type="number"
            min={0}
            step="0.5"
            inputMode="decimal"
            value={Number.isInteger(value) ? value : Number(value.toFixed(2))}
            /* Un champ vidé rend une chaîne vide, dont `Number` fait zéro — ce
               qui est le comportement voulu. `|| 0` couvre le NaN d'une saisie
               illisible : on ne propage jamais un NaN dans le moteur. */
            onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
            aria-label={t(label)}
            className="h-9 w-28 pl-6 pr-2 text-right font-mono tabular-nums"
          />
        </div>
        <span className="w-9 shrink-0 text-sm text-muted-foreground">{t(unit)}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {monthly && (
          <span className="text-foreground/70">
            = {monthly}
            {t('/mo')} ·{' '}
          </span>
        )}
        {t(hint)}
      </p>
    </div>
  )
}

export function MarginPanel({
  results,
  addOn,
  costPerCustomer,
  fixedCosts,
  period,
  onAddOn,
  onCostPerCustomer,
  onFixedCosts,
}: {
  results: SimulatorResults
  /** Supplément par client, en euros par mois. */
  addOn: number
  /** Coût de service par client, en euros par mois. */
  costPerCustomer: number
  fixedCosts: number
  /** La cadence choisie dans le panneau : les montants par client s'y saisissent. */
  period: BillingPeriod
  onAddOn: (monthly: number) => void
  onCostPerCustomer: (monthly: number) => void
  onFixedCosts: (monthly: number) => void
}) {
  const t = useT()
  const { arpu, mrr, variableCost, acquisitionCost, sdeMonthly, netMargin } = results.revenue
  const unit = billingPeriodOption(period).unit
  const monthlyOf = (value: number) => (period === 'monthly' ? undefined : formatPrice(value))

  // Le supplément, en revenu : il est payé par tous les clients, comme le prix.
  const addOnRevenue = addOn * (arpu > 0 ? mrr / arpu : 0)

  /*
   * Les quatre parts, dans l'ordre où l'argent s'en va. Le bénéfice peut être
   * négatif — on dépense alors plus qu'on n'encaisse — et la barre le montre en
   * rouge plutôt que de replier le segment à zéro : une entreprise qui perd de
   * l'argent ne doit pas ressembler à une entreprise qui gagne peu.
   */
  const parts = [
    { key: 'serve', label: 'Serving them', value: variableCost, tone: 'bg-foreground/25' },
    { key: 'acquire', label: 'Winning them', value: acquisitionCost, tone: 'bg-foreground/15' },
    { key: 'fixed', label: 'Team and tools', value: fixedCosts, tone: 'bg-foreground/35' },
    {
      key: 'profit',
      label: 'What you keep',
      value: sdeMonthly,
      tone: sdeMonthly >= 0 ? 'bg-lume' : 'bg-destructive',
    },
  ]

  // Les parts se lisent sur le revenu, sauf en perte : la barre représente alors
  // ce qui sort, qui dépasse ce qui entre.
  const span = Math.max(mrr, parts.reduce((total, part) => total + Math.abs(part.value), 0))

  return (
    <div className="space-y-5">
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('Per customer')}
          </p>

          <AmountRow
            label="They also pay you"
            hint="An add-on, a seat, a usage pack — on top of the plan."
            value={fromMonthly(addOn, period)}
            unit={unit}
            monthly={monthlyOf(addOn)}
            onChange={(value) => onAddOn(toMonthly(value, period))}
          />

          <AmountRow
            label="They cost you"
            hint="Hosting, the tokens you resell, the support you answer."
            value={fromMonthly(costPerCustomer, period)}
            unit={unit}
            monthly={monthlyOf(costPerCustomer)}
            onChange={(value) => onCostPerCustomer(toMonthly(value, period))}
          />

          <AmountRow
            label="Team and tools"
            hint="What you pay every month whoever shows up: you, a freelance, the tools."
            value={fixedCosts}
            unit="/mo"
            onChange={onFixedCosts}
          />
        </div>

        {/* Les trois réponses aux trois questions : ce que l'abonnement fait au
            total, ce que le supplément rapporte, ce qu'il reste à la fin. */}
        <dl className="grid content-start gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/60 pb-2">
            <dt className="text-sm text-muted-foreground">{t('Full subscription')}</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums">
              {formatPrice(fromMonthly(arpu, period))}
              <span className="text-sm font-normal text-muted-foreground">{t(unit)}</span>
              {period !== 'monthly' && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({formatPrice(arpu)}
                  {t('/mo')})
                </span>
              )}
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/60 pb-2">
            <dt className="text-sm text-muted-foreground">{t('The add-on brings in')}</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums text-lume">
              {formatCurrency(addOnRevenue)}
              <span className="text-sm font-normal text-muted-foreground">{t('/mo')}</span>
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <dt className="text-sm text-muted-foreground">{t('What you actually keep')}</dt>
            <dd
              className={`font-mono text-2xl font-semibold tabular-nums ${
                sdeMonthly >= 0 ? 'text-lume' : 'text-destructive'
              }`}
            >
              {formatCurrency(sdeMonthly)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {Math.round(netMargin * 100)}% {t('net margin')}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* La barre : le revenu, découpé en ce qu'il devient. */}
      <div className="space-y-2">
        <div
          className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-secondary"
          role="img"
          aria-label={t(
            '{mrr} of revenue: {serve} serving, {acquire} acquiring, {fixed} fixed, {profit} kept.',
            {
              mrr: formatCurrency(mrr),
              serve: formatCurrency(variableCost),
              acquire: formatCurrency(acquisitionCost),
              fixed: formatCurrency(fixedCosts),
              profit: formatCurrency(sdeMonthly),
            },
          )}
        >
          {parts.map((part) => (
            <span
              key={part.key}
              className={`h-full ${part.tone} ${
                part.key === 'profit' ? 'shadow-[0_0_12px_-2px_var(--lume)]' : ''
              }`}
              style={{ width: `${span > 0 ? (Math.abs(part.value) / span) * 100 : 0}%` }}
            />
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          {parts.map((part) => (
            <li key={part.key} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${part.tone}`} aria-hidden />
              {t(part.label)}
              <span className="font-mono tabular-nums text-foreground/70">
                {formatCurrency(part.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
