import crypto from 'crypto';

/**
 * Service to handle PayHere local payments in Sri Lanka.
 * See: https://support.payhere.lk/api-&-mobile-sdk/payhere-checkout
 */
export class PayHereIntegrationService {
  private static merchantId: string;
  private static merchantSecret: string;

  private static ensureConfigured(): void {
    if (!PayHereIntegrationService.merchantId) {
      if (!process.env.PAYHERE_MERCHANT_ID || !process.env.PAYHERE_MERCHANT_SECRET) {
        throw new Error('PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET are required');
      }
      PayHereIntegrationService.merchantId = process.env.PAYHERE_MERCHANT_ID;
      PayHereIntegrationService.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    }
  }

  /**
   * Generates the MD5 Hash required by PayHere to verify the payment integrity.
   */
  static generateHash(orderId: string, amount: number, currency: string = 'LKR'): string {
    PayHereIntegrationService.ensureConfigured();
    const formattedAmount = amount.toLocaleString('en-us', { minimumFractionDigits: 2 }).replace(/,/g, '');
    const hashedSecret = crypto.createHash('md5').update(this.merchantSecret).digest('hex').toUpperCase();
    const hashString = `${this.merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;
    
    return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  }

  /**
   * Verifies the callback from PayHere to ensure the payment was actually successful.
   */
  static verifyPaymentCallback(body: any): boolean {
    PayHereIntegrationService.ensureConfigured();
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;
    
    // Status Code 2 means success
    if (status_code !== '2') return false;

    const hashedSecret = crypto.createHash('md5').update(this.merchantSecret).digest('hex').toUpperCase();
    const localSigString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`;
    const localMd5sig = crypto.createHash('md5').update(localSigString).digest('hex').toUpperCase();

    return localMd5sig === md5sig;
  }
}
