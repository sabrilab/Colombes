/**
 * Photographie l'application, à plusieurs largeurs, avec des données dedans.
 *
 * `shoot-ui.mjs` sert le film : quatre vues qui n'ont besoin de rien. Celui-ci
 * sert la relecture du travail — vérifier à quoi ressemble vraiment un écran,
 * au téléphone comme au bureau. D'où la seule chose qu'il fait en plus : une
 * page d'amorce, servie sur la même origine, qui écrit le stockage local puis
 * redirige. Sans elle, le nid est vide et une capture d'écran vide ne prouve
 * rien.
 *
 *     pnpm build && CHROME=/chemin/vers/chrome node scripts/shoot-app.mjs [dossier]
 *
 * Les idées d'exemple sont inventées et ne servent qu'ici. Elles couvrent les
 * trois états — un œuf nu, un œuf documenté, une éclose, une abandonnée — parce
 * qu'une capture ne vaut que si elle montre les cas qu'on risque de casser.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { SEED_KEY, SEED_STATE } from './seed-state.mjs'

const PORT = 8899
const ROOT = 'dist'
const OUT = process.argv[2] ?? 'video/assets/screens'
const chrome = process.env.CHROME ?? process.env.REMOTION_BROWSER

/**
 * L'amorce, servie sur la même origine : elle écrit le stockage puis se
 * remplace par l'application. `?vide` l'efface au lieu de l'écrire, pour
 * photographier ce que voit un premier passage.
 */
const seedPage = (fill) => `<!doctype html><meta charset="utf-8"><script>
localStorage.${
  fill
    ? `setItem(${JSON.stringify(SEED_KEY)}, ${JSON.stringify(SEED_STATE)})`
    : `removeItem(${JSON.stringify(SEED_KEY)})`
}
location.replace(location.hash ? '/' + location.hash : '/')
</script>`

/**
 * Les écrans, et la largeur qui compte pour chacun.
 *
 * 500 px et pas 390 : la fenêtre de Chromium sans tête a une largeur minimale
 * autour de cinq cents pixels. En demandant moins, on obtient une image de 390
 * de large découpée dans une page mise en page pour 500 — tout déborde, et le
 * défaut est dans l'appareil photo, pas dans la page. La leçon a été apprise
 * deux fois ; elle est écrite ici pour ne pas l'être une troisième.
 */
const VIEWS = [
  { name: 'nest-phone', hash: '#/', width: 500, height: 900 },
  { name: 'nest-desk', hash: '#/', width: 1500, height: 1000 },
  // Le nid vide : l'accueil d'un premier passage, le seul écran qui explique.
  { name: 'onboarding-phone', hash: '#/', width: 500, height: 900, seed: false },
  { name: 'onboarding-desk', hash: '#/', width: 1500, height: 1000, seed: false },
  { name: 'ballpark-phone', hash: '#/simuler', width: 500, height: 900 },
  { name: 'learn-phone', hash: '#/comprendre', width: 500, height: 900 },
  { name: 'simulator-phone', hash: '#/simulateur', width: 500, height: 900 },
]

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
}

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname)
  if (path === '/seed.html') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(seedPage(!new URL(request.url, 'http://x').searchParams.has('vide')))
    return
  }
  // `normalize` d'abord, sinon un `..` dans l'adresse sortirait de `dist/`.
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  const target = existsSync(file) && statSync(file).isFile() ? file : join(ROOT, 'index.html')
  response.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' })
  response.end(readFileSync(target))
})

if (!chrome || !existsSync(chrome)) {
  throw new Error('Aucun Chromium : passer CHROME=/chemin/vers/chrome (le complet, pas le headless shell).')
}
if (!existsSync(join(ROOT, 'index.html'))) {
  throw new Error('dist/ est vide : lancer `pnpm build` d’abord.')
}
mkdirSync(OUT, { recursive: true })

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve))

/**
 * `execFileSync` semblait plus simple et ne peut pas marcher ici : il fige la
 * boucle d'événements, donc le serveur qui vit dans ce processus ne répond plus
 * pendant que le navigateur charge la page.
 */
function shoot(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Chromium a rendu ${code}.`))))
  })
}

for (const view of VIEWS) {
  await shoot([
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    /*
     * Mouvement réduit, et ce n'est pas un confort d'accessibilité ici.
     *
     * Les animations d'entrée sont jouées par le compositeur, en temps réel ;
     * le temps virtuel, lui, défile d'un coup. Une page qui n'a rien d'autre à
     * faire est donc photographiée **pendant** son apparition — titre à moitié
     * transparent, cartes invisibles — et on croit à un défaut de mise en page
     * qui n'existe pas. En mouvement réduit tout est en place dès la première
     * image, et c'est de toute façon un état que l'application doit savoir
     * rendre.
     */
    '--force-prefers-reduced-motion',
    // Un profil neuf par vue : Chromium verrouille le profil par défaut, et
    // deux lancements qui se suivent se le disputent sans jamais rien écrire.
    `--user-data-dir=${join(tmpdir(), `colombes-app-${view.name}`)}`,
    `--window-size=${view.width},${view.height}`,
    '--virtual-time-budget=9000',
    `--screenshot=${join(OUT, `${view.name}.png`)}`,
    `http://127.0.0.1:${PORT}/seed.html${view.seed === false ? '?vide' : ''}${view.hash}`,
  ])

  const { size } = statSync(join(OUT, `${view.name}.png`))
  console.log(`${OUT}/${view.name}.png  ${view.width}×${view.height}  ${(size / 1024).toFixed(0)} Ko`)
}

server.close()
