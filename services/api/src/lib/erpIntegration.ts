import axios from 'axios';

// The base URL for the internal ERP API
// In production, this would point to the internal cluster DNS for the ERP service
const ERP_API_URL = process.env.ERP_API_URL || 'http://localhost:3000/api/internal';
const ERP_INTERNAL_SECRET = process.env.ERP_INTERNAL_SECRET || 'doorli_internal_secret_key_123';

const erpClient = axios.create({
  baseURL: ERP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-internal-secret': ERP_INTERNAL_SECRET,
  },
  timeout: 5000,
});

export class ErpIntegrationService {
  /**
   * Syncs a newly created marketplace order to the ERP system
   */
  static async syncOrderToErp(orderPayload: any) {
    try {
      const response = await erpClient.post('/orders', orderPayload);
      return response.data;
    } catch (error) {
      console.error('Failed to sync order to ERP:', error);
      throw new Error('ERP Sync Failed');
    }
  }

  /**
   * Fetches real-time inventory from the ERP for a given vendor
   */
  static async getInventoryFromErp(erpTenantId: string, productId: string) {
    try {
      const response = await erpClient.get(`/inventory/${erpTenantId}/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory from ERP:', error);
      throw new Error('ERP Inventory Fetch Failed');
    }
  }
}
