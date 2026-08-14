/**
 * Vérifie au doigt ce qu'aucune capture ne peut dire.
 *
 * Toucher un œuf ouvre-t-il sa fiche ? Le glisser le déplace-t-il **sans**
 * l'ouvrir ? Ces deux questions ont une réponse différente à la souris et au
 * doigt, et c'est le doigt qui a raison : la première version du nid s'ouvrait
 * parfaitement au clic et ne s'ouvrait jamais au toucher, parce qu'un doigt
 * bouge toujours d'un pixel ou deux et que ce pixel comptait comme un
 * glissement. Le défaut a vécu jusqu'à ce qu'on l'essaie sur un téléphone.
 *
 *     pnpm build && CHROME=/chemin/vers/chrome node scripts/tap-nest.mjs
 *
 * On pilote Chromium par CDP — Node a un WebSocket natif, donc aucune
 * dépendance — avec un vrai téléphone émulé et de vrais événements tactiles.
 * Sort en échec si l'un des deux gestes ne fait pas ce qu'il doit.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { SEED_KEY, SEED_STATE } from './seed-state.mjs'

const PORT = 8907
const DEBUG = 9337
const ROOT = 'dist'
const chrome = process.env.CHROME ?? process.env.REMOTION_BROWSER

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.json': 'application/json',
}

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname)
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  const target = existsSync(file) && statSync(file).isFile() ? file : join(ROOT, 'index.html')
  response.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' })
  response.end(readFileSync(target))
})

if (!chrome || !existsSync(chrome)) {
  throw new Error('Aucun Chromium : passer CHROME=/chemin/vers/chrome.')
}
if (!existsSync(join(ROOT, 'index.html'))) {
  throw new Error('dist/ est vide : lancer `pnpm build` d’abord.')
}

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve))

const browser = spawn(
  chrome,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    /*
     * La feuille de style Google Fonts est bloquée dans cet environnement, et
     * un script de module attend les feuilles qui le précèdent : sans ce
     * court-circuit, l'application ne monte tout simplement pas.
     */
    `--host-resolver-rules=MAP fonts.googleapis.com 127.0.0.1:${PORT}, MAP fonts.gstatic.com 127.0.0.1:${PORT}`,
    `--remote-debugging-port=${DEBUG}`,
    `--user-data-dir=${join(tmpdir(), 'colombes-tap')}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function socketUrl() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const list = await fetch(`http://127.0.0.1:${DEBUG}/json/list`).then((r) => r.json())
      const page = list.find((entry) => entry.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {
      /* le navigateur n'écoute pas encore */
    }
    await wait(250)
  }
  throw new Error('Chromium n’a jamais ouvert son port de débogage.')
}

const socket = new WebSocket(await socketUrl())
await new Promise((resolve) => socket.addEventListener('open', resolve))

let id = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  const slot = pending.get(message.id)
  if (slot) {
    pending.delete(message.id)
    slot(message.result)
  }
})
const send = (method, params = {}) => {
  const next = ++id
  socket.send(JSON.stringify({ id: next, method, params }))
  return new Promise((resolve) => pending.set(next, resolve))
}
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))?.result
    ?.value

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
})
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

/*
 * On charge l'app, on écrit son stockage depuis SA page, et on recharge. Une
 * page d'amorce qui redirige paraissait plus simple et coûte une soirée : le
 * contexte d'évaluation reste sur l'ancien document, tout semble vide, et on
 * corrige une mise en page qui n'avait rien.
 */
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/#/nid` })
await wait(3000)
await evaluate(`localStorage.setItem(${JSON.stringify(SEED_KEY)}, ${JSON.stringify(SEED_STATE)})`)
await send('Page.reload')

for (let attempt = 0; attempt < 40; attempt++) {
  await wait(500)
  if (await evaluate('document.querySelectorAll("button").length > 0')) break
}

const NODE = '[role="button"][aria-label="Boucle"]'
const placeOf = () => evaluate(`document.querySelector('${NODE}')?.getAttribute('transform') ?? null`)
const sheetOpen = () =>
  evaluate('Boolean(document.querySelector(\'[data-slot="sheet-content"]\'))')
const centreOf = async () =>
  JSON.parse(
    await evaluate(`(() => {
      // Le centre du disque, pas celui de la boîte du groupe : la boîte inclut
      // l'étiquette sous l'œuf, et son centre tombe dans le vide entre les deux.
      const node = document.querySelector('${NODE}')
      const r = node.querySelector('circle').getBoundingClientRect()
      return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    })()`),
  )

/*
 * On attend que le nid se pose avant de viser : tant que la simulation tourne,
 * le nœud mesuré n'est plus là un instant plus tard, et c'est le test qui rate
 * sa cible. Que cette attente finisse vérifie au passage que la boucle
 * d'animation s'endort bien.
 */
let place = null
for (let attempt = 0; attempt < 30; attempt++) {
  const now = await placeOf()
  if (now && now === place) break
  place = now
  await wait(400)
}
if (!place) throw new Error('Le nid ne s’est pas affiché : aucun nœud « Boucle ».')

const failures = []

// ── Un contact : posé, à peine bougé — comme un pouce — puis relâché.
const target = await centreOf()
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [target] })
await wait(40)
await send('Input.dispatchTouchEvent', {
  type: 'touchMove',
  touchPoints: [{ x: target.x + 2, y: target.y + 1 }],
})
await wait(40)
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await wait(900)

if (await sheetOpen()) {
  console.log('✓ un contact ouvre la fiche')
} else {
  failures.push('un contact sur un œuf n’ouvre pas sa fiche')
}

const reachable = await evaluate(`(() => {
  const sheet = document.querySelector('[data-slot="sheet-content"]')
  if (!sheet) return false
  const button = [...sheet.querySelectorAll('button')].find((b) => /simulateur/i.test(b.textContent))
  if (!button) return false
  const r = button.getBoundingClientRect()
  return r.top >= 0 && r.bottom <= window.innerHeight
})()`)
if (reachable) {
  console.log('✓ l’action principale tient dans l’écran, sans défiler')
} else {
  failures.push('l’action principale de la fiche n’est pas visible sans défiler')
}

// ── Un glissement : le nœud suit le doigt, et rien ne s'ouvre.
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27 })
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 })
await wait(700)

const before = await placeOf()
const grab = await centreOf()
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [grab] })
for (let stepIndex = 1; stepIndex <= 6; stepIndex++) {
  await send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: grab.x - stepIndex * 12, y: grab.y - stepIndex * 6 }],
  })
  await wait(30)
}
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await wait(600)

if ((await placeOf()) !== before) {
  console.log('✓ un glissement déplace le nœud')
} else {
  failures.push('un glissement ne déplace pas le nœud')
}
if (await sheetOpen()) {
  failures.push('un glissement ouvre la fiche — il ne devrait pas')
} else {
  console.log('✓ un glissement n’ouvre pas la fiche')
}

socket.close()
browser.kill()
server.close()

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`)
  process.exit(1)
}
