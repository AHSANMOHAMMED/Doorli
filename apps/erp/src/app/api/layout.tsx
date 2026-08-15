import type { ReactNode } from 'react'

// API handlers use tenant/session/database state and must be evaluated at
// request time rather than during Next's build-time page-data collection.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function ApiLayout({ children }: { children: ReactNode }) {
  return children
}
