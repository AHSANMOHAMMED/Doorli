import axios from 'axios';

const ERP_API_URL = process.env.ERP_API_URL || 'http://localhost:3010/api/internal';
const ERP_INTERNAL_SECRET = process.env.ERP_INTERNAL_SECRET || 'doorli_internal_sync_secret';

const erpClient = axios.create({
  baseURL: ERP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-internal-secret': ERP_INTERNAL_SECRET,
  },
  timeout: 8000,
  validateStatus: () => true,
});

export class ErpIntegrationService {
  /** Sync marketplace order → ERP sale. Returns ERP invoice/sale id when available. */
  static async syncOrderToErp(orderPayload: {
    tenantId: string;
    items: Array<{ productId: string; name?: string; quantity: number; price: number }>;
    customerInfo?: { name?: string; phone?: string };
    totalAmount: number;
    marketplaceOrderId?: string;
    marketplaceOrderNumber?: string;
  }): Promise<{ success: boolean; erpOrderId?: string; message?: string }> {
    try {
      const response = await erpClient.post('/orders', orderPayload);
      if (response.status >= 400) {
        console.error('ERP sync rejected:', response.status, response.data);
        return { success: false, message: response.data?.error || 'ERP rejected' };
      }
      const erpOrderId =
        response.data?.saleId ||
        response.data?.invoiceNo ||
        response.data?.id ||
        orderPayload.marketplaceOrderNumber ||
        undefined;
      return { success: true, erpOrderId, message: response.data?.message };
    } catch (error) {
      console.error('Failed to sync order to ERP:', error);
      return { success: false, message: 'ERP unreachable' };
    }
  }

  /** Inventory lookup — matches ERP query params tenantId + productId */
  static async getInventoryFromErp(erpTenantId: string, productId: string) {
    try {
      const response = await erpClient.get('/inventory', {
        params: { tenantId: erpTenantId, productId },
      });
      if (response.status >= 400) {
        return null;
      }
      return response.data;
    } catch {
      return null;
    }
  }
}
