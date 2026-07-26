import axios from 'axios';

/**
 * Marketplace → ERP bridge.
 * - Embedded Retail Smart ERP (OCI today): ERP_API_URL ends with /erp/api/internal
 * - Doorli Enterprise OS (Frappe): ERP_API_URL contains doorli_core.api.create_order
 */
function erpBaseUrl(): string {
  return (
    process.env.ERP_API_URL ||
    process.env.ERP_SERVICE_URL ||
    'http://127.0.0.1:3010/api/internal'
  );
}

function erpSecretRaw(): string {
  return process.env.ERP_INTERNAL_SECRET || 'doorli_internal_sync_secret';
}

function authHeaderValue(): string {
  const secret = erpSecretRaw();
  return secret.startsWith('Bearer ') ? secret : `Bearer ${secret}`;
}

function isEnterpriseFrappe(url: string): boolean {
  return /doorli_core\.api|enterprise\.doorli/i.test(url);
}

export class ErpIntegrationService {
  /** Sync marketplace order → embedded ERP or Enterprise OS. */
  static async syncOrderToErp(orderPayload: {
    tenantId: string;
    items: Array<{ productId: string; name?: string; quantity: number; price: number }>;
    customerInfo?: { name?: string; phone?: string };
    totalAmount: number;
    marketplaceOrderId?: string;
    marketplaceOrderNumber?: string;
  }): Promise<{ success: boolean; erpOrderId?: string; message?: string }> {
    const url = erpBaseUrl();

    try {
      if (isEnterpriseFrappe(url)) {
        return await syncToEnterpriseOs(url, orderPayload);
      }
      return await syncToEmbeddedErp(url, orderPayload);
    } catch (error) {
      console.error('Failed to sync order to ERP:', error);
      return { success: false, message: 'ERP unreachable' };
    }
  }

  /** Inventory lookup — stub until Frappe/embedded stock APIs are wired. */
  static async getInventoryFromErp(
    _erpTenantId: string,
    _productId: string,
  ): Promise<{
    quantity?: number;
    stock?: number;
    onHand?: number;
    data?: { quantity?: number };
    items?: Array<{ barcode?: string; sku?: string; quantity?: number }>;
  } | null> {
    return null;
  }
}

async function syncToEmbeddedErp(
  baseUrl: string,
  orderPayload: {
    tenantId: string;
    items: Array<{ productId: string; name?: string; quantity: number; price: number }>;
    customerInfo?: { name?: string; phone?: string };
    totalAmount: number;
  },
): Promise<{ success: boolean; erpOrderId?: string; message?: string }> {
  const endpoint = baseUrl.replace(/\/$/, '').endsWith('/orders')
    ? baseUrl
    : `${baseUrl.replace(/\/$/, '')}/orders`;

  const response = await axios.post(
    endpoint,
    {
      tenantId: orderPayload.tenantId,
      items: orderPayload.items,
      customerInfo: orderPayload.customerInfo,
      totalAmount: orderPayload.totalAmount,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': erpSecretRaw().replace(/^Bearer\s+/i, ''),
      },
      timeout: 8000,
      validateStatus: () => true,
    },
  );

  if (response.status >= 400 || response.data?.success === false) {
    console.error('Embedded ERP sync rejected:', response.status, response.data);
    return { success: false, message: response.data?.error || 'ERP rejected' };
  }

  return {
    success: true,
    erpOrderId: response.data?.invoiceNo || response.data?.id,
    message: 'Synced to embedded ERP',
  };
}

async function syncToEnterpriseOs(
  createOrderUrl: string,
  orderPayload: {
    tenantId: string;
    items: Array<{ productId: string; name?: string; quantity: number; price: number }>;
    customerInfo?: { name?: string; phone?: string };
    totalAmount: number;
    marketplaceOrderId?: string;
    marketplaceOrderNumber?: string;
  },
): Promise<{ success: boolean; erpOrderId?: string; message?: string }> {
  const frappePayload = {
    marketplace_order_id: orderPayload.marketplaceOrderId || orderPayload.marketplaceOrderNumber,
    vendor_id: orderPayload.tenantId,
    customer_name: orderPayload.customerInfo?.name || 'Walk-in Customer',
    customer_phone: orderPayload.customerInfo?.phone || '',
    items: orderPayload.items.map((item) => ({
      item_name: item.name || item.productId,
      qty: item.quantity,
      price: item.price,
    })),
    total_amount: orderPayload.totalAmount,
  };

  const response = await axios.post(createOrderUrl, frappePayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeaderValue(),
    },
    timeout: 8000,
    validateStatus: () => true,
  });

  if (response.status >= 400 || response.data?.message?.status === 'error') {
    console.error('Enterprise OS sync rejected:', response.status, response.data);
    return { success: false, message: response.data?.message?.message || 'ERP rejected' };
  }

  const erpOrderId = response.data?.message?.erp_order_id;
  return { success: true, erpOrderId, message: 'Injected into Enterprise OS' };
}
