import axios from 'axios';

/**
 * Marketplace → ERP bridge.
 *
 * Doorli runs two ERPs at once and routes *per vendor* (never from one global URL):
 * - `simple`     → embedded Retail Smart ERP (Next app on the marketplace node).
 * - `enterprise` → isolated Frappe/ERPNext company (Doorli Enterprise OS).
 *
 * All settings are read once and validated so a misconfigured node fails loudly
 * instead of silently pointing every vendor at the wrong backend.
 */

export type ErpProvider = 'simple' | 'enterprise';

export interface ErpOrderItem {
  productId: string;
  /** Optional stock-keeping unit; preferred for stable cross-system identity. */
  sku?: string;
  name?: string;
  quantity: number;
  price: number;
}

export interface SyncOrderInput {
  provider: ErpProvider;
  /** Marketplace vendor id — half of the stable product identity. */
  vendorId: string;
  /** Remote tenant/company identifier stored on the vendor. */
  erpTenantId: string;
  items: ErpOrderItem[];
  customerInfo?: { name?: string; phone?: string };
  totalAmount: number;
  /** Marketplace order id — also used as the idempotency key. */
  marketplaceOrderId: string;
  marketplaceOrderNumber?: string;
}

export interface SyncOrderResult {
  success: boolean;
  erpOrderId?: string;
  message?: string;
  /** HTTP status from the ERP (when reachable), for logging/telemetry. */
  status?: number;
}

export interface ProvisionVendorInput {
  vendorId: string;
  businessName: string;
  adminEmail?: string;
  phone?: string;
  currency?: string;
}

export interface ProvisionVendorResult {
  success: boolean;
  companyId?: string;
  message?: string;
  status?: number;
}

export interface PushOrderStatusInput {
  provider: ErpProvider;
  erpTenantId: string;
  erpOrderId?: string | null;
  marketplaceOrderId: string;
  status: string;
}

const REQUEST_TIMEOUT_MS = 8000;

/** Shared secret used for both embedded and Enterprise auth. Never defaulted in prod. */
function erpSecret(): string {
  if (!process.env.ERP_INTERNAL_SECRET) {
    throw new Error('ERP_INTERNAL_SECRET environment variable is required');
  }
  return process.env.ERP_INTERNAL_SECRET.replace(/^Bearer\s+/i, '');
}

/** Embedded Retail Smart ERP internal base, e.g. http://host/erp/api/internal */
function embeddedBaseUrl(): string {
  return (
    process.env.ERP_EMBEDDED_URL ||
    process.env.ERP_API_URL ||
    process.env.ERP_SERVICE_URL ||
    'http://127.0.0.1:3010/api/internal'
  ).replace(/\/$/, '');
}

/** Enterprise Frappe create_order method URL. */
function enterpriseCreateOrderUrl(): string | null {
  const url = process.env.ERP_ENTERPRISE_URL || '';
  return url ? url.replace(/\/$/, '') : null;
}

/** Enterprise Frappe provision_vendor method URL (derived from create_order if unset). */
function enterpriseProvisionUrl(): string | null {
  if (process.env.ERP_ENTERPRISE_PROVISION_URL) {
    return process.env.ERP_ENTERPRISE_PROVISION_URL.replace(/\/$/, '');
  }
  const create = enterpriseCreateOrderUrl();
  if (!create) return null;
  return create.replace(/create_order$/, 'provision_vendor');
}

/** Stable product identity across systems: vendor-scoped SKU (fallback productId). */
function productRef(vendorId: string, item: ErpOrderItem): string {
  return `${vendorId}:${item.sku || item.productId}`;
}

export class ErpIntegrationService {
  /**
   * Sync a marketplace/POS order to the vendor's ERP.
   * Routing is decided by the caller-provided `provider`, not by sniffing a URL.
   */
  static async syncOrderToErp(input: SyncOrderInput): Promise<SyncOrderResult> {
    if (!input.marketplaceOrderId) {
      return { success: false, message: 'marketplaceOrderId is required for idempotency' };
    }
    try {
      if (input.provider === 'enterprise') {
        return await syncToEnterpriseOs(input);
      }
      return await syncToEmbeddedErp(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ERP unreachable';
      console.error(`[ERP] sync failed (${input.provider}):`, message);
      return { success: false, message: 'ERP unreachable' };
    }
  }

  /**
   * Provision an isolated Frappe Company for an Enterprise vendor.
   * Returns the canonical Company name to persist as the vendor's erpTenantId.
   */
  static async provisionEnterpriseVendor(
    input: ProvisionVendorInput,
  ): Promise<ProvisionVendorResult> {
    const url = enterpriseProvisionUrl();
    if (!url) {
      return { success: false, message: 'ERP_ENTERPRISE_URL is not configured' };
    }

    try {
      const response = await axios.post(
        url,
        {
          vendor_id: input.vendorId,
          business_name: input.businessName,
          admin_email: input.adminEmail || '',
          phone: input.phone || '',
          currency: input.currency || 'LKR',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            // Custom header: Frappe reserves Authorization for its own token/OAuth auth.
            'X-Doorli-Secret': erpSecret(),
          },
          timeout: REQUEST_TIMEOUT_MS,
          validateStatus: () => true,
        },
      );

      const payload = response.data?.message ?? response.data;
      if (response.status >= 400 || payload?.status === 'error') {
        const message = payload?.message || `Provisioning failed (${response.status})`;
        console.error('[ERP] provision rejected:', response.status, payload);
        return { success: false, message, status: response.status };
      }

      const companyId = payload?.company || payload?.company_name || payload?.erp_tenant_id;
      if (!companyId) {
        return { success: false, message: 'Provisioning returned no Company id', status: response.status };
      }
      return { success: true, companyId: String(companyId), status: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ERP unreachable';
      console.error('[ERP] provision error:', message);
      return { success: false, message: 'Enterprise ERP unreachable' };
    }
  }

  /**
   * Report a marketplace status change back to the vendor's ERP (Req 11.6),
   * e.g. delivery completion for ERP-origin dispatch orders. Best-effort:
   * callers must treat failures as non-fatal.
   */
  static async pushOrderStatusToErp(input: PushOrderStatusInput): Promise<SyncOrderResult> {
    try {
      if (input.provider === 'enterprise') {
        const create = enterpriseCreateOrderUrl();
        if (!create) return { success: false, message: 'ERP_ENTERPRISE_URL is not configured' };
        const url = create.replace(/create_order$/, 'update_order_status');
        const response = await axios.post(
          url,
          {
            company: input.erpTenantId,
            erp_order_id: input.erpOrderId || undefined,
            marketplace_order_id: input.marketplaceOrderId,
            status: input.status,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // Custom header: Frappe reserves Authorization for its own token/OAuth auth.
              'X-Doorli-Secret': erpSecret(),
            },
            timeout: REQUEST_TIMEOUT_MS,
            validateStatus: () => true,
          },
        );
        const payload = response.data?.message ?? response.data;
        if (response.status >= 400 || payload?.status === 'error') {
          console.error('[ERP] enterprise status push rejected:', response.status, payload);
          return {
            success: false,
            message: payload?.message || `Enterprise ERP rejected (${response.status})`,
            status: response.status,
          };
        }
        return { success: true, status: response.status };
      }

      const response = await axios.post(
        `${embeddedBaseUrl()}/order-status`,
        {
          tenantId: input.erpTenantId,
          erpOrderId: input.erpOrderId || undefined,
          marketplaceOrderId: input.marketplaceOrderId,
          status: input.status,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': erpSecret(),
          },
          timeout: REQUEST_TIMEOUT_MS,
          validateStatus: () => true,
        },
      );
      if (response.status >= 400 || response.data?.success === false) {
        console.error('[ERP] embedded status push rejected:', response.status, response.data);
        return {
          success: false,
          message: response.data?.error || `Embedded ERP rejected (${response.status})`,
          status: response.status,
        };
      }
      return { success: true, status: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ERP unreachable';
      console.error(`[ERP] status push failed (${input.provider}):`, message);
      return { success: false, message: 'ERP unreachable' };
    }
  }

  /**
   * Inventory lookup — calls the appropriate ERP stock API.
   *
   * Simple (embedded): GET ${embeddedBaseUrl()}/inventory?tenantId=${tenantId}&productId=${productId}
   * Enterprise (Frappe): GET ${erpUrl}/api/resource/Stock%20Ledger%20Entry with Bearer token auth.
   */
  static async getInventoryFromErp(
    erpTenantId: string,
    productId: string,
    warehouseId?: string,
  ): Promise<{
    quantity?: number;
    stock?: number;
    onHand?: number;
    data?: { quantity?: number };
    items?: Array<{ barcode?: string; sku?: string; quantity?: number }>;
  }> {
    const enterpriseUrl = enterpriseCreateOrderUrl();

    if (enterpriseUrl) {
      return getInventoryFromEnterprise(erpTenantId, productId, warehouseId);
    }
    return getInventoryFromEmbedded(erpTenantId, productId);
  }
}

async function getInventoryFromEmbedded(
  tenantId: string,
  productId: string,
): Promise<{
  quantity?: number;
  stock?: number;
  onHand?: number;
  data?: { quantity?: number };
  items?: Array<{ barcode?: string; sku?: string; quantity?: number }>;
}> {
  const url = `${embeddedBaseUrl()}/inventory?tenantId=${encodeURIComponent(tenantId)}&productId=${encodeURIComponent(productId)}`;

  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': erpSecret(),
    },
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
  });

  if (response.status >= 400 || response.data?.success === false) {
    console.error('[ERP] embedded inventory lookup failed:', response.status, response.data);
    throw new Error(response.data?.error || `Embedded ERP inventory lookup failed (${response.status})`);
  }

  const stock = Number(response.data?.stock ?? 0);
  return { quantity: stock, stock, onHand: stock };
}

async function getInventoryFromEnterprise(
  _erpTenantId: string,
  productId: string,
  warehouseId?: string,
): Promise<{
  quantity?: number;
  stock?: number;
  onHand?: number;
  data?: { quantity?: number };
  items?: Array<{ barcode?: string; sku?: string; quantity?: number }>;
}> {
  const enterpriseUrl = enterpriseCreateOrderUrl();
  if (!enterpriseUrl) {
    throw new Error('ERP_ENTERPRISE_URL is not configured');
  }

  const erpUrl = new URL(enterpriseUrl).origin;

  const params = new URLSearchParams({
    company: _erpTenantId,
    item_code: productId,
    ...(warehouseId ? { warehouse: warehouseId } : {}),
  });

  const response = await axios.get(
    `${erpUrl}/api/method/doorli_core.api.get_inventory?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Doorli-Secret': erpSecret(),
      },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    },
  );

  if (response.status >= 400) {
    console.error('[ERP] enterprise inventory lookup failed:', response.status, response.data);
    throw new Error(`Enterprise ERP inventory lookup failed (${response.status})`);
  }

  if (response.data?.message?.status === 'error') {
    throw new Error(response.data.message.message || 'Enterprise inventory lookup failed');
  }
  const entries = response.data?.message?.data || response.data?.data || [];
  const totalQty = entries.reduce(
    (sum: number, entry: { actual_qty?: number }) => sum + Number(entry.actual_qty || 0),
    0,
  );

  return { quantity: totalQty, stock: totalQty, onHand: totalQty };
}

async function syncToEmbeddedErp(input: SyncOrderInput): Promise<SyncOrderResult> {
  const base = embeddedBaseUrl();
  const endpoint = base.endsWith('/orders') ? base : `${base}/orders`;

  const response = await axios.post(
    endpoint,
    {
      tenantId: input.erpTenantId,
      idempotencyKey: input.marketplaceOrderId,
      marketplaceOrderId: input.marketplaceOrderId,
      marketplaceOrderNumber: input.marketplaceOrderNumber,
      items: input.items.map((item) => ({
        productId: item.productId,
        productRef: productRef(input.vendorId, item),
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      customerInfo: input.customerInfo,
      totalAmount: input.totalAmount,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': erpSecret(),
        'Idempotency-Key': input.marketplaceOrderId,
      },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    },
  );

  if (response.status >= 400 || response.data?.success === false) {
    console.error('[ERP] embedded sync rejected:', response.status, response.data);
    return {
      success: false,
      message: response.data?.error || `Embedded ERP rejected (${response.status})`,
      status: response.status,
    };
  }

  return {
    success: true,
    erpOrderId: response.data?.invoiceNo || response.data?.id,
    message: 'Synced to embedded ERP',
    status: response.status,
  };
}

async function syncToEnterpriseOs(input: SyncOrderInput): Promise<SyncOrderResult> {
  const url = enterpriseCreateOrderUrl();
  if (!url) {
    return { success: false, message: 'ERP_ENTERPRISE_URL is not configured' };
  }

  const frappePayload = {
    idempotency_key: input.marketplaceOrderId,
    marketplace_order_id: input.marketplaceOrderId,
    marketplace_order_number: input.marketplaceOrderNumber,
    company: input.erpTenantId,
    vendor_id: input.vendorId,
    customer_name: input.customerInfo?.name || 'Walk-in Customer',
    customer_phone: input.customerInfo?.phone || '',
    total_amount: input.totalAmount,
    items: input.items.map((item) => ({
      item_code: productRef(input.vendorId, item),
      item_name: item.name || item.productId,
      qty: item.quantity,
      price: item.price,
    })),
  };

  const response = await axios.post(url, frappePayload, {
    headers: {
      'Content-Type': 'application/json',
      // Custom header: Frappe reserves Authorization for its own token/OAuth auth.
      'X-Doorli-Secret': erpSecret(),
      'Idempotency-Key': input.marketplaceOrderId,
    },
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
  });

  const payload = response.data?.message ?? response.data;
  if (response.status >= 400 || payload?.status === 'error') {
    console.error('[ERP] enterprise sync rejected:', response.status, payload);
    return {
      success: false,
      message: payload?.message || `Enterprise ERP rejected (${response.status})`,
      status: response.status,
    };
  }

  return {
    success: true,
    erpOrderId: payload?.erp_order_id || payload?.sales_order,
    message: 'Injected into Enterprise OS',
    status: response.status,
  };
}
