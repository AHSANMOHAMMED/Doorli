import axios from 'axios';

// Pointing to the new isolated OCI Enterprise Server
const ERP_API_URL = process.env.ERP_API_URL || 'https://enterprise.doorli.me/api/method/doorli_core.api.create_order';
const ERP_INTERNAL_SECRET = process.env.ERP_INTERNAL_SECRET || 'Bearer DOORLI_ENTERPRISE_SECRET_2026_xyz';

const erpClient = axios.create({
  baseURL: ERP_API_URL, // We hit the full URL directly for orders now
  headers: {
    'Content-Type': 'application/json',
    'Authorization': ERP_INTERNAL_SECRET, // Using the new highly secure Gateway
  },
  timeout: 8000,
  validateStatus: () => true,
});

export class ErpIntegrationService {
  /** Sync marketplace order → Enterprise OS (Frappe). */
  static async syncOrderToErp(orderPayload: {
    tenantId: string;
    items: Array<{ productId: string; name?: string; quantity: number; price: number }>;
    customerInfo?: { name?: string; phone?: string };
    totalAmount: number;
    marketplaceOrderId?: string;
    marketplaceOrderNumber?: string;
  }): Promise<{ success: boolean; erpOrderId?: string; message?: string }> {
    try {
      // Map the Doorli payload to match the new Python Webhook expectations
      const frappePayload = {
        marketplace_order_id: orderPayload.marketplaceOrderId || orderPayload.marketplaceOrderNumber,
        vendor_id: orderPayload.tenantId,
        customer_name: orderPayload.customerInfo?.name || 'Walk-in Customer',
        customer_phone: orderPayload.customerInfo?.phone || '',
        items: orderPayload.items.map(item => ({
          item_name: item.name || item.productId,
          qty: item.quantity,
          price: item.price
        })),
        total_amount: orderPayload.totalAmount
      };

      const response = await erpClient.post('', frappePayload);
      
      if (response.status >= 400 || response.data?.message?.status === 'error') {
        console.error('Enterprise OS sync rejected:', response.status, response.data);
        return { success: false, message: response.data?.message?.message || 'ERP rejected' };
      }
      
      const erpOrderId = response.data?.message?.erp_order_id;
      return { success: true, erpOrderId, message: 'Injected into Enterprise OS' };
      
    } catch (error) {
      console.error('Failed to sync order to Enterprise OS:', error);
      return { success: false, message: 'Enterprise OS unreachable' };
    }
  }

  /** Inventory lookup - Currently disabled as Frappe handles local inventory. */
  static async getInventoryFromErp(erpTenantId: string, productId: string) {
    // To be implemented via Frappe REST API in the future
    return null;
  }
}
