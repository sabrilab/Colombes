import { TierBadge } from '@/components/AnimalGlyph'
import { CompanyLogo } from '@/components/CompanyLogo'
import { Card } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LANDMARKS, landmarkAcv, landmarkTier, type Landmark } from '@/lib/landmarks'
import { useT } from '@/store/simulator'

const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function LandmarkCard({ company }: { company: Landmark }) {
  const acv = landmarkAcv(company)
  const tier = landmarkTier(company)
  const t = useT()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="group h-full text-left">
          {/* Même anatomie que les cartes de la volière : bandeau d'identité,
              puis un seul chiffre au socle. */}
          <Card className="h-full gap-0 overflow-hidden p-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-foreground/25 group-focus-visible:border-foreground/40">
            <div className="card-band flex items-center gap-3 border-b border-border/50 p-4">
              <CompanyLogo company={company} className="size-10 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-tight">
                  {company.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t(company.sector)}</p>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t('Per customer / year')}
                </p>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {acv >= 1000 ? compactUsd.format(acv) : `$${acv.toFixed(0)}`}
                </p>
              </div>
              <TierBadge animal={tier.name} className="pb-1" />
            </div>
          </Card>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 space-y-2" collisionPadding={12}>
        <PopoverTitle>
          {company.name} · {company.period}
        </PopoverTitle>
        <PopoverDescription className="text-sm leading-relaxed">
          {t(company.lesson)}
        </PopoverDescription>
        <div className="space-y-1 border-t border-border/60 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground">
              {compactUsd.format(company.annualRevenue)}
            </span>{' '}
            {t('revenue')} ·{' '}
            <span className="text-foreground">
              {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(company.customers)}
            </span>{' '}
            {t('customers')}
          </p>
          <p className="text-xs text-muted-foreground/80">{t(company.basis)}</p>
          <p className="text-xs text-muted-foreground/60">
            {t('Order-of-magnitude estimate from public reporting, not a company-supplied figure.')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Les repères : des entreprises connues situées sur l'échelle de Janz.
 * Aucune n'est valorisée par le moteur — son barème s'arrête bien avant
 * ces ordres de grandeur, et prétendre le contraire serait inventer.
 */
export function Landmarks() {
  const t = useT()

  return (
    <section className="mt-12 lg:mt-16" aria-label={t('Companies you know')}>
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {t('Companies you know')}
      </h2>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
        {t(
          'Where the giants sit on the same scale. Approximate figures from public reports — revenue and customer counts, nothing more. They are deliberately {notValued} by the simulator: its market curve is built for bootstrapped SaaS, and stretching it to billions would invent a number. Tap a card for the detail.',
          { notValued: '\u0000' },
        )
          .split('\u0000')
          .flatMap((part, index) =>
            index === 0
              ? [part]
              : [
                  <strong key="nv" className="font-medium text-foreground">
                    {t('not valued')}
                  </strong>,
                  part,
                ],
          )}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LANDMARKS.map((company) => (
          <LandmarkCard key={company.id} company={company} />
        ))}
      </div>
    </section>
  )
}
