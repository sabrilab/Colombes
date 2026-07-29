import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
// Le rendu réutilise le Chromium déjà présent : rien à télécharger.
Config.setChromiumOpenGlRenderer('angle')

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
