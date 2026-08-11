/**
 * Canonical ERP module keys consumed by the ERP UI's module-access page
 * (see src/app/c/[slug]/settings/module-access/page.tsx). The super-admin
 * control plane toggles these same keys through /api/internal/control/module.
 */
export const ERP_MODULE_KEYS = [
  'dashboard',
  'stock',
  'selling',
  'buying',
  'auto-service',
  'restaurant',
  'hr',
  'accounting',
  'reports',
  'my',
  'settings',
] as const

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  stock: 'Stock & Inventory',
  selling: 'Selling & POS',
  buying: 'Buying & Purchases',
  'auto-service': 'Auto Service',
  restaurant: 'Restaurant',
  hr: 'HR & Payroll',
  accounting: 'Accounting',
  reports: 'Reports',
  my: 'My Portal',
  settings: 'Settings',
}

export function moduleLabel(key: string): string {
  return MODULE_LABELS[key] || key
}

/**
 * Reserved for future module discovery. Currently validates that the key is a
 * known ERP module (unknown keys are allowed for forward compatibility but
 * logged for the super-admin) and returns nothing.
 */
export async function addModuleKeys(...keys: string[]): Promise<void> {
  for (const key of keys) {
    if (!(ERP_MODULE_KEYS as readonly string[]).includes(key)) {
      console.warn('[control/module] Unknown ERP module key:', key)
    }
  }
}