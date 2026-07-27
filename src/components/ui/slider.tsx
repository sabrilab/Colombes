import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  /** Nom accessible du curseur. Radix ne le porte que sur le Thumb. */
  thumbLabel?: string
  /** Valeur lue par les lecteurs d'écran, formatée. */
  thumbValueText?: string
}

/** Barre d'instrument : piste creusée, remplissage « lume » qui irradie
    doucement, poignée pleine. Le niveau se lit de loin, comme une jauge. */
function Slider({ className, thumbLabel, thumbValueText, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      /* La rangée est la zone de saisie : 1 px de marge suffisait à la souris,
         il en faut dix fois plus pour qu'un doigt attrape la poignée. */
      className={cn(
        'relative flex w-full touch-none select-none items-center py-2.5 sm:py-1',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-lume shadow-[0_0_10px_-2px_var(--lume)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        aria-valuetext={thumbValueText}
        /* 16 px se visent à la souris, pas au doigt : la poignée passe à 24 px
           sous le point de rupture, et retrouve sa finesse au-delà. */
        className="block size-6 shrink-0 rounded-full border-2 border-background bg-foreground shadow-md transition-[transform,box-shadow] hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lume/40 disabled:pointer-events-none disabled:opacity-50 sm:size-4"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
