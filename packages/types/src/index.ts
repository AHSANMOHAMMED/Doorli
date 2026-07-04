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
