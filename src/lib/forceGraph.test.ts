import { describe, expect, it } from 'vitest'
import { DEFAULT_FORCES, energy, seedPositions, step, type GraphLink, type GraphNode } from './forceGraph'

function node(id: string, x: number, y: number, radius = 20): GraphNode {
  return { id, x, y, vx: 0, vy: 0, radius }
}

function settle(nodes: GraphNode[], links: GraphLink[], steps = 600) {
  for (let i = 0; i < steps; i++) step(nodes, links, DEFAULT_FORCES)
}

describe('forceGraph', () => {
  it('sépare deux nœuds qui se chevauchent', () => {
    const nodes = [node('a', 0, 0), node('b', 6, 0)]
    settle(nodes, [], 300)
    expect(Math.hypot(nodes[1].x - nodes[0].x, nodes[1].y - nodes[0].y)).toBeGreaterThan(30)
  })

  it('ne divise pas par zéro quand deux nœuds sont exactement superposés', () => {
    const nodes = [node('a', 0, 0), node('b', 0, 0)]
    settle(nodes, [], 120)
    for (const entry of nodes) {
      expect(Number.isFinite(entry.x)).toBe(true)
      expect(Number.isFinite(entry.y)).toBe(true)
    }
    expect(Math.hypot(nodes[1].x - nodes[0].x, nodes[1].y - nodes[0].y)).toBeGreaterThan(1)
  })

  it('rapproche deux nœuds liés de la longueur au repos', () => {
    const nodes = [node('a', -400, 0), node('b', 400, 0)]
    settle(nodes, [{ a: 'a', b: 'b', rest: 140 }])
    const distance = Math.hypot(nodes[1].x - nodes[0].x, nodes[1].y - nodes[0].y)
    // Le ressort tire, la répulsion pousse : l'équilibre est proche du repos,
    // pas exactement dessus, et c'est bien ce qu'on veut voir.
    expect(distance).toBeGreaterThan(90)
    expect(distance).toBeLessThan(220)
  })

  it('se pose : l’énergie décroît jusqu’à devenir négligeable', () => {
    const nodes = seedPositions(9).map((seed, index) => node(`n${index}`, seed.x, seed.y))
    const links: GraphLink[] = [
      { a: 'n0', b: 'n1', rest: 120 },
      { a: 'n0', b: 'n2', rest: 120 },
      { a: 'n1', b: 'n3', rest: 90 },
      { a: 'n4', b: 'n5', rest: 90 },
    ]
    step(nodes, links)
    const early = energy(nodes)
    settle(nodes, links, 1200)
    expect(energy(nodes)).toBeLessThan(early)
    expect(energy(nodes)).toBeLessThan(0.5)
  })

  it('ne déplace pas un nœud tenu, et laisse les autres réagir', () => {
    const held: GraphNode = { ...node('held', 200, 0), held: true }
    const free = node('free', 210, 0)
    const nodes = [held, free]
    settle(nodes, [], 200)
    expect(held.x).toBe(200)
    expect(held.y).toBe(0)
    expect(free.x).not.toBe(210)
  })

  it('répartit la graine sans superposer deux nœuds', () => {
    const seeds = seedPositions(40)
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        expect(Math.hypot(seeds[i].x - seeds[j].x, seeds[i].y - seeds[j].y)).toBeGreaterThan(1)
      }
    }
  })
})
