import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SectionRoutes } from '@/components/SectionRoutes'
import type { Route } from '@/lib/router'

/**
 * Le contenu d'une section, et lui seul : la coque autour ne bouge pas.
 *
 * On échange le contenu au lieu de recharger la page. Un fondu court avec un
 * décalage de quelques pixels suffit — au-delà, le changement se met à
 * ressembler à une navigation, ce qu'on cherche justement à éviter.
 */
export function SectionView({ route }: { route: Route }) {
  const reduced = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={route.view}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionRoutes route={route} />
      </motion.div>
    </AnimatePresence>
  )
}
