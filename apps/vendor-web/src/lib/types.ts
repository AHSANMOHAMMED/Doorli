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

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type BookingType =
  | 'hotel_room'
  | 'hall_booking'
  | 'beauty_appointment'
  | 'restaurant_table';

export type ServiceRequestStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  category: VendorCategory;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Record<string, string> | null;
  is_open: boolean;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  delivery_radius_km: number;
  min_order_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  discount_price: number | null;
  unit: string | null;
  stock_quantity: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string | null;
  user_id: string;
  vendor_id: string;
  driver_id: string | null;
  status: OrderStatus;
  payment_status: string;
  payment_method: string;
  delivery_type: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_notes: string | null;
  cancelled_reason: string | null;
  estimated_delivery_time: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  vendor?: Vendor;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_number: string | null;
  user_id: string;
  vendor_id: string;
  booking_type: BookingType;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  party_size: number;
  room_type: string | null;
  service_name: string | null;
  special_requests: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  total_amount: number;
  payment_status: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface ServiceRequest {
  id: string;
  request_number: string | null;
  user_id: string;
  vendor_id: string;
  service_type: string;
  title: string | null;
  description: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  status: ServiceRequestStatus;
  urgency: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  payment_status: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  accepted_at: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface Review {
  id: string;
  user_id: string;
  vendor_id: string | null;
  product_id: string | null;
  driver_id: string | null;
  order_id: string | null;
  rating: number;
  comment: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  vendor_id: string;
  cart_items?: CartItem[];
  vendor?: Vendor;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Delivery {
  id: string;
  order_id: string;
  driver_id: string | null;
  status: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  current_lat: number | null;
  current_lng: number | null;
  otp: string | null;
  assigned_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
}
