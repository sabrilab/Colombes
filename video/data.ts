import { formatCurrency } from '../src/lib/format'
import { LANDMARKS, landmarkAcv } from '../src/lib/landmarks'
import { PRICING_ANIMALS } from '../src/lib/pricePad'

/**
 * Les chiffres des repères, calculés et non recopiés.
 *
 * Écrire ces valeurs à la main est ce qui rend un film faux : Salesforce est à
 * dix-neuf mille euros par client et par mois, pas au millier qu'on imagine, et
 * c'est précisément ce que la démonstration doit faire voir. Les trois films les
 * lisent ici, donc ils ne peuvent pas se contredire entre eux.
 */

/**
 * Le prix mensuel par client d'un repère, calculé et non recopié.
 *
 * Écrire ces chiffres à la main est ce qui rend un film faux : Salesforce est à
 * dix-neuf mille euros par client et par mois, pas au millier qu'on imagine, et
 * c'est précisément ce que la démonstration doit faire voir.
 */
export function landmarkMonthly(id: string): string {
  const company = LANDMARKS.find((candidate) => candidate.id === id)
  if (!company) return ''
  return `${formatCurrency(Math.round(landmarkAcv(company) / 12))} / month`
}

/** La fourchette de prix d'un palier, pour les plans sans repère nommé. */
export function tierBand(name: string): string {
  const animal = PRICING_ANIMALS.find((candidate) => candidate.name === name)
  if (!animal) return ''
  return `${formatCurrency(animal.minPrice)} – ${formatCurrency(animal.maxPrice)} / month`
}
