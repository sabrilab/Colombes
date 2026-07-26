import { Button } from '@/components/ui/button'
import { useSimulator } from '@/store/simulator'

export function ThemeToggle() {
  const theme = useSimulator((state) => state.theme)
  const setTheme = useSimulator((state) => state.setTheme)

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  )
}
