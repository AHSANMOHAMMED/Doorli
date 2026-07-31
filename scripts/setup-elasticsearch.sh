#!/bin/bash
# Doorli Elasticsearch Index Setup Script
# Creates and seeds required Elasticsearch indices before first use.

set -euo pipefail

ES_URL="${ES_URL:-http://localhost:9200}"
INDEX_NAME="products"

echo "[es-setup] Connecting to Elasticsearch at ${ES_URL}"

# Check if Elasticsearch is reachable
if ! curl -s "${ES_URL}" > /dev/null 2>&1; then
  echo "[es-setup] ERROR: Cannot reach Elasticsearch at ${ES_URL}"
  exit 1
fi

# Create index with mappings if it doesn't exist
if ! curl -s "${ES_URL}/${INDEX_NAME}" > /dev/null 2>&1; then
  echo "[es-setup] Creating index '${INDEX_NAME}'..."
  curl -s -X PUT "${ES_URL}/${INDEX_NAME}" \
    -H 'Content-Type: application/json' \
    -d '{
      "mappings": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" },
          "description": { "type": "text" },
          "price": { "type": "double" },
          "vendorId": { "type": "keyword" },
          "vendorName": { "type": "text" },
          "image_url": { "type": "keyword" },
          "category": { "type": "keyword" },
          "isAvailable": { "type": "boolean" }
        }
      }
    }' > /dev/null
  echo "[es-setup] Index '${INDEX_NAME}' created successfully"
else
  echo "[es-setup] Index '${INDEX_NAME}' already exists, skipping creation"
fi

echo "[es-setup] Triggering initial sync via API..."
curl -s -X POST "${ES_URL}/${INDEX_NAME}/_refresh" > /dev/null
echo "[es-setup] Elasticsearch setup complete"