'use client'

import { useEffect } from 'react'

/**
 * Sys-control admin UI is designed for light theme.
 * Global ThemeProvider may put `.dark` on <html>, which breaks
 * Tailwind `dark:` styles and body --page-bg for this area.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement
    const previousTheme = localStorage.getItem('theme')
    const hadDark = root.classList.contains('dark')

    root.classList.remove('dark')
    root.classList.add('light')
    root.style.colorScheme = 'light'

    return () => {
      root.style.colorScheme = ''
      root.classList.remove('light')
      if (hadDark || previousTheme === 'dark' || previousTheme === 'system') {
        // Re-apply via ThemeProvider on next navigation; restore dark if it was on
        if (hadDark) root.classList.add('dark')
      }
    }
  }, [])

  return null
}
