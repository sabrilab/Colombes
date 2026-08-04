import { Slider } from '@/components/ui/slider'
import { formatCurrency, formatPercent } from '@/lib/format'
import { INPUT_BOUNDS } from '@/lib/inputBounds'
import type { SimulatorResults } from '@/lib/engine/types'
import { useT } from '@/store/simulator'

/**
 * Ce qui reste, et de quoi on peut le tâter.
 *
 * Le mini-simulateur montrait un revenu et une valorisation, et posait la marge
 * en hypothèse muette au bas du panneau — « marge 85 %, coûts fixes 2 900 €/mois »
 * dans une ligne grise que personne ne lit. Or c'est là que se joue la question
 * qu'on se pose vraiment : je facture 14 500 €, mais qu'est-ce que je garde ?
 *
 * Deux réglages seulement, parce que ce sont les deux dépenses qu'un fondateur
 * reconnaît sans traduction :
 *
 *  — **ce que coûte le service** : l'hébergement, l'API qu'on revend, le support.
 *    Ça monte avec le nombre de clients, donc ça s'exprime en part du revenu.
 *    C'est l'inverse de la marge brute du moteur ;
 *  — **l'équipe et les outils** : ce qu'on paie chaque mois quoi qu'il arrive.
 *    Un montant, pas une part — un freelance à 2 000 € coûte 2 000 € qu'on ait
 *    dix clients ou mille.
 *
 * L'acquisition apparaît dans la barre sans curseur : elle est déduite du coût
 * d'acquisition et du rythme d'entrée, tous deux calculés par `quickSim`. La
 * montrer sans la rendre réglable est le seul choix honnête — elle mange une
 * part réelle du revenu, et prétendre l'inverse ferait un profit imaginaire.
 *
 * Aucun chiffre n'est recalculé ici : les quatre parts viennent de `compute()`,
 * qui est le moteur de production. Une somme qui ne retombe pas sur le revenu
 * refuse de s'afficher plutôt que de mentir joliment.
 */

/** La part maximale du revenu qu'on peut donner au service : la borne du moteur. */
const MAX_COST_TO_SERVE = 1 - INPUT_BOUNDS.grossMargin.min

/**
 * Plafond du curseur des coûts fixes. Le moteur accepte cent mille euros par
 * mois ; sur ce panneau, la course entière serait alors illisible pour les
 * quelques milliers d'euros où tout se joue.
 */
const FIXED_CEILING = 20_000

export function MarginPanel({
  results,
  costToServe,
  fixedCosts,
  onCostToServe,
  onFixedCosts,
}: {
  results: SimulatorResults
  /** Part du revenu absorbée par le service, de 0,01 à 0,5. */
  costToServe: number
  fixedCosts: number
  onCostToServe: (value: number) => void
  onFixedCosts: (value: number) => void
}) {
  const t = useT()
  const { mrr, variableCost, acquisitionCost, sdeMonthly, netMargin } = results.revenue

  /*
   * Les quatre parts, dans l'ordre où l'argent s'en va. Le bénéfice peut être
   * négatif — on dépense alors plus qu'on n'encaisse — et la barre le montre
   * en rouge plutôt que de replier le segment à zéro : une entreprise qui perd
   * de l'argent ne doit pas ressembler à une entreprise qui gagne peu.
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

  // Les parts se lisent sur le revenu, sauf en perte : la barre représente
  // alors ce qui sort, qui dépasse ce qui entre.
  const span = Math.max(mrr, parts.reduce((total, part) => total + Math.abs(part.value), 0))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t('What you actually keep')}
        </p>
        <p className="flex items-baseline gap-3">
          <span
            className={`font-mono text-2xl font-semibold tabular-nums lg:text-3xl ${
              sdeMonthly >= 0 ? 'text-lume' : 'text-destructive'
            }`}
          >
            {formatCurrency(sdeMonthly)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('/mo')} · {formatPercent(netMargin, 0)} {t('net margin')}
          </span>
        </p>
      </div>

      {/* La barre : le revenu, découpé en ce qu'il devient. */}
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
            className={`h-full ${part.tone} ${part.key === 'profit' ? 'shadow-[0_0_12px_-2px_var(--lume)]' : ''}`}
            style={{ width: `${span > 0 ? (Math.abs(part.value) / span) * 100 : 0}%` }}
          />
        ))}
      </div>

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm">{t('Cost to serve them')}</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {formatPercent(costToServe, 0)} · {formatCurrency(variableCost)}
            </span>
          </div>
          <Slider
            value={[costToServe]}
            min={0.01}
            max={MAX_COST_TO_SERVE}
            step={0.01}
            onValueChange={([value]) => onCostToServe(value)}
            thumbLabel={t('Cost to serve them')}
            thumbValueText={`${formatPercent(costToServe, 0)} ${t('of revenue')}`}
          />
          <p className="text-[11px] text-muted-foreground">
            {t('Hosting, the APIs you resell, the support you answer.')}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm">{t('Team and tools')}</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {formatCurrency(fixedCosts)}
              {t('/mo')}
            </span>
          </div>
          <Slider
            value={[Math.min(fixedCosts, FIXED_CEILING)]}
            min={0}
            max={FIXED_CEILING}
            step={100}
            onValueChange={([value]) => onFixedCosts(value)}
            thumbLabel={t('Team and tools')}
            thumbValueText={`${formatCurrency(fixedCosts)} ${t('per month')}`}
          />
          <p className="text-[11px] text-muted-foreground">
            {t('What you pay every month whoever shows up: you, a freelance, the tools.')}
          </p>
        </div>
      </div>

      {/* La légende dit ce que la barre montre. Sans elle, quatre gris. */}
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
  )
}
