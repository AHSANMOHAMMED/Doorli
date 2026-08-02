'use client'

import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { ErrorCaptureProvider } from "@/components/providers/ErrorCaptureProvider"
import { ReactNode } from 'react'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorCaptureProvider>
        {children}
      </ErrorCaptureProvider>
    </ThemeProvider>
  )
}
