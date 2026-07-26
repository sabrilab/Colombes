import * as React from 'react'
import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  /** Nom accessible du curseur. Radix ne le porte que sur le Thumb. */
  thumbLabel?: string
  /** Valeur lue par les lecteurs d'écran, formatée. */
  thumbValueText?: string
}

function Slider({ className, thumbLabel, thumbValueText, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        aria-valuetext={thumbValueText}
        className="block size-4 shrink-0 rounded-full border border-primary/50 bg-background shadow-sm transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
