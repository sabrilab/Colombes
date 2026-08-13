import { useEffect, useMemo, useRef } from 'react'
import { EggGlyph } from '@/components/nest/EggGlyph'
import { DEFAULT_FORCES, seedPositions, step, type GraphLink, type GraphNode } from '@/lib/forceGraph'
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

export function NestGraph({
  ideas,
  selected,
  onSelect,
}: {
  ideas: NestIdea[]
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const holderRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef(new Map<string, SVGGElement>())
  const edgesRef = useRef(new Map<string, SVGLineElement>())
  const nodesRef = useRef<GraphNode[]>([])
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null)
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

    ideas.forEach((idea, index) => {
      built.push({
        id: idea.sim.id,
        x: seeds[index].x,
        y: seeds[index].y,
        vx: 0,
        vy: 0,
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
        built.push({
          id,
          x: seeds[index].x + Math.cos(angle) * 46,
          y: seeds[index].y + Math.sin(angle) * 46,
          vx: 0,
          vy: 0,
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
      paint()
      return
    }

    const tick = () => {
      step(nodesRef.current, links, DEFAULT_FORCES)
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
    dragRef.current = { id, moved: false }
    wake()
  }

  function pointerMove(event: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const holder = holderRef.current
    const node = nodesRef.current.find((entry) => entry.id === drag.id)
    if (!holder || !node) return

    const box = holder.getBoundingClientRect()
    node.x = event.clientX - box.left - box.width / 2
    node.y = event.clientY - box.top - box.height / 2
    drag.moved = true
  }

  function pointerUp(id: string) {
    const drag = dragRef.current
    dragRef.current = null
    const node = nodesRef.current.find((entry) => entry.id === id)
    if (node) node.held = false
    // Un contact sans déplacement est un choix, pas un glissement.
    if (drag && !drag.moved) onSelect(selected === id ? null : id)
  }

  return (
    <div
      ref={holderRef}
      className="relative min-h-[26rem] flex-1 touch-none overflow-hidden rounded-2xl border border-border/60 bg-card/30"
      onPointerMove={pointerMove}
    >
      <svg
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
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(event) => pointerDown(event, id)}
              onPointerUp={() => pointerUp(id)}
            >
              <circle
                r={RADIUS.idea + (on ? 9 : 5)}
                fill="none"
                stroke={on ? 'var(--lume)' : 'oklch(1 0 0 / 0.12)'}
                strokeWidth={on ? 1.5 : 1}
              />
              <circle r={RADIUS.idea} fill="oklch(0.16 0.006 110)" />
              <foreignObject x={-15} y={-15} width="30" height="30" pointerEvents="none">
                <EggGlyph
                  status={idea.status}
                  readiness={idea.readiness}
                  animal={idea.animal}
                  className={`size-full ${
                    idea.status === 'abandoned' ? 'text-muted-foreground' : 'text-lume'
                  }`}
                />
              </foreignObject>
              <text
                y={RADIUS.idea + 20}
                textAnchor="middle"
                className="pointer-events-none fill-foreground font-display text-[11px] font-semibold"
              >
                {idea.sim.name}
              </text>
            </g>
          )
        })}

        {/* Les satellites passent après les idées : ils ne doivent jamais
            recouvrir ce qu'on vient toucher. */}
        {nodes
          .filter((node) => node.radius === RADIUS.note)
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
