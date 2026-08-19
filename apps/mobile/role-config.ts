export type MobileAppRole = 'customer' | 'vendor' | 'driver' | 'admin' | 'super_admin' | 'cashier';

const configuredRole = process.env.EXPO_PUBLIC_APP_ROLE;

export const MOBILE_APP_ROLE: MobileAppRole =
  configuredRole === 'vendor' ||
  configuredRole === 'driver' ||
  configuredRole === 'admin' ||
  configuredRole === 'super_admin' ||
  configuredRole === 'cashier'
    ? configuredRole
    : 'customer';

export const MOBILE_APP_LABELS: Record<MobileAppRole, string> = {
  customer: 'Doorli Customer',
  vendor: 'Doorli Vendor',
  driver: 'Doorli Driver',
  admin: 'Doorli Admin',
  super_admin: 'Doorli Super Admin',
  cashier: 'Doorli Cashier',
};

export const MOBILE_APP_HOME: Record<MobileAppRole, string> = {
  customer: '/(customer)',
  vendor: '/(vendor)/hub',
  driver: '/(driver)/jobs',
  admin: '/(admin)',
  super_admin: '/(super-admin)',
  cashier: '/(vendor)/cashier',
};

export const MOBILE_AUTH_ROLE = MOBILE_APP_ROLE === 'cashier' ? 'vendor' : MOBILE_APP_ROLE;

export const MOBILE_DEFAULT_IDENTIFIER: Record<MobileAppRole, string> = {
  customer: 'customer@doorli.test',
  vendor: 'vendor@doorli.test',
  driver: 'driver@doorli.test',
  admin: 'admin@doorli.test',
  super_admin: 'superadmin@doorli.test',
  cashier: 'vendor@doorli.test',
};
