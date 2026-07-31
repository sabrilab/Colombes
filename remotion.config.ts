import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
// Le rendu réutilise le Chromium déjà présent : rien à télécharger.
Config.setChromiumOpenGlRenderer('angle')

/*
 * Le navigateur de rendu, quand la machine en impose un.
 *
 * Remotion télécharge sinon son propre Chromium sans interface au premier rendu.
 * Sur une machine dont la sortie réseau est filtrée, ce téléchargement répond 403
 * et plus rien ne se rend — alors qu'un Chromium parfaitement utilisable est déjà
 * installé. On le désigne par une variable d'environnement plutôt qu'en dur :
 * le chemin dépend de la machine, et les scripts de `package.json` doivent rester
 * valables partout.
 *
 *     REMOTION_BROWSER=/chemin/vers/headless_shell pnpm video:render:heuristics
 */
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER)
}

/*
 * Le dossier public se passe en ligne de commande, `--public-dir=public` dans
 * les scripts de `package.json`, et non ici : `Config.setPublicDir()` reste sans
 * effet sur `remotion render`, vérifié.
 *
 * Il faut le désigner parce que Remotion le déduit sinon du dossier du point
 * d'entrée — `video/public`, qui n'existe pas. Le symptôme est trompeur : les
 * pistes audio continuent de marcher, puisqu'elles sont mixées côté serveur
 * depuis le disque, mais tout ce que le navigateur va chercher lui-même — un
 * modèle 3D en particulier — répond 404 dans la page sans faire échouer le
 * rendu, et donne un plan noir qu'on ne découvre qu'au montage final.
 */
