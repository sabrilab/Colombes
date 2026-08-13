import { AnimalGlyph } from '@/components/AnimalGlyph'
import type { IdeaStatus } from '@/lib/nest'

/**
 * L'œuf, et ce qu'il devient.
 *
 * Un seul dessin porte les trois états, parce qu'ils sont trois moments d'une
 * même chose et non trois icônes :
 *
 *  — **l'œuf** se remplit par le bas à mesure qu'on sait, et se fend quand il ne
 *    manque plus que le client qui paie. La fêlure est donc l'avant-dernier
 *    poste, pas une décoration : elle annonce ce qui va arriver ;
 *  — **l'éclos** n'est plus un œuf du tout mais l'animal de son palier, celui
 *    que la volière connaît déjà ;
 *  — **l'abandonné** garde sa coquille, vide et sourde. On ne le supprime pas :
 *    une idée qu'on a arrêtée est une information, et la revoir grise vaut mieux
 *    que de la retrouver dans six mois en ayant oublié pourquoi.
 *
 * La forme est celle d'un vrai œuf — plus large en bas qu'en haut. Un cercle
 * aurait suffi à coder l'état, et n'aurait rien raconté.
 */

const EGG_PATH = 'M12 1.6c4.1 0 7.6 6 7.6 11.1 0 4.7-3.4 8.1-7.6 8.1s-7.6-3.4-7.6-8.1C4.4 7.6 7.9 1.6 12 1.6Z'

export function EggGlyph({
  status,
  readiness,
  animal,
  className = '',
}: {
  status: IdeaStatus
  /** De 0 à 1 : ce qu'on sait de l'idée. Voir `readinessOf`. */
  readiness: number
  /** Le palier, une fois éclose. */
  animal?: string | null
  className?: string
}) {
  if (status === 'hatched' && animal) {
    return <AnimalGlyph animal={animal} className={className} />
  }

  const abandoned = status === 'abandoned'
  // La fêlure n'apparaît qu'au dernier palier : quatre postes sur cinq, il ne
  // manque plus que quelqu'un qui paie.
  const cracking = !abandoned && readiness >= 0.8
  const fill = abandoned ? 0 : readiness

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <defs>
        {/* Le remplissage est un masque, pas une barre posée dessus : le niveau
            épouse la coquille au lieu de la traverser. */}
        <clipPath id={`egg-fill-${Math.round(fill * 100)}`}>
          <rect x="0" y={22 - fill * 21} width="24" height="24" />
        </clipPath>
      </defs>

      <path
        d={EGG_PATH}
        fill={abandoned ? 'currentColor' : 'oklch(1 0 0 / 0.05)'}
        fillOpacity={abandoned ? 0.07 : 1}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity={abandoned ? 0.45 : 0.75}
        strokeDasharray={abandoned ? '2 2' : undefined}
      />

      {fill > 0 && (
        <path
          d={EGG_PATH}
          fill="currentColor"
          fillOpacity="0.9"
          clipPath={`url(#egg-fill-${Math.round(fill * 100)})`}
        />
      )}

      {cracking && (
        <path
          d="M8.6 9.4l2.5 2.1-1.5 2.3 3 1.9"
          fill="none"
          stroke="oklch(0.125 0.006 110)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
