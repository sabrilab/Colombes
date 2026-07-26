import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Interpole vers `target` en ease-out. Rend la cible directement si l'utilisateur limite les animations. */
export function useAnimatedNumber(target: number, duration = 300): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      fromRef.current = target
      setDisplay(target)
      return
    }

    const from = fromRef.current
    const start = performance.now()

    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      const current = from + (target - from) * eased
      setDisplay(current)
      fromRef.current = current
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return display
}
