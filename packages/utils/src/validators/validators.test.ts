/**
 * Unit tests for Zod validators.
 * Covers happy paths and rejection cases for all major schemas.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  // order
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  // booking
  CreateBookingSchema,
  UpdateBookingStatusSchema,
  // vendor
  CreateVendorSchema,
  UpdateVendorSchema,
  // product
  CreateProductSchema,
  BulkUpdateStockSchema,
  // service-request
  CreateServiceRequestSchema,
  UpdateServiceRequestStatusSchema,
  // payment
  InitiatePaymentSchema,
  RefundPaymentSchema,
  // promo
  CreatePromoCodeSchema,
  ValidatePromoCodeSchema,
  // ride
  CreateRideRequestSchema,
  UpdateRideStatusSchema,
  EstimateRideFareSchema,
  // driver
  RegisterDriverSchema,
  UpdateDriverStatusSchema,
  UpdateDriverLocationSchema,
} from './index.js';

// ── tiny helpers ────────────────────────────────────────────────────────────

function ok(schema: { safeParse(v: unknown): { success: boolean } }, value: unknown, label = '') {
  const r = schema.safeParse(value);
  assert.equal(r.success, true, `Expected success for: ${label || JSON.stringify(value)}`);
}

function fail(schema: { safeParse(v: unknown): { success: boolean } }, value: unknown, label = '') {
  const r = schema.safeParse(value);
  assert.equal(r.success, false, `Expected failure for: ${label || JSON.stringify(value)}`);
}

const uuid = '550e8400-e29b-41d4-a716-446655440000';
const uuid2 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const isoDate = '2025-12-01';
const isoDatetime = '2025-12-01T10:00:00.000Z';

// ────────────────────────────────────────────────────────────────────────────
// ORDER
// ────────────────────────────────────────────────────────────────────────────
describe('CreateOrderSchema', () => {
  it('accepts a valid minimal order', () => {
    ok(CreateOrderSchema, {
      vendorId: uuid,
      items: [{ productId: uuid2, quantity: 2 }],
    });
  });

  it('accepts a full order with all optional fields', () => {
    ok(CreateOrderSchema, {
      vendorId: uuid,
      deliveryAddressId: uuid2,
      orderType: 'pickup',
      paymentMethod: 'card',
      specialInstructions: 'Leave at door',
      promoCode: 'SAVE10',
      items: [{ productId: uuid2, quantity: 1, notes: 'no onions' }],
    });
  });

  it('rejects when items array is empty', () => {
    fail(CreateOrderSchema, { vendorId: uuid, items: [] }, 'empty items');
  });

  it('rejects when vendorId is not a UUID', () => {
    fail(CreateOrderSchema, { vendorId: 'not-a-uuid', items: [{ productId: uuid2, quantity: 1 }] }, 'invalid vendorId');
  });

  it('rejects when item quantity is 0', () => {
    fail(CreateOrderSchema, { vendorId: uuid, items: [{ productId: uuid2, quantity: 0 }] }, 'quantity 0');
  });

  it('rejects invalid orderType', () => {
    fail(CreateOrderSchema, { vendorId: uuid, orderType: 'express', items: [{ productId: uuid2, quantity: 1 }] }, 'bad orderType');
  });
});

describe('UpdateOrderStatusSchema', () => {
  const validStatuses = ['confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];

  for (const status of validStatuses) {
    it(`accepts status "${status}"`, () => ok(UpdateOrderStatusSchema, { status }));
  }

  it('rejects unknown status', () => {
    fail(UpdateOrderStatusSchema, { status: 'pending' }, 'unknown status');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// BOOKING
// ────────────────────────────────────────────────────────────────────────────
describe('CreateBookingSchema', () => {
  it('accepts a valid hotel booking', () => {
    ok(CreateBookingSchema, {
      vendorId: uuid,
      bookingType: 'hotel',
      checkInDate: isoDate,
      checkOutDate: '2025-12-05',
      guestCount: 2,
      totalAmount: 15000,
    });
  });

  it('accepts a beauty service booking', () => {
    ok(CreateBookingSchema, {
      vendorId: uuid,
      bookingType: 'beauty',
      startTime: '09:00',
      durationMins: 60,
      totalAmount: 2500,
    });
  });

  it('rejects when totalAmount is zero or negative', () => {
    fail(CreateBookingSchema, { vendorId: uuid, bookingType: 'hotel', totalAmount: 0 }, 'zero amount');
    fail(CreateBookingSchema, { vendorId: uuid, bookingType: 'hotel', totalAmount: -100 }, 'negative amount');
  });

  it('rejects invalid bookingType', () => {
    fail(CreateBookingSchema, { vendorId: uuid, bookingType: 'spa', totalAmount: 1000 }, 'bad type');
  });

  it('rejects missing vendorId', () => {
    fail(CreateBookingSchema, { bookingType: 'hotel', totalAmount: 5000 }, 'no vendorId');
  });
});

describe('UpdateBookingStatusSchema', () => {
  it('accepts confirmed', () => ok(UpdateBookingStatusSchema, { status: 'confirmed' }));
  it('accepts completed', () => ok(UpdateBookingStatusSchema, { status: 'completed' }));
  it('accepts cancelled', () => ok(UpdateBookingStatusSchema, { status: 'cancelled' }));
  it('rejects invalid status', () => fail(UpdateBookingStatusSchema, { status: 'pending' }));
});

// ────────────────────────────────────────────────────────────────────────────
// VENDOR
// ────────────────────────────────────────────────────────────────────────────
describe('CreateVendorSchema', () => {
  it('accepts a minimal valid vendor', () => {
    ok(CreateVendorSchema, { businessName: 'Cool Shop', category: 'grocery' });
  });

  it('accepts full vendor with all optional fields', () => {
    ok(CreateVendorSchema, {
      businessName: 'Grand Hotel',
      category: 'hotel',
      description: 'Luxury hotel in Colombo',
      phone: '+94771234567',
      addressLine: '123 Main St',
      city: 'Colombo',
      latitude: 6.9271,
      longitude: 79.8612,
      deliveryRadiusKm: 10,
      minOrderAmount: 500,
    });
  });

  it('rejects businessName shorter than 2 chars', () => {
    fail(CreateVendorSchema, { businessName: 'A', category: 'grocery' }, 'too short name');
  });

  it('rejects invalid category', () => {
    fail(CreateVendorSchema, { businessName: 'Test', category: 'pharmacy' }, 'bad category');
  });

  it('rejects latitude out of range', () => {
    fail(CreateVendorSchema, { businessName: 'Test', category: 'grocery', latitude: 100 }, 'lat > 90');
  });

  it('rejects deliveryRadiusKm > 50', () => {
    fail(CreateVendorSchema, { businessName: 'Test', category: 'grocery', deliveryRadiusKm: 51 }, 'radius too large');
  });
});

describe('UpdateVendorSchema', () => {
  it('accepts partial update (only city)', () => {
    ok(UpdateVendorSchema, { city: 'Kandy' });
  });

  it('accepts empty object (all fields optional)', () => {
    ok(UpdateVendorSchema, {});
  });

  it('rejects invalid category in partial update', () => {
    fail(UpdateVendorSchema, { category: 'spa' }, 'bad category');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// PRODUCT
// ────────────────────────────────────────────────────────────────────────────
describe('CreateProductSchema', () => {
  it('accepts a valid product', () => {
    ok(CreateProductSchema, {
      vendorId: uuid,
      name: 'Rice 1kg',
      price: 250,
    });
  });

  it('accepts product with all optional fields', () => {
    ok(CreateProductSchema, {
      vendorId: uuid,
      name: 'Burger',
      description: 'Juicy beef burger',
      category: 'Fast Food',
      price: 750,
      discountPrice: 650,
      stockQuantity: 50,
      lowStockAt: 10,
      imageUrl: 'https://example.com/burger.jpg',
      prepTimeMins: 15,
      addons: [{ name: 'Extra cheese', price: 50 }],
      allergens: ['gluten', 'dairy'],
    });
  });

  it('rejects when price is zero', () => {
    fail(CreateProductSchema, { vendorId: uuid, name: 'Item', price: 0 }, 'price 0');
  });

  it('rejects empty product name', () => {
    fail(CreateProductSchema, { vendorId: uuid, name: '', price: 100 }, 'empty name');
  });

  it('rejects negative stockQuantity', () => {
    fail(CreateProductSchema, { vendorId: uuid, name: 'Item', price: 100, stockQuantity: -1 }, 'negative stock');
  });

  it('rejects invalid imageUrl', () => {
    fail(CreateProductSchema, { vendorId: uuid, name: 'Item', price: 100, imageUrl: 'not-a-url' }, 'bad url');
  });
});

describe('BulkUpdateStockSchema', () => {
  it('accepts valid bulk update', () => {
    ok(BulkUpdateStockSchema, {
      updates: [{ productId: uuid, stockQuantity: 10 }, { productId: uuid2, stockQuantity: 0 }],
    });
  });

  it('rejects empty updates array', () => {
    fail(BulkUpdateStockSchema, { updates: [] }, 'empty updates');
  });

  it('rejects negative stockQuantity', () => {
    fail(BulkUpdateStockSchema, { updates: [{ productId: uuid, stockQuantity: -5 }] }, 'negative stock');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// SERVICE REQUEST
// ────────────────────────────────────────────────────────────────────────────
describe('CreateServiceRequestSchema', () => {
  it('accepts a valid service request', () => {
    ok(CreateServiceRequestSchema, {
      serviceType: 'plumbing',
      title: 'Fix leaking pipe',
    });
  });

  it('accepts request with all optional fields', () => {
    ok(CreateServiceRequestSchema, {
      serviceType: 'electrical',
      title: 'Install ceiling fan',
      description: 'Need a ceiling fan installed in the bedroom',
      addressLine: '45 Temple Road',
      latitude: 6.9271,
      longitude: 79.8612,
      isUrgent: true,
      offeredRate: 2000,
      scheduledAt: isoDatetime,
    });
  });

  it('rejects empty serviceType', () => {
    fail(CreateServiceRequestSchema, { serviceType: '', title: 'Fix it' }, 'empty serviceType');
  });

  it('rejects title shorter than 2 chars', () => {
    fail(CreateServiceRequestSchema, { serviceType: 'plumbing', title: 'X' }, 'title too short');
  });

  it('rejects latitude out of range', () => {
    fail(CreateServiceRequestSchema, { serviceType: 'x', title: 'Test', latitude: -100 }, 'lat < -90');
  });

  it('rejects negative offeredRate', () => {
    fail(CreateServiceRequestSchema, { serviceType: 'x', title: 'Test', offeredRate: -50 }, 'negative rate');
  });
});

describe('UpdateServiceRequestStatusSchema', () => {
  const validStatuses = ['assigned', 'in_progress', 'completed', 'cancelled'];
  for (const status of validStatuses) {
    it(`accepts "${status}"`, () => ok(UpdateServiceRequestStatusSchema, { status }));
  }
  it('rejects invalid status', () => fail(UpdateServiceRequestStatusSchema, { status: 'pending' }));
});

// ────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ────────────────────────────────────────────────────────────────────────────
describe('InitiatePaymentSchema', () => {
  it('accepts a valid card payment', () => {
    ok(InitiatePaymentSchema, {
      referenceId: uuid,
      referenceType: 'order',
      amount: 1500,
      method: 'card',
    });
  });

  it('accepts wallet payment for booking with explicit currency', () => {
    ok(InitiatePaymentSchema, {
      referenceId: uuid,
      referenceType: 'booking',
      amount: 5000,
      currency: 'LKR',
      method: 'wallet',
    });
  });

  it('rejects invalid referenceType', () => {
    fail(InitiatePaymentSchema, { referenceId: uuid, referenceType: 'ride', amount: 100, method: 'card' }, 'bad refType');
  });

  it('rejects zero or negative amount', () => {
    fail(InitiatePaymentSchema, { referenceId: uuid, referenceType: 'order', amount: 0, method: 'cod' }, 'zero amount');
    fail(InitiatePaymentSchema, { referenceId: uuid, referenceType: 'order', amount: -1, method: 'cod' }, 'negative amount');
  });

  it('rejects currency that is not 3 chars', () => {
    fail(InitiatePaymentSchema, { referenceId: uuid, referenceType: 'order', amount: 100, currency: 'LKRR', method: 'card' }, 'bad currency');
  });

  it('rejects invalid payment method', () => {
    fail(InitiatePaymentSchema, { referenceId: uuid, referenceType: 'order', amount: 100, method: 'crypto' }, 'bad method');
  });
});

describe('RefundPaymentSchema', () => {
  it('accepts a valid refund', () => {
    ok(RefundPaymentSchema, { paymentId: uuid });
  });

  it('accepts refund with optional reason', () => {
    ok(RefundPaymentSchema, { paymentId: uuid, reason: 'Customer cancelled order' });
  });

  it('rejects non-UUID paymentId', () => {
    fail(RefundPaymentSchema, { paymentId: 'not-uuid' }, 'bad paymentId');
  });

  it('rejects reason over 500 chars', () => {
    fail(RefundPaymentSchema, { paymentId: uuid, reason: 'x'.repeat(501) }, 'reason too long');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// PROMO
// ────────────────────────────────────────────────────────────────────────────
describe('CreatePromoCodeSchema', () => {
  it('accepts a valid percentage promo code', () => {
    ok(CreatePromoCodeSchema, {
      code: 'SAVE20',
      discountType: 'percentage',
      discountValue: 20,
      validFrom: isoDatetime,
      validUntil: '2025-12-31T23:59:59.000Z',
    });
  });

  it('accepts a fixed discount code with all optional fields', () => {
    ok(CreatePromoCodeSchema, {
      code: 'FLAT100',
      discountType: 'fixed',
      discountValue: 100,
      minOrderAmount: 500,
      maxDiscountAmount: 200,
      usageLimit: 1000,
      perUserLimit: 2,
      validFrom: isoDatetime,
      validUntil: '2025-12-31T23:59:59.000Z',
      vendorId: uuid,
    });
  });

  it('rejects code shorter than 3 chars', () => {
    fail(CreatePromoCodeSchema, { code: 'AB', discountType: 'fixed', discountValue: 50, validFrom: isoDatetime, validUntil: '2025-12-31T23:59:59.000Z' }, 'short code');
  });

  it('rejects invalid discountType', () => {
    fail(CreatePromoCodeSchema, { code: 'CODE1', discountType: 'half', discountValue: 50, validFrom: isoDatetime, validUntil: '2025-12-31T23:59:59.000Z' }, 'bad type');
  });

  it('rejects zero discountValue', () => {
    fail(CreatePromoCodeSchema, { code: 'CODE1', discountType: 'fixed', discountValue: 0, validFrom: isoDatetime, validUntil: '2025-12-31T23:59:59.000Z' }, 'zero discount');
  });
});

describe('ValidatePromoCodeSchema', () => {
  it('accepts valid promo validation', () => {
    ok(ValidatePromoCodeSchema, { code: 'SAVE20', orderAmount: 1000 });
  });

  it('accepts with optional vendorId', () => {
    ok(ValidatePromoCodeSchema, { code: 'SAVE20', orderAmount: 500, vendorId: uuid });
  });

  it('rejects zero orderAmount', () => {
    fail(ValidatePromoCodeSchema, { code: 'SAVE20', orderAmount: 0 }, 'zero order amount');
  });

  it('rejects code shorter than 3 chars', () => {
    fail(ValidatePromoCodeSchema, { code: 'AB', orderAmount: 500 }, 'short code');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// RIDE
// ────────────────────────────────────────────────────────────────────────────
describe('CreateRideRequestSchema', () => {
  it('accepts a valid minimal ride request', () => {
    ok(CreateRideRequestSchema, {
      pickupLat: 6.9271,
      pickupLng: 79.8612,
      pickupAddress: 'Colombo Fort',
      dropoffLat: 6.8721,
      dropoffLng: 79.8650,
      dropoffAddress: 'Nugegoda',
    });
  });

  it('accepts a fully specified ride request', () => {
    ok(CreateRideRequestSchema, {
      pickupLat: 6.9271,
      pickupLng: 79.8612,
      pickupAddress: 'Colombo Fort',
      dropoffLat: 6.8721,
      dropoffLng: 79.8650,
      dropoffAddress: 'Nugegoda',
      rideType: 'premium',
      paymentMethod: 'card',
      promoCode: 'RIDE10',
      scheduledAt: isoDatetime,
      passengersCount: 3,
      notes: 'Please have AC on',
    });
  });

  it('rejects latitude out of range', () => {
    fail(CreateRideRequestSchema, {
      pickupLat: 100,
      pickupLng: 79.8612,
      pickupAddress: 'X',
      dropoffLat: 6.8721,
      dropoffLng: 79.8650,
      dropoffAddress: 'Y',
    }, 'lat > 90');
  });

  it('rejects passengersCount > 6', () => {
    fail(CreateRideRequestSchema, {
      pickupLat: 6.9,
      pickupLng: 79.8,
      pickupAddress: 'A',
      dropoffLat: 6.8,
      dropoffLng: 79.9,
      dropoffAddress: 'B',
      passengersCount: 7,
    }, 'passengers > 6');
  });

  it('rejects invalid rideType', () => {
    fail(CreateRideRequestSchema, {
      pickupLat: 6.9,
      pickupLng: 79.8,
      pickupAddress: 'A',
      dropoffLat: 6.8,
      dropoffLng: 79.9,
      dropoffAddress: 'B',
      rideType: 'luxury',
    }, 'bad rideType');
  });
});

describe('UpdateRideStatusSchema', () => {
  const validStatuses = ['accepted', 'arriving', 'in_progress', 'completed', 'cancelled'];
  for (const status of validStatuses) {
    it(`accepts "${status}"`, () => ok(UpdateRideStatusSchema, { status }));
  }
  it('rejects unknown status', () => fail(UpdateRideStatusSchema, { status: 'waiting' }));
});

describe('EstimateRideFareSchema', () => {
  it('accepts valid fare estimate input', () => {
    ok(EstimateRideFareSchema, {
      pickupLat: 6.9271,
      pickupLng: 79.8612,
      dropoffLat: 6.8721,
      dropoffLng: 79.8650,
    });
  });

  it('rejects missing dropoff coordinates', () => {
    fail(EstimateRideFareSchema, { pickupLat: 6.9, pickupLng: 79.8 }, 'no dropoff');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// DRIVER
// ────────────────────────────────────────────────────────────────────────────
describe('RegisterDriverSchema', () => {
  it('accepts a valid driver registration', () => {
    ok(RegisterDriverSchema, {
      vehicleType: 'motorcycle',
      vehiclePlate: 'CAB-1234',
      licenseNumber: 'LK123456',
    });
  });

  it('accepts car driver with all optional fields', () => {
    ok(RegisterDriverSchema, {
      vehicleType: 'car',
      vehicleMake: 'Toyota',
      vehicleModel: 'Prius',
      vehiclePlate: 'ABC-5678',
      licenseNumber: 'LK987654',
      profilePhotoUrl: 'https://example.com/photo.jpg',
    });
  });

  it('rejects invalid vehicleType', () => {
    fail(RegisterDriverSchema, { vehicleType: 'truck', vehiclePlate: 'ABC', licenseNumber: 'X1' }, 'bad vehicleType');
  });

  it('rejects invalid profilePhotoUrl', () => {
    fail(RegisterDriverSchema, { vehicleType: 'car', vehiclePlate: 'ABC', licenseNumber: 'X1', profilePhotoUrl: 'not-a-url' }, 'bad url');
  });

  it('rejects missing licenseNumber', () => {
    fail(RegisterDriverSchema, { vehicleType: 'motorcycle', vehiclePlate: 'ABC-123' }, 'no license');
  });
});

describe('UpdateDriverStatusSchema', () => {
  it('accepts isOnline true', () => ok(UpdateDriverStatusSchema, { isOnline: true }));
  it('accepts isOnline false', () => ok(UpdateDriverStatusSchema, { isOnline: false }));
  it('rejects non-boolean', () => fail(UpdateDriverStatusSchema, { isOnline: 'yes' }));
  it('rejects missing isOnline', () => fail(UpdateDriverStatusSchema, {}));
});

describe('UpdateDriverLocationSchema', () => {
  it('accepts valid location update', () => {
    ok(UpdateDriverLocationSchema, { latitude: 6.9271, longitude: 79.8612 });
  });

  it('accepts with optional heading and speed', () => {
    ok(UpdateDriverLocationSchema, { latitude: 6.9271, longitude: 79.8612, heading: 180, speed: 40 });
  });

  it('rejects latitude > 90', () => {
    fail(UpdateDriverLocationSchema, { latitude: 91, longitude: 79.8 }, 'lat > 90');
  });

  it('rejects longitude > 180', () => {
    fail(UpdateDriverLocationSchema, { latitude: 6.9, longitude: 200 }, 'lng > 180');
  });

  it('rejects heading > 360', () => {
    fail(UpdateDriverLocationSchema, { latitude: 6.9, longitude: 79.8, heading: 400 }, 'heading > 360');
  });

  it('rejects negative speed', () => {
    fail(UpdateDriverLocationSchema, { latitude: 6.9, longitude: 79.8, speed: -10 }, 'negative speed');
  });
});
