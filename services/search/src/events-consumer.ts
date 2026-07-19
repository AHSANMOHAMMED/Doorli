import { Kafka, logLevel } from 'kafkajs';

/**
 * Optional Kafka consumer: on product.changed → re-sync Elasticsearch.
 * Safe no-op if Kafka is down.
 */
export async function startSearchEventConsumer() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const topic = process.env.KAFKA_TOPIC || 'doorli.events';
  const searchUrl = process.env.SEARCH_SELF_URL || `http://127.0.0.1:${process.env.PORT || 4004}`;

  try {
    const kafka = new Kafka({
      clientId: 'doorli-search',
      brokers,
      logLevel: logLevel.ERROR,
      connectionTimeout: 3000,
    });
    const consumer = kafka.consumer({ groupId: 'doorli-search-indexer' });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log(`[search] Kafka consumer subscribed to ${topic}`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const event = JSON.parse(message.value.toString());
          if (event.type === 'product.changed') {
            await fetch(`${searchUrl}/api/search/sync`, { method: 'POST' });
            console.log('[search] reindexed after product.changed');
          }
        } catch (err) {
          console.warn('[search] event handle failed', (err as Error).message);
        }
      },
    });
  } catch (err) {
    console.warn('[search] Kafka consumer not started:', (err as Error).message);
  }
}
