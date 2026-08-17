import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { avatarFromFile, FACES, isImageAvatar } from '@/lib/avatar'
import { useT } from '@/store/simulator'

/**
 * Choisir le visage d'une idée : un rang qu'on pousse du doigt.
 *
 * Douze emoji avant le choix d'une image, parce que choisir une image suppose
 * d'en avoir une sous la main — et au moment où l'on pose l'idée, on n'en a
 * pas. L'import reste au bout du rang pour ceux qui ont déjà un logo.
 *
 * Le même rang sert à la création et à la fiche : changer d'avis sur un visage
 * arrive plus souvent que le choisir, et deux composants voisins auraient fini
 * par diverger.
 */
export function FacePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (avatar: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const t = useT()

  async function pick(file: File | undefined) {
    if (!file) return
    const next = await avatarFromFile(file)
    // Un fichier illisible garde le visage précédent : on ne remplace pas
    // quelque chose par rien à cause d'un format qu'on n'a pas su lire.
    if (next) onChange(next)
  }

  return (
    <div className="no-bar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {isImageAvatar(value) && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('Remove the picture')}
          className="relative size-11 shrink-0 overflow-hidden rounded-full border border-lume ring-2 ring-lume/40"
        >
          <img src={value} alt="" className="size-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <X className="size-4" aria-hidden />
          </span>
        </button>
      )}

      {FACES.map((face) => (
        <button
          key={face}
          type="button"
          onClick={() => onChange(value === face ? '' : face)}
          aria-pressed={value === face}
          aria-label={face}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border text-lg transition-colors ${
            value === face ? 'border-lume bg-lume/15' : 'border-border/70 hover:border-foreground/30'
          }`}
        >
          <span aria-hidden>{face}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        aria-label={t('Use an image')}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:text-foreground"
      >
        <ImagePlus className="size-4" aria-hidden />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void pick(event.target.files?.[0])
          // Vidé aussitôt : sinon rechoisir le même fichier n'émet plus rien.
          event.target.value = ''
        }}
      />
    </div>
  )
}
