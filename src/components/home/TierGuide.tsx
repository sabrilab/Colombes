import { lazy, Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { PRICING_ANIMALS } from '@/lib/pricePad'

const AnimalStage3D = lazy(() => import('./AnimalStage3D'))

/**
 * La nomenclature : les cinq paliers de Janz côte à côte, avec ce que
 * chacun impose vraiment. Les modèles ne se chargent qu'à l'ouverture.
 */
export function TierGuide() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Tiers
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display uppercase tracking-[0.16em]">
            The five tiers
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Christoph Janz's framework: a SaaS is defined by what one customer pays you per
            year. Each tier is one order of magnitude — and demands a completely different
            company.
          </p>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-10">
          {PRICING_ANIMALS.map((animal) => (
            <article key={animal.name} className="border-t border-border/60 pt-4">
              <div className="flex items-start gap-3">
                <div className="h-24 w-28 shrink-0">
                  {open && (
                    <Suspense fallback={null}>
                      <AnimalStage3D animal={animal.name} />
                    </Suspense>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
                    {animal.name}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    ~${animal.annualAcv.toLocaleString('en-US')}/yr per customer ·{' '}
                    {animal.customersFor100M} customers for $100M ARR
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {animal.whatItMeans}
              </p>
            </article>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
