import { Card } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LANDMARKS, landmarkAcv, landmarkTier, type Landmark } from '@/lib/landmarks'

const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const compactCount = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function LandmarkCard({ company }: { company: Landmark }) {
  const acv = landmarkAcv(company)
  const tier = landmarkTier(company)

  return (
    <Card className="h-full gap-0 overflow-hidden p-0">
      <div className="card-band flex items-center gap-3 border-b border-border/50 p-4">
        {/* Lettrine plutôt que logo : on cite la marque, on ne la redistribue pas. */}
        <span
          aria-hidden
          className="font-display flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold"
          style={{ background: company.color, color: '#0d0f0c' }}
        >
          {company.initial}
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold leading-tight">{company.name}</p>
          <p className="truncate text-xs text-muted-foreground">{company.sector}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Per customer / year
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {acv >= 1000 ? compactUsd.format(acv) : `$${acv.toFixed(0)}`}
            </p>
          </div>
          <span className="font-display rounded-full border border-lume/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-lume">
            {tier.name}
          </span>
        </div>

        <dl className="flex gap-5 border-t border-border/60 pt-2.5 text-xs">
          <div>
            <dt className="text-[11px] text-muted-foreground">Revenue</dt>
            <dd className="font-mono tabular-nums">{compactUsd.format(company.annualRevenue)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Customers</dt>
            <dd className="font-mono tabular-nums">{compactCount.format(company.customers)}</dd>
          </div>
        </dl>

        <p className="text-xs leading-relaxed text-muted-foreground">{company.lesson}</p>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-[11px] text-muted-foreground/70 underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Where these numbers come from
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-1.5" collisionPadding={12}>
            <PopoverTitle>
              {company.name} · {company.period}
            </PopoverTitle>
            <PopoverDescription className="text-sm leading-relaxed">
              {company.basis}
            </PopoverDescription>
            <p className="text-xs text-muted-foreground/80">
              Order-of-magnitude estimate from public reporting, not a company-supplied figure.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  )
}

/**
 * Les repères : des entreprises connues situées sur l'échelle de Janz.
 * Aucune n'est valorisée par le moteur — son barème s'arrête bien avant
 * ces ordres de grandeur, et prétendre le contraire serait inventer.
 */
export function Landmarks() {
  return (
    <section className="mt-12 lg:mt-16" aria-label="Companies you know">
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Companies you know
      </h2>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
        Where the giants sit on the same scale. These are approximate figures from public
        reports — revenue and customer counts, nothing more. They are deliberately{' '}
        <strong className="font-medium text-foreground">not valued</strong> by the simulator:
        its market curve is built for bootstrapped SaaS, and stretching it to billions would
        invent a number.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LANDMARKS.map((company) => (
          <LandmarkCard key={company.id} company={company} />
        ))}
      </div>
    </section>
  )
}
