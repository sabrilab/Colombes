import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TierBadge } from '@/components/AnimalGlyph'
import { FacePicker } from '@/components/nest/FacePicker'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { animalFor } from '@/lib/pricePad'
import { quickInputs } from '@/lib/quickSim'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSimulator, useT } from '@/store/simulator'

/**
 * Poser un œuf.
 *
 * C'est le premier geste de l'application, donc celui qui a le droit de
 * demander le moins : un visage, un nom, une ligne pour dire ce que c'est, un
 * prix et un nombre de clients. Deux de ces cinq champs sont facultatifs.
 *
 * Le prix et les clients ne sont pas là par gourmandise de formulaire : sans
 * eux il n'y a pas de simulation, donc pas de valorisation, donc pas d'animal —
 * et l'idée entrerait dans le nid sans rien à quoi se comparer. Ils arrivent
 * pré-remplis avec des valeurs plausibles, et le chiffre s'affiche **pendant
 * qu'on tape** : on voit ce que l'hypothèse vaut avant de la valider, ce qui
 * évite l'aller-retour « j'enregistre, j'ouvre, je découvre ».
 *
 * Rien ici n'est définitif — le prix se règle ensuite dans le simulateur, le
 * nom se change dans la fiche, l'image se remplace. Le formulaire d'entrée
 * d'une idée n'a pas à être un engagement, et le dire en toutes lettres coûte
 * une ligne.
 */

const DEFAULTS = { price: 29, customers: 200 }

export function NewEggSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** L'idée créée : le nid l'ouvre aussitôt, pour qu'on voie où elle a atterri. */
  onCreated: (id: string) => void
}) {
  const createIdea = useSimulator((state) => state.createIdea)
  const isMobile = useIsMobile()
  const t = useT()

  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [avatar, setAvatar] = useState('')
  const [price, setPrice] = useState(DEFAULTS.price)
  const [customers, setCustomers] = useState(DEFAULTS.customers)

  const results = useMemo(() => compute(quickInputs({ price, customers })), [price, customers])

  function reset() {
    setName('')
    setNote('')
    setAvatar('')
    setPrice(DEFAULTS.price)
    setCustomers(DEFAULTS.customers)
  }

  function lay() {
    const id = createIdea({ name, note, avatar, price, customers })
    if (!id) return
    reset()
    onOpenChange(false)
    onCreated(id)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        /* Pas de focus automatique : Radix le donnerait au premier champ, et la
           feuille arriverait avec le clavier du téléphone déjà ouvert, par-dessus
           tout le reste. */
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={
          isMobile
            ? 'flex h-[88svh] flex-col gap-0 rounded-t-3xl p-0 pb-[env(safe-area-inset-bottom)]'
            : 'flex w-full flex-col gap-0 p-0 sm:max-w-md'
        }
      >
        <SheetHeader className="border-b border-border/50 p-4">
          <SheetTitle className="font-display text-base uppercase tracking-tight">
            {t('A new egg')}
          </SheetTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('Nothing here is final — the price, the name and the picture all change later.')}
          </p>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <p className="text-xs font-medium">{t('Give it a face')}</p>
            <div className="mt-2">
              <FacePicker value={avatar} onChange={setAvatar} />
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium">{t('Name')}</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') lay()
              }}
              placeholder={t('Boucle, Rade, Pigeon…')}
              className="mt-1.5 h-11"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium">{t('In one line')}</span>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('What is it? Who pays for it?')}
              className="mt-1.5 h-11"
            />
          </label>

          {/* Deux chiffres, et leur conséquence juste en dessous. */}
          <div className="rounded-2xl border border-border/60 p-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium">{t('Price')}</span>
                <span className="mt-1.5 flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={price}
                    onChange={(event) => setPrice(Math.max(0, Number(event.target.value)))}
                    className="h-11 font-mono tabular-nums"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">{t('/mo')}</span>
                </span>
              </label>
              <label className="block">
                <span className="text-xs font-medium">{t('Customers')}</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={customers}
                  onChange={(event) =>
                    setCustomers(Math.max(0, Math.round(Number(event.target.value))))
                  }
                  className="mt-1.5 h-11 font-mono tabular-nums"
                />
              </label>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 border-t border-border/40 pt-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t('Estimated valuation')}
                </p>
                <p className="font-mono text-xl font-semibold tabular-nums" aria-live="polite">
                  {formatCompactCurrency(results.valuation.value)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('MRR')} {formatCurrency(results.revenue.mrr)}
                </p>
              </div>
              <TierBadge animal={animalFor(price).name} />
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 bg-background p-3">
          <Button className="lume-pill h-11 w-full" onClick={lay}>
            {t('Lay it in the nest')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
