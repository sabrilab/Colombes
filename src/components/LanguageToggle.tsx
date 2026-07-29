import { useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSimulator, useT } from '@/store/simulator'
import { LANGUAGES, type Language } from '@/lib/i18n'

/** Le nom de chaque langue, dans cette langue : personne ne cherche
    « French » quand il veut du français. */
const NAMES: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
}

/**
 * Le choix de langue tient dans une icône. Les deux crans côte à côte
 * mangeaient une largeur que l'en-tête n'a pas sur un téléphone, et ils
 * affichaient en permanence une option qu'on ne change presque jamais.
 */
export function LanguageToggle() {
  const language = useSimulator((state) => state.language)
  const setLanguage = useSimulator((state) => state.setLanguage)
  const [open, setOpen] = useState(false)
  const t = useT()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('Language: {current}', { current: NAMES[language] })}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Languages className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-44 p-1">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => {
              setLanguage(code)
              setOpen(false)
            }}
            aria-current={code === language}
            className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 text-sm transition-colors hover:bg-accent ${
              code === language ? 'text-lume' : 'text-foreground'
            }`}
          >
            {NAMES[code]}
            {code === language && <Check className="size-4 shrink-0" aria-hidden />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
