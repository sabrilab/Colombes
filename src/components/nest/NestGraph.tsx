import { useEffect, useMemo, useRef } from 'react'
import { IdeaFace } from '@/components/nest/IdeaFace'
import {
  DEFAULT_FORCES,
  clampToFrame,
  seedPositions,
  step,
  type Frame,
  type GraphLink,
  type GraphNode,
} from '@/lib/forceGraph'
import { isTap } from '@/lib/gesture'
import type { NestIdea } from '@/lib/nestView'
import { useT } from '@/store/simulator'

/**
 * Le nid, en constellation.
 *
 * Les idées flottent, se repoussent, et se rapprochent de ce à quoi elles sont
 * liées. On tire un nœud au doigt, les autres suivent, puis l'ensemble se
 * repose. La physique elle-même vit dans `lib/forceGraph.ts`, où elle se teste ;
 * ce fichier ne fait que la brancher sur des pixels et sur un doigt.
 *
 * Deux partis pris d'exécution valent d'être dits :
 *
 *  — **React ne rend qu'une fois.** Les positions sont écrites directement dans
 *    le `transform` des groupes SVG, par référence, dans la boucle d'animation.
 *    Passer par l'état ferait rendre l'arbre soixante fois par seconde pour
 *    déplacer des cercles, ce qui rame dès la vingtième idée ;
 *  — **la boucle s'arrête quand le nid se pose.** Une animation qui tourne pour
 *    l'éternité chauffe une batterie sans rien changer à l'image. Elle repart au
 *    moindre contact, et le test d'énergie de `forceGraph` garantit qu'elle
 *    finit bien par s'endormir.
 */

const RADIUS = { idea: 26, note: 6 }
/** En dessous, on considère le nid posé et on rend la main au navigateur. */
const SLEEP = 0.02

/**
 * Le cadre du dessin, et les marges qui gardent chaque œuf entier. En bas il en
 * faut plus : c'est là que tombe le nom.
 */
const FRAME: Frame = { halfWidth: 360, halfHeight: 230, top: 40, bottom: 64, side: 46 }

/**
 * Le creux du nid, au centre.
 *
 * Ce n'est pas un bouton posé sur un dessin : c'est un nœud de la simulation,
 * tenu au centre, dont les idées s'écartent comme elles s'écartent les unes des
 * autres. La constellation s'organise donc autour de lui — ce qui est
 * exactement ce qu'on veut dire, un nid a ses œufs autour de son creux.
 */
const CENTRE = 'nest:new'
const CENTRE_RADIUS = 34

export function NestGraph({
  ideas,
  selected,
  onSelect,
  onCreate,
}: {
  ideas: NestIdea[]
  selected: string | null
  onSelect: (id: string | null) => void
  /** Poser un œuf, depuis le creux du nid. */
  onCreate: () => void
}) {
  const holderRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef(new Map<string, SVGGElement>())
  const edgesRef = useRef(new Map<string, SVGLineElement>())
  const nodesRef = useRef<GraphNode[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ id: string; from: { x: number; y: number } } | null>(null)
  /** Un glissement est en cours, ou vient de finir : le clic qui suit n'est pas un choix. */
  const movedRef = useRef(false)
  const t = useT()

  /**
   * Les nœuds et les liens. Chaque idée porte ses notes en satellites : la ligne
   * de contexte et le dépôt en sont, ce qui donne au graphe sa densité — une
   * idée documentée a visiblement plus de matière autour d'elle.
   */
  const { nodes, links } = useMemo(() => {
    const built: GraphNode[] = []
    const edges: GraphLink[] = []
    const seeds = seedPositions(ideas.length, 110)
    /*
     * Ce que le nid était juste avant.
     *
     * La liste des idées change plus souvent qu'on ne croit — les signaux des
     * dépôts arrivent après coup, un tri se change, un client se compte. Sans
     * cette reprise, la constellation repartait de ses positions de semis à
     * chaque fois : les œufs sautaient à l'écran sans raison visible, et un
     * doigt posé sur l'un d'eux le perdait en route.
     */
    const before = new Map(nodesRef.current.map((node) => [node.id, node]))
    const keep = (id: string, fallback: { x: number; y: number }) =>
      before.get(id) ?? { ...fallback, vx: 0, vy: 0 }

    // Le creux : tenu, donc immobile, mais bien présent dans la répulsion —
    // c'est lui qui écarte les œufs du centre.
    built.push({ id: CENTRE, x: 0, y: 0, vx: 0, vy: 0, radius: CENTRE_RADIUS, held: true })

    ideas.forEach((idea, index) => {
      const home = keep(idea.sim.id, seeds[index])
      built.push({
        id: idea.sim.id,
        x: home.x,
        y: home.y,
        vx: home.vx ?? 0,
        vy: home.vy ?? 0,
        radius: RADIUS.idea,
      })

      const satellites = [
        idea.sim.note ? 'note' : null,
        idea.sim.repo ? 'repo' : null,
        (idea.sim.journal?.length ?? 0) > 2 ? 'log' : null,
      ].filter((kind): kind is string => kind !== null)

      satellites.forEach((kind, order) => {
        const id = `${idea.sim.id}:${kind}`
        const angle = order * 2.1 + index
        const spot = keep(id, {
          x: home.x + Math.cos(angle) * 46,
          y: home.y + Math.sin(angle) * 46,
        })
        built.push({
          id,
          x: spot.x,
          y: spot.y,
          vx: spot.vx ?? 0,
          vy: spot.vy ?? 0,
          radius: RADIUS.note,
        })
        edges.push({ a: idea.sim.id, b: id, rest: 52 })
      })
    })

    return { nodes: built, links: edges }
  }, [ideas])

  nodesRef.current = nodes

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let idle = 0

    const paint = () => {
      for (const node of nodesRef.current) {
        const group = groupsRef.current.get(node.id)
        if (group) group.setAttribute('transform', `translate(${node.x} ${node.y})`)
      }
      for (const link of links) {
        const line = edgesRef.current.get(`${link.a}|${link.b}`)
        const a = nodesRef.current.find((node) => node.id === link.a)
        const b = nodesRef.current.find((node) => node.id === link.b)
        if (!line || !a || !b) continue
        line.setAttribute('x1', String(a.x))
        line.setAttribute('y1', String(a.y))
        line.setAttribute('x2', String(b.x))
        line.setAttribute('y2', String(b.y))
      }
    }

    if (reduced) {
      // Mouvement réduit : on résout d'un coup et on peint la position finale.
      for (let i = 0; i < 400; i++) step(nodesRef.current, links, DEFAULT_FORCES)
      clampToFrame(nodesRef.current, FRAME)
      paint()
      return
    }

    const tick = () => {
      step(nodesRef.current, links, DEFAULT_FORCES)
      clampToFrame(nodesRef.current, FRAME)
      paint()

      const moving = nodesRef.current.some(
        (node) => Math.abs(node.vx) + Math.abs(node.vy) > SLEEP || node.held,
      )
      // Quelques images de marge avant de s'endormir : un système qui frôle le
      // seuil se rendormirait en pleine glissade.
      idle = moving ? 0 : idle + 1
      if (idle < 30) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [links, nodes])

  /** Réveille la boucle après un contact — elle s'est peut-être endormie. */
  function wake() {
    const node = nodesRef.current[0]
    if (node) node.vx += 0.001
    const event = new Event('nest:wake')
    window.dispatchEvent(event)
  }

  function pointerDown(event: React.PointerEvent, id: string) {
    const node = nodesRef.current.find((entry) => entry.id === id)
    if (!node) return
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    node.held = true
    movedRef.current = false
    dragRef.current = { id, from: { x: event.clientX, y: event.clientY } }
    wake()
  }

  function pointerMove(event: React.PointerEvent) {
    const drag = dragRef.current
    const node = drag && nodesRef.current.find((entry) => entry.id === drag.id)
    if (!drag || !node) return

    // Tant que le doigt tremble sur place, il désigne ; il ne tire pas.
    // Voir `lib/gesture.ts` — sans ce seuil, rien ne s'ouvrait au téléphone.
    if (!movedRef.current && isTap(drag.from, { x: event.clientX, y: event.clientY })) return
    movedRef.current = true

    /*
     * Du pixel d'écran à l'unité du dessin. La matrice du SVG fait la
     * conversion exactement : la vue est mise à l'échelle et centrée dans son
     * cadre, si bien qu'un calcul à la main sur la boîte du conteneur se
     * trompe des deux — du facteur et du décalage. Le nœud partait alors bien
     * plus loin que le doigt.
     */
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()?.inverse()
    if (!svg || !matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix)
    node.x = point.x
    node.y = point.y
  }

  function release(id: string) {
    dragRef.current = null
    const node = nodesRef.current.find((entry) => entry.id === id)
    if (node) node.held = false
  }

  /*
   * La sélection tient au clic, pas au relâchement du pointeur.
   *
   * Le navigateur émet le clic lui-même après un contact, ce qui donne le même
   * geste à la souris, au doigt, au clavier et aux technologies d'assistance,
   * sans rien tenir en mémoire entre deux événements. La première version
   * comptait sur un objet mémorisé au contact et relu au relâchement ; quand le
   * nid se reconstruisait entre les deux — un signal de dépôt qui arrive —
   * l'objet avait disparu et le contact ne faisait rien, une fois sur deux.
   * Ici, le pire des cas ouvre la fiche, ce qui est précisément ce qu'on
   * voulait.
   */
  function click(id: string) {
    if (movedRef.current) return
    onSelect(selected === id ? null : id)
  }

  return (
    <div
      ref={holderRef}
      className="relative min-h-[19rem] flex-1 touch-none overflow-hidden rounded-2xl border border-border/60 bg-card/30 lg:min-h-[26rem]"
      onPointerMove={pointerMove}
    >
      <svg
        ref={svgRef}
        viewBox="-360 -230 720 460"
        className="absolute inset-0 size-full"
        role="img"
        aria-label={t('{count} ideas in the nest', { count: ideas.length })}
      >
        <g>
          {links.map((link) => (
            <line
              key={`${link.a}|${link.b}`}
              ref={(element) => {
                if (element) edgesRef.current.set(`${link.a}|${link.b}`, element)
              }}
              stroke="oklch(1 0 0 / 0.13)"
              strokeWidth="1"
            />
          ))}
        </g>

        {ideas.map((idea) => {
          const id = idea.sim.id
          const on = selected === id
          return (
            <g
              key={id}
              ref={(element) => {
                if (element) groupsRef.current.set(id, element)
              }}
              role="button"
              tabIndex={0}
              aria-label={idea.sim.name}
              aria-pressed={on}
              className="cursor-grab outline-none active:cursor-grabbing"
              onPointerDown={(event) => pointerDown(event, id)}
              onPointerUp={() => release(id)}
              onPointerCancel={() => release(id)}
              onClick={() => click(id)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onSelect(selected === id ? null : id)
              }}
            >
              {/* La cible, plus large que le dessin. Un œuf fait cinquante-deux
                  pixels de diamètre ; le doigt en demande quarante-quatre au
                  minimum, et il vise le centre d'une chose, pas son contour. */}
              <circle r={RADIUS.idea + 12} fill="transparent" />
              <circle
                r={RADIUS.idea + (on ? 9 : 5)}
                fill="none"
                stroke={on ? 'var(--lume)' : 'oklch(1 0 0 / 0.12)'}
                strokeWidth={on ? 1.5 : 1}
              />
              <circle r={RADIUS.idea} fill="oklch(0.16 0.006 110)" />
              <foreignObject x={-16} y={-16} width="32" height="32" pointerEvents="none">
                <IdeaFace
                  avatar={idea.sim.avatar}
                  status={idea.status}
                  readiness={idea.readiness}
                  animal={idea.animal}
                  name={idea.sim.name}
                  className="size-8 text-[1.6rem]"
                />
              </foreignObject>
              <text
                y={RADIUS.idea + 20}
                textAnchor="middle"
                /* Le nom fait partie du nœud : le toucher le sélectionne. Il
                   était inerte, ce qui donnait une cible de la taille de l'œuf
                   avec un mot juste en dessous qui ne répondait pas. */
                className="select-none fill-foreground font-display text-[11px] font-semibold"
              >
                {idea.sim.name}
              </text>
            </g>
          )
        })}

        {/* Le creux du nid. Il ne bouge pas, donc il n'a besoin d'aucune des
            mécaniques de glissement : un bouton, et rien d'autre. */}
        <g
          role="button"
          tabIndex={0}
          aria-label={t('Lay a new egg')}
          className="cursor-pointer outline-none"
          onClick={onCreate}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            onCreate()
          }}
        >
          <circle r={CENTRE_RADIUS} fill="transparent" />
          <circle
            r={CENTRE_RADIUS - 8}
            fill="oklch(0.16 0.006 110)"
            stroke="var(--lume)"
            strokeOpacity="0.5"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <path
            d="M-8 0h16M0 -8v16"
            stroke="var(--lume)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <text
            y={CENTRE_RADIUS + 12}
            textAnchor="middle"
            className="pointer-events-none fill-lume/70 font-mono text-[9px] uppercase tracking-[0.12em]"
          >
            {t('new egg')}
          </text>
        </g>

        {/* Les satellites passent après les idées : ils ne doivent jamais
            recouvrir ce qu'on vient toucher. */}
        {nodes
          .filter((node) => node.id !== CENTRE && node.radius === RADIUS.note)
          .map((node) => (
            <g
              key={node.id}
              ref={(element) => {
                if (element) groupsRef.current.set(node.id, element)
              }}
            >
              <circle r={RADIUS.note} fill="oklch(0.68 0 0 / 0.55)" />
            </g>
          ))}
      </svg>

      <p className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] text-muted-foreground">
        {t('drag a node · tap to open')}
      </p>
    </div>
  )
}
