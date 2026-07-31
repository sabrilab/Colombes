/**
 * Photographie les vraies vues de l'app, pour le film de présentation.
 *
 * Le film 16/9 montre l'interface, pas une reconstitution : ces images sont ce
 * que le navigateur affiche à l'adresse indiquée, y compris les modèles 3D et
 * les chiffres que le moteur vient de calculer. Un plan qui redessinerait
 * l'écran à la main aurait deux défauts — il vieillirait sans qu'on le sache, et
 * il ne prouverait rien.
 *
 * Rien à installer : on sert `dist/` et on demande au Chromium déjà présent une
 * capture par vue. Pas de pilote de navigateur en dépendance pour six images.
 *
 *     pnpm build && node scripts/shoot-ui.mjs
 *
 * Le binaire se désigne par `REMOTION_BROWSER` — le même que pour le rendu — ou
 * par `CHROME`. Les images vont dans `video/assets/ui/`.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'

const PORT = 8899
const ROOT = 'dist'
const OUT = 'video/assets/ui'

/**
 * Les vues, avec la fenêtre qui leur va.
 *
 * La hauteur n'est pas la même partout parce que la capture se limite à la
 * fenêtre : une vue plus haute que 940 pixels perdrait son bas, et c'est
 * justement là que vivent les commandes qu'on veut montrer.
 */
/**
 * Le simulateur avec les trois prix relevés, encodé dans un lien de partage.
 *
 * Le film montre à un moment « bouge un levier, le chiffre bouge avec ». Le
 * montrer avec une seule capture obligerait à animer un faux chiffre par-dessus
 * une image fixe. Ici ce sont deux états réels de l'app, photographiés l'un
 * après l'autre : 9/29/79 € puis 19/59/149 €, tout le reste identique. La
 * valorisation qui s'affiche est celle que le moteur calcule, dans les deux cas.
 *
 * Le fragment est du base64url de `SimulatorInputs`, la forme que
 * `src/lib/urlState.ts` sait relire.
 */
const LIFTED =
  'eyJ0aWVycyI6W3sibmFtZSI6IlN0YXJ0ZXIiLCJwcmljZSI6MTksIm1peCI6MC40fSx7Im5hbWUiOiJQcm8iLCJwcmljZSI6NTks' +
  'Im1peCI6MC41fSx7Im5hbWUiOiJTY2FsZSIsInByaWNlIjoxNDksIm1peCI6MC4xfV0sImN1c3RvbWVycyI6NzYwLCJuZXdDdXN0' +
  'b21lcnNQZXJNb250aCI6NDUsImNhYyI6MTgwLCJyZXZlbnVlQ2h1cm4iOjAuMDIxLCJleHBhbnNpb24iOjAuMDA4LCJncm9zc01h' +
  'cmdpbiI6MC44NSwiZml4ZWRDb3N0cyI6MzUwMCwiZm91bmRlckRlcGVuZGVuY3kiOiJtZWRpdW0iLCJ0ZWNoVHJhbnNmZXJhYmls' +
  'aXR5IjoibWVkaXVtIiwidG9wQ2xpZW50U2hhcmUiOjAuMDgsImFnZU1vbnRocyI6MzAsImF1ZGllbmNlU2l6ZSI6MCwiYXVkaWVu' +
  'Y2VDb252ZXJzaW9uIjowLjAwMiwiYW5udWFsU2hhcmUiOjAsImFubnVhbERpc2NvdW50IjowLjE3LCJsdGRQZXJNb250aCI6MCwi' +
  'bHRkUHJpY2UiOjMwMCwiYmFzZU11bHRpcGxlT3ZlcnJpZGUiOm51bGx9'

const VIEWS = [
  { name: 'home', hash: '#/', width: 1500, height: 940 },
  { name: 'simulator', hash: '#/simulateur', width: 1500, height: 1180 },
  { name: 'simulator-lifted', hash: `#s=${LIFTED}`, width: 1500, height: 1180 },
  { name: 'learn', hash: '#/comprendre', width: 1500, height: 1000 },
]

/*
 * Trois vues ont été essayées et retirées, pour des raisons qui valent d'être
 * écrites — elles se re-tenteront sinon :
 *
 *  — la volière monte sa scène en volume à la visibilité, donc une capture fixe
 *    en rend le cadre vide. Elle affiche par ailleurs des marques de sociétés
 *    connues, qu'on ne met pas dans un film (voir `public/logos/README.md`) ;
 *  — un profil de colombe demande un identifiant réel ; sans lui la page répond
 *    « this dove has flown away », ce qui fait une belle capture d'erreur ;
 *  — `#/lab` est un banc d'essai interne, pas une surface de produit.
 */

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
  // `normalize` d'abord, sinon un `..` dans l'adresse sortirait de `dist/`.
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  const target = existsSync(file) && statSync(file).isFile() ? file : join(ROOT, 'index.html')

  response.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' })
  response.end(readFileSync(target))
})

const chrome = process.env.CHROME ?? process.env.REMOTION_BROWSER
if (!chrome || !existsSync(chrome)) {
  throw new Error('Aucun Chromium : passer CHROME=/chemin/vers/chrome (le complet, pas le headless shell).')
}
if (!existsSync(join(ROOT, 'index.html'))) {
  throw new Error('dist/ est vide : lancer `pnpm build` d’abord.')
}
mkdirSync(OUT, { recursive: true })

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve))

/**
 * Un lancement de Chromium, attendu sans bloquer.
 *
 * `execFileSync` semblait plus simple et ne peut pas marcher ici : il fige la
 * boucle d'événements, donc le serveur qui vit dans ce processus ne répond plus
 * pendant que le navigateur charge la page. Chromium attend une réponse qui
 * n'arrivera jamais, et la capture ne sort pas — sans erreur, sans message.
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
    // La volière et les profils affichent de vrais modèles : sans rendu
    // logiciel autorisé, la toile revient vide et l'animal manque.
    '--use-gl=angle',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    /*
     * Un profil neuf par vue. Chromium pose un verrou sur son profil par
     * défaut : deux lancements qui se suivent se le disputent, et le second
     * attend indéfiniment sans rien écrire — la capture ne sort jamais et
     * aucun message ne l'explique.
     */
    `--user-data-dir=${join(tmpdir(), `colombes-shot-${view.name}`)}`,
    // Deux fois la résolution : l'image sera vue en perspective, donc agrandie
    // par endroits, et une capture à un pour un s'y délave.
    '--force-device-scale-factor=2',
    `--window-size=${view.width},${view.height}`,
    // Le temps virtuel laisse les polices, les modèles et les ressorts se poser
    // sans attendre réellement neuf secondes.
    '--virtual-time-budget=9000',
    `--screenshot=${join(OUT, `${view.name}.png`)}`,
    `http://127.0.0.1:${PORT}/${view.hash}`,
  ])

  const { size } = statSync(join(OUT, `${view.name}.png`))
  console.log(`${OUT}/${view.name}.png  ${view.width}×${view.height} @2  ${(size / 1024).toFixed(0)} Ko`)
}

server.close()
