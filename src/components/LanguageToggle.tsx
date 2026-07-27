import { useSimulator, useT } from '@/store/simulator'
import { LANGUAGES } from '@/lib/i18n'

/** Bascule FR/EN. Deux crans, pas de menu : le choix est binaire. */
export function LanguageToggle() {
  const language = useSimulator((state) => state.language)
  const setLanguage = useSimulator((state) => state.setLanguage)
  const t = useT()

  return (
    <div
      className="flex items-center rounded-full border border-border/70 p-0.5"
      role="group"
      aria-label={language === 'fr' ? t('Switch to English') : t('Switch to French')}
    >
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-pressed={language === code}
          /* Au doigt, deux crans de 11 px seraient intouchables : on garde la
             pastille compacte sur grand écran, jamais sous 32 px sur mobile. */
          className={`inline-flex min-h-8 min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider transition-colors sm:min-h-0 sm:min-w-0 ${
            language === code
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
