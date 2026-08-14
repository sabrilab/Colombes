/**
 * Le nid en mouvement : ressorts, répulsion, amortissement.
 *
 * Le graphe se manipule au doigt — on tire un nœud, les autres suivent et
 * l'ensemble se replace. Trois forces suffisent à produire ça, et elles vivent
 * ici plutôt que dans le composant pour une raison simple : un pas de simulation
 * est une fonction de l'état, donc il se teste. Une physique écrite au milieu
 * d'une boucle d'animation ne se vérifie qu'à l'œil, et à l'œil on ne voit pas
 * qu'un système ne se stabilise jamais — on voit juste que « ça bouge encore ».
 *
 * Contrairement aux films, rien ici n'a besoin d'être déterministe image par
 * image : personne ne capture ce graphe deux fois. Le léger flottement est même
 * ce qu'on veut, c'est lui qui donne la sensation d'une matière vivante.
 */

export interface GraphNode {
  id: string
  x: number
  y: number
  /** Vitesse, en unités par pas. */
  vx: number
  vy: number
  /** Rayon : il pèse dans la répulsion, pour que deux gros ne se chevauchent pas. */
  radius: number
  /** Tenu par le doigt : il ne subit plus les forces, c'est lui qui les impose. */
  held?: boolean
}

export interface GraphLink {
  a: string
  b: string
  /** Longueur au repos du ressort. */
  rest: number
}

export interface ForceOptions {
  /** Force de rappel vers le centre. Sans elle, l'ensemble dérive hors du cadre. */
  gravity: number
  /** Intensité de la répulsion entre deux nœuds. */
  charge: number
  /** Raideur des ressorts. */
  stiffness: number
  /** Part de vitesse conservée à chaque pas. En dessous de 1, le système se pose. */
  damping: number
  centre: { x: number; y: number }
}

export const DEFAULT_FORCES: ForceOptions = {
  gravity: 0.0016,
  charge: 5200,
  stiffness: 0.012,
  damping: 0.86,
  centre: { x: 0, y: 0 },
}

/** Au-delà, la répulsion ne s'exerce plus : deux nœuds éloignés s'ignorent. */
const REACH = 420
/** Distance plancher : sans elle, deux nœuds superposés partiraient à l'infini. */
const FLOOR = 12

/**
 * Un pas de simulation. Mute les nœuds — c'est voulu : on en anime des dizaines
 * soixante fois par seconde, et recréer les objets à chaque image ferait travailler
 * le ramasse-miettes pour rien.
 */
export function step(
  nodes: GraphNode[],
  links: readonly GraphLink[],
  options: ForceOptions = DEFAULT_FORCES,
): void {
  const byId = new Map(nodes.map((node) => [node.id, node]))

  // ── Répulsion. Quadratique en nombre de nœuds, ce qui est sans conséquence
  // ici : un nid de cent idées ferait dix mille paires, soit rien du tout.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      let dx = b.x - a.x
      let dy = b.y - a.y
      let distance = Math.hypot(dx, dy)

      // Deux nœuds exactement superposés n'ont pas de direction : on en invente
      // une, stable, plutôt que de diviser par zéro.
      if (distance === 0) {
        dx = 0.5
        dy = 0.5
        distance = Math.hypot(dx, dy)
      }
      if (distance > REACH) continue

      const wall = a.radius + b.radius + FLOOR
      const effective = Math.max(distance, wall)
      const push = options.charge / (effective * effective)
      const ux = dx / distance
      const uy = dy / distance

      if (!a.held) {
        a.vx -= ux * push
        a.vy -= uy * push
      }
      if (!b.held) {
        b.vx += ux * push
        b.vy += uy * push
      }
    }
  }

  // ── Ressorts.
  for (const link of links) {
    const a = byId.get(link.a)
    const b = byId.get(link.b)
    if (!a || !b) continue

    const dx = b.x - a.x
    const dy = b.y - a.y
    const distance = Math.hypot(dx, dy) || 1
    const pull = (distance - link.rest) * options.stiffness
    const ux = dx / distance
    const uy = dy / distance

    if (!a.held) {
      a.vx += ux * pull
      a.vy += uy * pull
    }
    if (!b.held) {
      b.vx -= ux * pull
      b.vy -= uy * pull
    }
  }

  // ── Gravité, amortissement, déplacement.
  for (const node of nodes) {
    if (node.held) {
      // Un nœud tenu ne garde pas d'élan : sinon il file au lâcher.
      node.vx = 0
      node.vy = 0
      continue
    }
    node.vx += (options.centre.x - node.x) * options.gravity
    node.vy += (options.centre.y - node.y) * options.gravity
    node.vx *= options.damping
    node.vy *= options.damping
    node.x += node.vx
    node.y += node.vy
  }
}

/**
 * Le cadre visible, en unités du dessin, avec ses marges.
 *
 * Elles ne sont pas égales : un nœud porte son nom **sous** lui, si bien qu'il
 * touche le bas du cadre bien avant d'y arriver lui-même.
 */
export interface Frame {
  halfWidth: number
  halfHeight: number
  top: number
  bottom: number
  side: number
}

/**
 * Ramène les nœuds dans le cadre.
 *
 * La gravité les rappelle vers le centre mais ne garantit rien : à cinq idées
 * qui se repoussent, les deux plus excentrées sortaient par le haut et par la
 * droite, et un œuf coupé par le bord du cadre passe pour un défaut d'affichage.
 * On borne donc après coup — la physique reste libre, la fenêtre non.
 */
export function clampToFrame(nodes: GraphNode[], frame: Frame): void {
  for (const node of nodes) {
    node.x = Math.min(frame.halfWidth - frame.side, Math.max(-frame.halfWidth + frame.side, node.x))
    node.y = Math.min(frame.halfHeight - frame.bottom, Math.max(-frame.halfHeight + frame.top, node.y))
  }
}

/** L'énergie du système. Elle doit tendre vers zéro, sinon le nid ne se pose jamais. */
export function energy(nodes: readonly GraphNode[]): number {
  return nodes.reduce((total, node) => total + node.vx * node.vx + node.vy * node.vy, 0)
}

/**
 * Une disposition de départ en spirale, plutôt qu'au hasard.
 *
 * L'angle d'or répartit les nœuds sans jamais les aligner, ce qui évite la
 * situation où deux nœuds superposés démarrent avec une répulsion démesurée. Et
 * comme c'est déterministe, le nid a la même allure au rechargement — on
 * reconnaît sa constellation.
 */
export function seedPositions(count: number, spread = 90): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.39996
    const radius = spread * Math.sqrt(index + 0.5)
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })
}
