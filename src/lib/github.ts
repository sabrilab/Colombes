/**
 * Le dépôt d'une idée, et le peu qu'on peut en dire sans serveur.
 *
 * L'ambition est de faire lire le dépôt par un agent pour qu'il note l'idée.
 * Cette partie-là demande une infrastructure que Colombes n'a pas : un serveur
 * pour porter un jeton — un dépôt privé ne s'ouvre pas depuis un navigateur
 * anonyme — et un modèle pour lire le code. Ce fichier ne prétend donc pas la
 * faire. Il fait la moitié qui marche aujourd'hui, et qui n'est pas rien :
 *
 *  — il retient le dépôt sur l'idée, ce qui suffit déjà à ne plus chercher où
 *    vit le code de la troisième idée de la liste ;
 *  — il lit ce que l'API publique de GitHub donne sans authentification :
 *    depuis quand ça existe, quand ça a bougé pour la dernière fois, en quel
 *    langage, combien d'issues ouvertes. Ce sont des faits vérifiables, et ce
 *    sont exactement ceux qui disent si une idée est vivante ou en sommeil.
 *
 * Deux limites, écrites ici plutôt que découvertes à l'usage : les dépôts privés
 * répondent 404 à un appel anonyme, indiscernable d'un dépôt qui n'existe pas ;
 * et GitHub plafonne à soixante appels par heure et par adresse. Les deux se
 * traduisent par une absence de signal, jamais par un chiffre inventé.
 */

/** Un dépôt, sous la seule forme qu'on stocke : « owner/repo ». */
export type RepoSlug = string

/**
 * Extrait « owner/repo » de ce qu'on colle vraiment : une URL complète, une URL
 * avec `.git`, ou déjà la forme courte. Rend `null` sur tout le reste, ce qui
 * laisse l'écran dire « je ne reconnais pas » au lieu d'appeler dans le vide.
 */
export function parseRepo(input: string): RepoSlug | null {
  const cleaned = input.trim().replace(/\.git$/, '').replace(/\/+$/, '')
  if (!cleaned) return null

  const fromUrl = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+)/i)
  if (fromUrl) return `${fromUrl[1]}/${fromUrl[2]}`

  const short = cleaned.match(/^([\w.-]+)\/([\w.-]+)$/)
  return short ? `${short[1]}/${short[2]}` : null
}

export function repoUrl(slug: RepoSlug): string {
  return `https://github.com/${slug}`
}

export interface RepoSignals {
  slug: RepoSlug
  description: string | null
  language: string | null
  stars: number
  openIssues: number
  /** Âge du dépôt, en mois. */
  ageMonths: number
  /** Jours depuis la dernière poussée. C'est le signal qui compte le plus. */
  daysSincePush: number
  isArchived: boolean
}

const MS_PER_DAY = 86_400_000

/**
 * Interroge l'API publique de GitHub. Rend `null` sur tout échec — dépôt privé,
 * inexistant, quota dépassé, réseau coupé. L'appelant affiche alors le lien seul,
 * ce qui reste utile, plutôt qu'un message d'erreur qui n'apprend rien.
 */
export async function fetchRepoSignals(
  slug: RepoSlug,
  signal?: AbortSignal,
): Promise<RepoSignals | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${slug}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal,
    })
    if (!response.ok) return null

    const data: unknown = await response.json()
    if (typeof data !== 'object' || data === null) return null
    const repo = data as Record<string, unknown>

    const created = Date.parse(String(repo.created_at ?? ''))
    const pushed = Date.parse(String(repo.pushed_at ?? ''))
    if (!Number.isFinite(created) || !Number.isFinite(pushed)) return null

    const now = Date.now()
    return {
      slug,
      description: typeof repo.description === 'string' ? repo.description : null,
      language: typeof repo.language === 'string' ? repo.language : null,
      stars: Number(repo.stargazers_count) || 0,
      openIssues: Number(repo.open_issues_count) || 0,
      ageMonths: Math.max(0, Math.round((now - created) / MS_PER_DAY / 30.44)),
      daysSincePush: Math.max(0, Math.round((now - pushed) / MS_PER_DAY)),
      isArchived: repo.archived === true,
    }
  } catch {
    return null
  }
}

/**
 * L'état d'une idée, lu sur la seule chose qui ne se raconte pas : la date du
 * dernier commit. Trois seuils, et ils sont assumés — un mois pour « en cours »,
 * un trimestre pour « au ralenti ». Ce n'est pas une note de l'idée, seulement
 * un constat sur le dépôt, et l'écran le dit ainsi.
 */
export function activityOf(signals: RepoSignals): 'active' | 'slowing' | 'dormant' {
  if (signals.isArchived) return 'dormant'
  if (signals.daysSincePush <= 30) return 'active'
  return signals.daysSincePush <= 90 ? 'slowing' : 'dormant'
}
