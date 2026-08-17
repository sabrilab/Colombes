/**
 * Le visage d'une idée : un emoji, ou une image.
 *
 * Deux formes, une seule chaîne stockée, et c'est voulu — l'affichage n'a pas à
 * savoir laquelle il a reçue, il demande. Un emoji ne coûte rien ; une image
 * coûte, et c'est là que ce fichier gagne son existence.
 *
 * Les idées vivent dans le stockage local du navigateur, qui plafonne autour de
 * cinq mégaoctets pour **tout** le site. Une photo de téléphone en fait trois à
 * elle seule : deux suffiraient à faire échouer silencieusement chaque
 * enregistrement suivant — la perte de données la plus bête qui soit, celle
 * qu'on ne découvre qu'au rechargement. On réduit donc avant d'écrire : cent
 * vingt-huit pixels de côté, cadrés au centre, en JPEG. Environ six kilooctets
 * par idée, douze idées au plus : le budget tient dans un centième du plafond.
 */

/** Le côté de la vignette gardée, en pixels. Elle ne s'affiche jamais plus grand. */
const SIDE = 128
/** Au-delà, on refuse de lire : c'est une photo entière, pas un logo. */
const MAX_SOURCE_BYTES = 12 * 1024 * 1024

/**
 * Des visages tout prêts.
 *
 * Choisir une image suppose d'en avoir une sous la main ; ces douze-là ne
 * demandent qu'un doigt. Elles couvrent les familles d'idées qu'on pose
 * vraiment — un outil, un jeu, une boutique, un truc de musique — sans jamais
 * prétendre classer quoi que ce soit : c'est un visage, pas une catégorie.
 */
export const FACES = ['🥚', '🎧', '🎸', '📷', '🧭', '📚', '🛠️', '🧪', '🌱', '🛒', '💬', '⚡']

export function isImageAvatar(avatar: string | undefined): boolean {
  return Boolean(avatar?.startsWith('data:image/'))
}

/**
 * Réduit une image choisie en une vignette carrée, prête à stocker.
 *
 * Le cadrage prend le plus grand carré central plutôt que d'écraser l'image :
 * un logo déformé se remarque tout de suite, un logo rogné presque jamais.
 * Rend `null` si le fichier n'est pas une image lisible — l'appelant garde
 * alors le visage précédent, au lieu de le remplacer par rien.
 */
export async function avatarFromFile(file: File, side = SIDE): Promise<string | null> {
  if (!file.type.startsWith('image/') || file.size > MAX_SOURCE_BYTES) return null

  const url = URL.createObjectURL(file)
  try {
    const image = await load(url)
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const context = canvas.getContext('2d')
    if (!context) return null

    const crop = Math.min(image.width, image.height)
    context.drawImage(
      image,
      (image.width - crop) / 2,
      (image.height - crop) / 2,
      crop,
      crop,
      0,
      0,
      side,
      side,
    )
    // JPEG et non PNG : un logo plat en PNG pèse peu, une photo pèse dix fois
    // plus, et on ne sait pas laquelle des deux arrive.
    return canvas.toDataURL('image/jpeg', 0.82)
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image illisible'))
    image.src = url
  })
}
