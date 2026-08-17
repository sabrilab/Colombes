import { AnimalGlyph } from '@/components/AnimalGlyph'
import { EggGlyph } from '@/components/nest/EggGlyph'
import { isImageAvatar } from '@/lib/avatar'
import type { IdeaStatus } from '@/lib/nest'

/**
 * Le visage d'une idée, partout pareil.
 *
 * Trois endroits le montrent — le nœud du graphe, la ligne du classement,
 * l'en-tête de la fiche — et ils doivent montrer la même chose, sinon on croit
 * regarder trois objets différents. D'où ce composant plutôt que trois rendus
 * voisins qui divergeront.
 *
 * Ce qui s'affiche répond à une question : qu'est-ce qui distingue le mieux
 * cette idée des onze autres ?
 *
 *  — **son image**, quand elle en a une. Un logo se reconnaît avant un mot ;
 *  — **son œuf** sinon, qui dit déjà quelque chose : ce qu'on sait d'elle le
 *    remplit, et il se fend quand il ne manque plus que le client qui paie ;
 *  — et dans les deux cas, **l'animal en pastille** une fois éclose. C'est le
 *    seul fait qu'on ne peut pas se raconter ; il ne disparaît pas derrière une
 *    photo de profil.
 */
export function IdeaFace({
  avatar,
  status,
  readiness,
  animal,
  name,
  className = 'size-8',
}: {
  avatar?: string
  status: IdeaStatus
  readiness: number
  animal: string | null
  name: string
  className?: string
}) {
  if (!avatar) {
    return (
      <span className={`relative inline-block shrink-0 ${className}`}>
        <EggGlyph
          status={status}
          readiness={readiness}
          animal={animal}
          className={`size-full ${status === 'abandoned' ? 'text-muted-foreground' : 'text-lume'}`}
        />
      </span>
    )
  }

  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <span
        className={`flex size-full items-center justify-center overflow-hidden rounded-full border border-border/70 bg-card ${
          status === 'abandoned' ? 'opacity-45 grayscale' : ''
        }`}
      >
        {isImageAvatar(avatar) ? (
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          // L'emoji occupe les trois quarts du disque : à taille pleine il
          // touche le bord et perd son cerclage.
          <span className="text-[0.75em] leading-none" aria-hidden>
            {avatar}
          </span>
        )}
      </span>

      {status === 'hatched' && animal && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex size-[45%] items-center justify-center rounded-full bg-background ring-1 ring-border"
          title={animal}
        >
          <AnimalGlyph animal={animal} className="size-[80%] text-lume" />
        </span>
      )}

      <span className="sr-only">{name}</span>
    </span>
  )
}
