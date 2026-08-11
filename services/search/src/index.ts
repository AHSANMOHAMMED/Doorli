import express, { Request, Response } from 'express';
import cors from 'cors';
import { Client } from '@elastic/elasticsearch';
import { prisma } from '@doorli/db';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4004;
const ES_URL = process.env.ES_URL || 'http://localhost:9200';

const esClient = new Client({
  node: ES_URL,
  requestTimeout: 2000,
  maxRetries: 1,
  // Since we disabled security for local dev, we don't need auth here
});

const INDEX_NAME = 'products';

function isEsUnavailable(err: unknown): boolean {
  const e = err as { name?: string; code?: string; warnings?: unknown; statusCode?: number };
  return (
    e?.name === 'ConnectionError' ||
    e?.code === 'ECONNREFUSED' ||
    e?.code === 'ECONNRESET' ||
    (e?.warnings != null && e?.statusCode == null)
  );
}

app.get('/health', async (_req, res) => {
  let es = false;
  try {
    es = await esClient.ping();
  } catch {
    es = false;
  }
  res.json({ status: 'ok', service: 'search', es });
});

/**
 * Postgres-backed fallback for product search when Elasticsearch is
 * unreachable. Returns the same document shape ES produces so consumers are
 * agnostic to which backend served the query.
 */
async function dbSearchProducts(q: string, limit = 20) {
  const listingSets = await getMarketplaceListingSets();
  const rows = await prisma.product.findMany({
    where: {
      isAvailable: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { vendor: { businessName: { contains: q, mode: 'insensitive' as const } } },
      ],
    },
    include: { vendor: { select: { businessName: true } } },
    orderBy: { price: 'asc' as const },
    take: limit,
  });
  return rows
    .filter((p: { vendorId: string }) => isVendorListed(p.vendorId, listingSets))
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      vendorId: p.vendorId,
      vendorName: p.vendor.businessName,
      image_url: p.imageUrl,
    }));
}

/**
 * Vendors whose products may appear in search (Req 11.3/11.8):
 * `marketplace_listing` resolved as explicit VendorFeature override > isGlobal default.
 * Returns null when the flag doesn't exist yet (unseeded DB) → no filtering.
 */
async function getMarketplaceListingSets(): Promise<{
  isGlobal: boolean;
  enabledIds: Set<string>;
  disabledIds: Set<string>;
} | null> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: 'marketplace_listing' } });
  if (!flag) return null;
  const overrides = await prisma.vendorFeature.findMany({
    where: { featureId: flag.id },
    select: { vendorId: true, isEnabled: true },
  });
  const enabledIds = new Set<string>();
  const disabledIds = new Set<string>();
  for (const o of overrides) {
    (o.isEnabled ? enabledIds : disabledIds).add(o.vendorId);
  }
  return { isGlobal: flag.isGlobal, enabledIds, disabledIds };
}

function isVendorListed(
  vendorId: string,
  sets: { isGlobal: boolean; enabledIds: Set<string>; disabledIds: Set<string> } | null,
): boolean {
  if (!sets) return true;
  if (sets.disabledIds.has(vendorId)) return false;
  if (sets.enabledIds.has(vendorId)) return true;
  return sets.isGlobal;
}

async function ensureIndex(): Promise<void> {
  const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
  if (!indexExists) {
    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            description: { type: 'text' },
            price: { type: 'double' },
            vendorId: { type: 'keyword' },
            vendorName: { type: 'text' },
          }
        }
      }
    });
  }
}

type IndexableProduct = {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  vendorId: string;
  imageUrl: string | null;
  vendor: { businessName: string };
};

function toBulkOperations(products: IndexableProduct[]) {
  return products.flatMap((doc) => [
    { index: { _index: INDEX_NAME, _id: doc.id } },
    {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      price: Number(doc.price),
      vendorId: doc.vendorId,
      vendorName: doc.vendor.businessName,
      image_url: doc.imageUrl
    }
  ]);
}

// Endpoint to sync Postgres products to Elasticsearch
app.post('/api/search/sync', async (_req: Request, res: Response): Promise<any> => {
  try {
    const [allProducts, listingSets] = await Promise.all([
      prisma.product.findMany({
        where: {
          isAvailable: true,
        },
        include: {
          vendor: {
            select: { businessName: true }
          }
        }
      }),
      getMarketplaceListingSets(),
    ]);

    // Only index products of vendors with marketplace_listing enabled (Req 11.8)
    const products = allProducts.filter((p: IndexableProduct) =>
      isVendorListed(p.vendorId, listingSets),
    );
    const delistedVendorIds = [
      ...new Set(
        allProducts
          .filter((p: IndexableProduct) => !isVendorListed(p.vendorId, listingSets))
          .map((p: IndexableProduct) => p.vendorId),
      ),
    ];

    if (products.length === 0 && delistedVendorIds.length === 0) {
      return res.status(200).json({ message: 'No products to sync' });
    }

    await ensureIndex();

    // Purge documents of delisted vendors so full re-syncs also remove them
    if (delistedVendorIds.length > 0) {
      await esClient.deleteByQuery({
        index: INDEX_NAME,
        refresh: true,
        body: { query: { terms: { vendorId: delistedVendorIds } } },
      }).catch(() => undefined);
    }

    if (products.length === 0) {
      return res.status(200).json({ message: 'No listed products to sync', count: 0 });
    }

    const operations = toBulkOperations(products);

    const bulkResponse = await esClient.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
      console.error("Bulk indexing errors:", bulkResponse.items);
      return res.status(500).json({ message: 'Error syncing some products' });
    }

    res.status(200).json({
      message: 'Successfully synced products to Elasticsearch',
      count: products.length
    });
  } catch (error) {
    console.error('Failed to sync products:', error);
    if (isEsUnavailable(error)) {
      return res.status(503).json({ message: 'Search unavailable: Elasticsearch is not reachable' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Per-vendor index side-effect for the marketplace_listing toggle (Req 11.8):
 * enabled → (re)index the vendor's available products;
 * disabled → remove all of the vendor's documents from the index.
 */
app.post('/api/search/vendor-sync', async (req: Request, res: Response): Promise<any> => {
  try {
    const { vendorId, enabled } = req.body ?? {};
    if (!vendorId || typeof vendorId !== 'string' || typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'vendorId (string) and enabled (boolean) are required' });
    }

    if (!enabled) {
      try {
        await esClient.deleteByQuery({
          index: INDEX_NAME,
          refresh: true,
          body: { query: { term: { vendorId } } },
        });
      } catch (error: any) {
        if (error.meta?.body?.error?.type !== 'index_not_found_exception') throw error;
      }
      return res.status(200).json({ message: 'Vendor removed from search index', vendorId });
    }

    const products = await prisma.product.findMany({
      where: { vendorId, isAvailable: true },
      include: { vendor: { select: { businessName: true } } },
    });

    await ensureIndex();

    if (products.length === 0) {
      return res.status(200).json({ message: 'Vendor has no products to index', vendorId, count: 0 });
    }

    const bulkResponse = await esClient.bulk({
      refresh: true,
      operations: toBulkOperations(products),
    });
    if (bulkResponse.errors) {
      console.error('Vendor bulk indexing errors:', bulkResponse.items);
      return res.status(500).json({ message: 'Error indexing some products' });
    }

    res.status(200).json({ message: 'Vendor indexed', vendorId, count: products.length });
  } catch (error) {
    console.error('Failed to vendor-sync:', error);
    if (isEsUnavailable(error)) {
      return res.status(503).json({ message: 'Search unavailable: Elasticsearch is not reachable' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Full-text search endpoint
app.get('/api/search/products', async (req: Request, res: Response): Promise<any> => {
  const rawQ = req.query.q;
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const result = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['name^3', 'description', 'vendorName'],
            fuzziness: 'AUTO'
          }
        }
      }
    });

    const hits = result.hits.hits.map((hit: { _source?: unknown }) => hit._source);
    
    res.status(200).json({
      results: hits,
      total: result.hits.total
    });
  } catch (error: any) {
    // If the index is missing, return empty instead of 500
    if (error.meta?.body?.error?.type === 'index_not_found_exception') {
      return res.status(200).json({ results: [], total: { value: 0 } });
    }
    // Elasticsearch unreachable → degrade to Postgres-backed search so the
    // marketplace keeps working without the dedicated search cluster.
    if (isEsUnavailable(error)) {
      const docs = await dbSearchProducts(String(rawQ)).catch(() => []);
      return res.status(200).json({ results: docs, total: { value: docs.length } });
    }
    console.error('Failed to search products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`[Search Service] running on port ${PORT}`);
  console.log(`[Search Service] connected to Elasticsearch at ${ES_URL}`);
  void import('./events-consumer.js').then((m) => m.startSearchEventConsumer()).catch(() => undefined);
});
