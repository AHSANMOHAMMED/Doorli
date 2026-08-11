export type UserRole = 'customer' | 'vendor' | 'driver' | 'admin';

export type VendorCategory =
  | 'grocery'
  | 'restaurant'
  | 'hotel'
  | 'hall'
  | 'service'
  | 'beauty';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type OrderType = 'delivery' | 'pickup';

export type PaymentMethod = 'card' | 'wallet' | 'cod';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type BookingType = 'hotel' | 'hall' | 'beauty' | 'service';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type ServiceRequestStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VehicleType = 'bike' | 'car' | 'van' | 'truck';

export type PaymentReferenceType = 'order' | 'booking';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  phone: string;
  iat?: number;
  exp?: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  db: boolean;
  redis: boolean;
  timestamp: string;
  version: string;
}

// ==========================================
// CENTRALIZED SUPER-ADMIN CONTROL PLANE
// ==========================================

/** Platform services that can be switched on/off from super-admin. */
export type ServiceKey =
  | 'marketplace'
  | 'delivery'
  | 'auth'
  | 'notifications'
  | 'search'
  | 'ai'
  | 'storage'
  | 'chat'
  | 'ride_hailing'
  | 'emergency'
  | 'forum'
  | 'gov'
  | 'erp';

/** Marketplace/vendor capability flags controllable per vendor or globally. */
export type ControlFeatureKey =
  | 'marketplace_listing'
  | 'doorli_delivery'
  | 'pos'
  | 'ai'
  | 'booking'
  | 'loyalty'
  | 'corporate'
  | 'group_orders'
  | 'flash_sales'
  | 'forums'
  | 'rides'
  | 'gov'
  | 'emergency';

/** ERP configurable capabilities that a super-admin can toggle (matches ERP module-access keys). */
export type ErpModuleKey =
  | 'dashboard'
  | 'stock'
  | 'selling'
  | 'buying'
  | 'auto-service'
  | 'restaurant'
  | 'hr'
  | 'accounting'
  | 'reports'
  | 'my'
  | 'settings';

export type ServiceState = 'enabled' | 'disabled';

export type ServiceStateRecord = Record<ServiceKey, ServiceState>;

export type MaintenanceStatus = 'none' | 'scheduled' | 'active';

/** Persisted maintenance window (replaces the current in-memory flag). */
export interface MaintenanceWindow {
  id?: string;
  active: boolean;
  message?: string;
  reason?: string;
  /** ISO timestamp when maintenance will start (scheduled) or started (active). */
  startsAt?: string;
  endsAt?: string;
  /** Optional scope: 'all' | 'marketplace' | 'erp' | specific service key. */
  scope?: 'all' | 'marketplace' | 'erp' | ServiceKey;
  createdByName?: string;
  updatedAt?: string;
}

/** One-click quota override for an ERP tenant (increase / reduce limits). */
export interface ErpQuotaOverride {
  tenantId: string;
  maxUsers?: number | null;
  maxSalesMonthly?: number | null;
  maxDatabaseBytes?: number | null;
  maxFileStorageBytes?: number | null;
  /** Replace the tenant's whole pricing tier. */
  tierName?: string | null;
}

/** Tenant lifecycle + plan control payload for ERP tenants. */
export interface ErpTenantControl {
  tenantId: string;
  /** active | suspended | locked | cancelled */
  status?: 'active' | 'suspended' | 'locked' | 'cancelled';
  statusReason?: string;
  plan?: 'trial' | 'basic' | 'standard' | 'premium';
  planExpiresAt?: string | null;
  aiEnabled?: boolean;
}

/** Per-endpoint rate-limit policy (increase / reduce request limits). */
export interface RateLimitPolicy {
  id?: string;
  /** Route pattern, e.g. '/api/v1/auth/send-otp' or 'global'. */
  path: string;
  windowMs: number;
  limit: number;
  notes?: string;
  isActive?: boolean;
  updatedAt?: string;
}

/** Broadcast payload (persisted + realtime push). */
export interface ControlBroadcast {
  id?: string;
  title: string;
  body: string;
  audience: 'all' | 'customers' | 'vendors' | 'drivers' | 'admins' | 'erp_tenants';
  type?: 'announcement' | 'warning' | 'info' | 'maintenance';
  scheduledAt?: string;
  sent?: boolean;
  createdAt?: string;
}

/** Result envelope used by the super-admin control API. */
export interface ControlResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
