import { DoveLogo } from '@/components/DoveLogo'
import { PRICING_ANIMALS } from '@/lib/pricePad'
import { LANDMARKS } from '@/lib/landmarks'
import { useT } from '@/store/simulator'

/**
 * Le contenu explicatif de l'accueil, en grille irrégulière : ce que l'outil
 * calcule, d'où viennent ses barèmes, et surtout ce qu'il refuse de faire.
 *
 * Les chiffres affichés ne sont pas écrits à la main — ils comptent les données
 * réelles. Un texte qui annonce « cinq paliers » pendant que le moteur en tient
 * six est le genre de mensonge qu'on ne voit jamais venir.
 */

/** Une cellule du bento. `span` porte l'empan sur grand écran uniquement. */
function Cell({
  span = 'sm:col-span-6',
  tone = 'plain',
  children,
}: {
  span?: string
  tone?: 'plain' | 'lit'
  children: React.ReactNode
}) {
  return (
    <div
      className={`col-span-12 ${span} flex flex-col gap-2 rounded-xl border p-5 ${
        tone === 'lit'
          ? 'border-lume/25 bg-lume/[0.04]'
          : 'card-surface border-border/60'
      }`}
    >
      {children}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="metal-number font-mono text-4xl font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  )
}

export function ConceptBento() {
  const t = useT()

  return (
    <section className="mt-14 lg:mt-20" aria-labelledby="concept-title">
      <div className="max-w-2xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t('What this is')}
        </p>
        <h2
          id="concept-title"
          className="font-display mt-2 text-2xl font-bold uppercase tracking-tight sm:text-3xl"
        >
          {t('An estimate you can argue with')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(
            'Most valuation calculators hand you a number and keep the reasoning. Colombes does the opposite: every euro of the estimate is traceable back to a lever you moved, and every rule it applies is written down here rather than buried.',
          )}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-3">
        <Cell span="sm:col-span-7" tone="lit">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
            {t('What it computes')}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'A subscription business is valued on what it keeps, not on what it bills. Colombes takes your recurring revenue, subtracts direct costs, acquisition and fixed costs, and applies a market multiple to what remains — the same arithmetic a buyer runs, made visible step by step.',
            )}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'That multiple is not a constant. It starts from a curve calibrated on real transactions at your revenue level, then moves with the quality of the asset: how fast customers leave, how concentrated your revenue is, how much of the company walks out of the door with you.',
            )}
          </p>
        </Cell>

        <Cell span="sm:col-span-5">
          <Stat value={String(PRICING_ANIMALS.length)} label={t('pricing tiers')} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'From mice to whales, each tier is an order of magnitude of revenue per customer — and a different trade. At €2 a month nobody may ever talk to a human; at €2,000 someone must.',
            )}
          </p>
        </Cell>

        <Cell span="sm:col-span-4">
          <Stat value="9" label={t('lines in the multiple')} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'Churn, growth, NRR, Rule of 40, gross margin, client concentration, age, founder dependency, tech transferability. Each one is shown with its weight, in points of multiple.',
            )}
          </p>
        </Cell>

        <Cell span="sm:col-span-4">
          <Stat value={String(LANDMARKS.length)} label={t('real benchmarks')} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'Spotify, Netflix, Canva, Shopify, HubSpot and Salesforce, placed on the same scale as you from their published figures. They are never valued by the engine — only used to show what the scale means.',
            )}
          </p>
        </Cell>

        <Cell span="sm:col-span-4">
          <Stat value="1K–100K" label={t('the MRR range it is built for')} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'Below that, the multiple stops meaning much: you are selling a project, not an asset. Above it, the benchmarks this tool uses no longer apply and it would be inventing.',
            )}
          </p>
        </Cell>

        <Cell span="sm:col-span-7">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
            {t('Where the numbers come from')}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'The market curve is calibrated on public marketplace data — Acquire.com, FE International, ChartMogul — for businesses in the range above. Health thresholds follow the usual conventions: three times on LTV to CAC, twelve months to pay acquisition back, retention at or above a hundred percent.',
            )}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              'These are orders of magnitude, not quotes. A buyer with a strategic reason to want your app will pay more than any curve says; a tired seller will take less.',
            )}
          </p>
        </Cell>

        <Cell span="sm:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
              {t('What it will not do')}
            </h3>
            <DoveLogo className="w-6 shrink-0 text-lume/40" />
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              {t(
                'Replace a real buyer. No comparable transactions, no due diligence, no negotiation.',
              )}
            </li>
            <li>
              {t(
                'Price an enterprise business. Past a certain price per customer the tool says so instead of guessing.',
              )}
            </li>
            <li>
              {t(
                'Pretend to a precision it does not have. The range matters more than the midpoint, and both move the moment an assumption does.',
              )}
            </li>
          </ul>
        </Cell>
      </div>
    </section>
  )
}
