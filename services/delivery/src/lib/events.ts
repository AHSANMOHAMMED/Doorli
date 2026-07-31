import { Kafka, type Producer, logLevel } from 'kafkajs';

export type DomainEvent =
  | { type: 'order.created'; orderId: string; vendorId: string; customerId: string; totalAmount: number }
  | { type: 'order.status_changed'; orderId: string; status: string; customerId: string; vendorId: string }
  | { type: 'order.paid'; orderId: string; vendorId: string; erpTenantId?: string | null }
  | { type: 'product.changed'; productId: string; vendorId: string; action: 'created' | 'updated' | 'deleted' }
  | { type: 'payment.paid'; paymentId: string; referenceId: string; referenceType: string }
  | { type: 'ride.status_changed'; rideId: string; status: string; customerId: string };

const TOPIC = process.env.KAFKA_TOPIC || 'doorli.events';
const BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

let producer: Producer | null = null;
let initPromise: Promise<Producer | null> | null = null;

async function getProducer(): Promise<Producer | null> {
  if (producer) return producer;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const kafka = new Kafka({
        clientId: 'doorli-api',
        brokers: BROKERS,
        logLevel: logLevel.ERROR,
        connectionTimeout: 3000,
        requestTimeout: 5000,
      });
      const p = kafka.producer();
      await p.connect();
      producer = p;
      console.log(`[events] Kafka producer connected → ${BROKERS.join(',')}`);
      return p;
    } catch (err) {
      console.warn('[events] Kafka unavailable — events will log only:', (err as Error).message);
      return null;
    }
  })();

  return initPromise;
}

export async function publishEvent(event: DomainEvent): Promise<void> {
  const payload = {
    ...event,
    occurredAt: new Date().toISOString(),
  };

  const p = await getProducer();
  if (!p) {
    console.log('[events:local]', JSON.stringify(payload));
    return;
  }

  try {
    await p.send({
      topic: TOPIC,
      messages: [
        {
          key: 'orderId' in event ? (event as { orderId?: string }).orderId : event.type,
          value: JSON.stringify(payload),
        },
      ],
    });
  } catch (err) {
    console.warn('[events] publish failed:', (err as Error).message);
    console.log('[events:local]', JSON.stringify(payload));
  }
}
