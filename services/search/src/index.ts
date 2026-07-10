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
  // Since we disabled security for local dev, we don't need auth here
});

const INDEX_NAME = 'products';

// Endpoint to sync Postgres products to Elasticsearch
app.post('/api/search/sync', async (req: Request, res: Response): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
      },
      include: {
        vendor: {
          select: { name: true }
        }
      }
    });

    if (products.length === 0) {
      return res.status(200).json({ message: 'No products to sync' });
    }

    // Check if index exists, if not create it
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

    // Prepare bulk operations
    const operations = products.flatMap(doc => [
      { index: { _index: INDEX_NAME, _id: doc.id } },
      {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        price: Number(doc.price),
        vendorId: doc.vendorId,
        vendorName: doc.vendor.name,
        image_url: doc.imageUrl
      }
    ]);

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
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Full-text search endpoint
app.get('/api/search/products', async (req: Request, res: Response): Promise<any> => {
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

    const hits = result.hits.hits.map(hit => hit._source);
    
    res.status(200).json({
      results: hits,
      total: result.hits.total
    });
  } catch (error: any) {
    // If the index is missing, return empty instead of 500
    if (error.meta?.body?.error?.type === 'index_not_found_exception') {
      return res.status(200).json({ results: [], total: { value: 0 } });
    }
    console.error('Failed to search products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`[Search Service] running on port ${PORT}`);
  console.log(`[Search Service] connected to Elasticsearch at ${ES_URL}`);
});
