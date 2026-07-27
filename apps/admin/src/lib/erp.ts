/** Public deep-link bases for the two ERP products. */
export function erpSimpleUrl(): string {
  return (process.env.NEXT_PUBLIC_ERP_SIMPLE_URL || 'http://erp.doorli.me').replace(/\/$/, '');
}

export function erpEnterpriseUrl(): string {
  return (process.env.NEXT_PUBLIC_ERP_ENTERPRISE_URL || 'http://enterprise.doorli.me').replace(/\/$/, '');
}

export function erpDeepLink(provider?: string | null): string | null {
  if (provider === 'simple') return erpSimpleUrl();
  if (provider === 'enterprise') return erpEnterpriseUrl();
  return null;
}
