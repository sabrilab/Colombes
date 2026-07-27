import { lazy, Suspense } from 'react'
import type { PricingAnimal } from '@/lib/pricePad'

/** three.js et les modèles ne partent qu'à l'affichage : l'entrée du site
    reste légère, et chaque espèce n'est téléchargée qu'une fois atteinte. */
const AnimalStage3D = lazy(() => import('./AnimalStage3D'))

export function AnimalStage({ animal }: { animal: PricingAnimal }) {
  return (
    <div>
      {/* Pas de cadre : l'animal pose à même la carte, en grand. */}
      <div className="h-44 w-full sm:h-52">
        <Suspense fallback={null}>
          <AnimalStage3D animal={animal.name} />
        </Suspense>
      </div>

      <div className="-mt-2 flex flex-wrap items-baseline gap-x-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-lume">
          {animal.name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          ~${animal.annualAcv.toLocaleString('en-US')}/yr per customer ·{' '}
          {animal.customersFor100M} for $100M ARR
        </p>
      </div>
    </div>
  )
}
