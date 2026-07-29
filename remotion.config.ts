import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)
// Le rendu réutilise le Chromium déjà présent : rien à télécharger.
Config.setChromiumOpenGlRenderer('angle')
