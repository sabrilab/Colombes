import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useT } from '@/store/simulator'

/** Course du cadran : 270°, de −135° à +135°, zéro en haut. */
const SWEEP = 270
const HALF = SWEEP / 2

/**
 * Le clic d'un cran, synthétisé — aucun fichier à charger, aucune requête.
 * Une impulsion très courte passée dans un filtre passe-bande : c'est le
 * timbre sec d'un mécanisme, pas un bip d'interface.
 *
 * Le contexte audio n'existe qu'après le premier geste, comme l'exigent les
 * navigateurs, et reste partagé entre tous les cadrans de la page.
 */
let shared: AudioContext | null = null

function clickSound() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    shared ??= new Ctor()
    const ctx = shared
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    const noise = ctx.createBufferSource()
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    // Bruit décroissant très raide : l'attaque fait tout, la queue ne doit pas traîner.
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 12
    }
    noise.buffer = buffer

    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2_400
    band.Q.value = 6

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)

    noise.connect(band).connect(gain).connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.04)
  } catch {
    // Pas de son disponible : le cadran fonctionne, c'est tout ce qui compte.
  }
}

interface DialProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}

/**
 * Un cadran cranté, à la molette de coffre. On le tourne au doigt, il claque à
 * chaque cran, et il reste pilotable aux flèches et par deux boutons — une
 * commande qui n'existerait qu'en rotation serait fermée à trop de monde.
 */
export function Dial({ label, value, min, max, step, format, onChange }: DialProps) {
  const faceRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [silent, setSilent] = useState(false)
  const t = useT()

  // Le son est un renfort du geste : si l'on demande moins d'animation, on
  // considère qu'on demande aussi moins de bruit.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    setSilent(query.matches)
    const onChangeQuery = (event: MediaQueryListEvent) => setSilent(event.matches)
    query.addEventListener('change', onChangeQuery)
    return () => query.removeEventListener('change', onChangeQuery)
  }, [])

  const fraction = (value - min) / (max - min)
  const angle = -HALF + fraction * SWEEP

  /**
   * On compare à la valeur reçue, jamais à un souvenir interne : un préréglage
   * qui change la valeur depuis l'extérieur désynchroniserait un repère local,
   * et le premier cran d'après passerait à la trappe.
   *
   * L'arrondi repasse par le nombre de décimales du pas, sinon 0,03 devient
   * 0,030000000000000002 et le cran suivant se compare à un fantôme.
   */
  const commit = useCallback(
    (next: number) => {
      const decimals = (String(step).split('.')[1] ?? '').length
      const snapped = Number((Math.round(next / step) * step).toFixed(decimals))
      const clamped = Math.min(max, Math.max(min, snapped))

      // On ne claque qu'au franchissement d'un cran, jamais en continu.
      if (clamped === value) return
      if (!silent) clickSound()
      navigator.vibrate?.(8)
      onChange(clamped)
    },
    [max, min, onChange, silent, step, value],
  )

  const applyFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const face = faceRef.current
      if (!face) return
      const rect = face.getBoundingClientRect()
      const dx = clientX - (rect.left + rect.width / 2)
      const dy = clientY - (rect.top + rect.height / 2)

      // Angle depuis le haut, positif dans le sens horaire.
      const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI
      if (Math.abs(degrees) > HALF) return // dans l'angle mort, sous le cadran

      commit(min + ((degrees + HALF) / SWEEP) * (max - min))
    },
    [commit, max, min],
  )

  const nudge = (direction: 1 | -1) => commit(value + direction * step)

  const control =
    'inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={faceRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onKeyDown={(event) => {
          const map: Record<string, 1 | -1> = {
            ArrowRight: 1,
            ArrowUp: 1,
            ArrowLeft: -1,
            ArrowDown: -1,
          }
          const direction = map[event.key]
          if (!direction) return
          event.preventDefault()
          nudge(direction)
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId)
          draggingRef.current = true
          applyFromEvent(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) applyFromEvent(event.clientX, event.clientY)
        }}
        onPointerUp={() => {
          draggingRef.current = false
        }}
        onPointerCancel={() => {
          draggingRef.current = false
        }}
        className="dial-face relative size-28 touch-none select-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lume/60"
      >
        {/* Les crans gravés sur le pourtour. */}
        {Array.from({ length: 19 }, (_, index) => {
          const tick = -HALF + (index / 18) * SWEEP
          const lit = tick <= angle

          return (
            <span
              key={index}
              aria-hidden
              className={`absolute left-1/2 top-1.5 h-2 w-px origin-[50%_46px] ${
                lit ? 'bg-lume/70' : 'bg-foreground/20'
              }`}
              style={{ transform: `translateX(-50%) rotate(${tick}deg)` }}
            />
          )
        })}

        {/* La molette : le seul élément qui tourne. */}
        <div
          aria-hidden
          className="absolute inset-3 rounded-full transition-transform duration-100 motion-reduce:transition-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute left-1/2 top-2 h-4 w-1 -translate-x-1/2 rounded-full bg-lume shadow-[0_0_8px_var(--lume)]" />
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-base font-semibold tabular-nums">{format(value)}</span>
        </div>
      </div>

      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>

      {/* Sans ces deux boutons, le cadran serait fermé à qui ne peut pas tourner. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label={t('Decrease {label}', { label })}
          className={control}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label={t('Increase {label}', { label })}
          className={control}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
