export { haversineKm } from './geo.js';

export function formatCurrency(amount: number, currency = 'LKR'): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DL-${timestamp}-${random}`;
}

export interface DeliveryFeeOptions {
  baseFee: number;
  distanceKm: number;
  perKmRate: number;
  peakSurcharge?: number;
}

export function calculateDeliveryFee(options: DeliveryFeeOptions): number {
  const { baseFee, distanceKm, perKmRate, peakSurcharge = 0 } = options;
  return baseFee + distanceKm * perKmRate + peakSurcharge;
}
