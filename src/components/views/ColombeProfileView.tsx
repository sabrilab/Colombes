import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KpiTiles } from '@/components/results/KpiGrid'
import { colombeById } from '@/lib/aviary'
import { compute } from '@/lib/engine'
import { formatCurrency, formatMultiple } from '@/lib/format'
import { navigate } from '@/lib/router'
import { useSimulator } from '@/store/simulator'

const PROFILE_WORDS = {
  micro: 'Micro asset',
  bootstrapped: 'Bootstrapped SaaS',
  established: 'Established SaaS',
} as const

export function ColombeProfileView({ id }: { id: string }) {
  const colombe = colombeById(id)
  const loadInputs = useSimulator((state) => state.loadInputs)
  const results = useMemo(() => (colombe ? compute(colombe.inputs) : null), [colombe])

  if (!colombe || !results) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-6">
          <p className="text-lg">This dove has flown away.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('#/')}>
            Back to the aviary
          </Button>
        </main>
      </>
    )
  }

  const { valuation } = results
  const accent = `oklch(0.82 0.09 ${colombe.hue})`
  // Les trois facteurs qui pèsent le plus, en points de multiple.
  const topLines = [...valuation.lines]
    .sort((a, b) => Math.abs(b.deltaMultiple) - Math.abs(a.deltaMultiple))
    .slice(0, 3)

  const openInSimulator = () => {
    loadInputs(colombe.inputs)
    navigate('#/simulateur')
  }

  return (
    <>
      <AppHeader
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate('#/simulateur')}>
            Full simulator
          </Button>
        }
      />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 lg:px-6">
        <button
          type="button"
          onClick={() => navigate('#/')}
          className="reveal flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          style={{ '--reveal-order': 0 } as React.CSSProperties}
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          The aviary
        </button>

        <div className="reveal space-y-1.5" style={{ '--reveal-order': 1 } as React.CSSProperties}>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
              {colombe.name}
            </h1>
            <Badge variant="secondary">{colombe.sector}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{colombe.pitch}</p>
        </div>

        <Card
          className="reveal relative gap-3 overflow-hidden p-5"
          style={{ '--reveal-order': 2 } as React.CSSProperties}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-[-4rem] h-64 w-64 rounded-full opacity-15 blur-3xl"
            style={{ background: accent }}
          />
          <p className="text-sm text-muted-foreground">Estimated valuation</p>
          <p className="metal-number font-mono text-4xl font-semibold tabular-nums lg:text-5xl">
            {formatCurrency(valuation.value)}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{formatMultiple(valuation.multiple)} EBITDA</Badge>
            <span className="text-muted-foreground">
              {formatCurrency(valuation.low)} — {formatCurrency(valuation.high)}
            </span>
            <Badge variant="secondary">{PROFILE_WORDS[valuation.profileLabel]}</Badge>
          </div>
        </Card>

        <div className="reveal" style={{ '--reveal-order': 3 } as React.CSSProperties}>
          <KpiTiles inputs={colombe.inputs} />
        </div>

        <Card className="reveal gap-3 p-5" style={{ '--reveal-order': 4 } as React.CSSProperties}>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
            Why it's worth that
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {colombe.lesson}
          </p>
          <dl className="space-y-1.5 border-t border-border/60 pt-3">
            {topLines.map((line) => (
              <div key={line.key} className="flex items-baseline justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{line.label}</dt>
                <dd
                  className={`font-mono tabular-nums ${
                    line.deltaMultiple > 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : line.deltaMultiple < 0
                        ? 'text-red-600 dark:text-red-500'
                        : 'text-muted-foreground'
                  }`}
                >
                  {formatMultiple(line.deltaMultiple, true)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            The three factors that weigh most on its multiple, in points.
          </p>
        </Card>

        <div
          className="reveal flex flex-wrap gap-2 pb-6"
          style={{ '--reveal-order': 5 } as React.CSSProperties}
        >
          <Button className="lume-pill rounded-full px-5" onClick={openInSimulator}>
            Open in the simulator
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => navigate('#/')}>
            See another dove
          </Button>
        </div>
      </main>
    </>
  )
}
