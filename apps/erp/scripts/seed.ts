import { db } from '../src/lib/db/index';
import { tenants } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const TEST_TENANT_ID = '11111111-1111-4111-a111-111111111111';

  const existing = await db.select().from(tenants).where(eq(tenants.id, TEST_TENANT_ID));
  
  if (existing.length === 0) {
    console.log(`[ERP Seed] Creating test tenant...`);
    await db.insert(tenants).values({
      id: TEST_TENANT_ID,
      name: 'Doorli Demo Tenant',
      slug: 'doorli-demo-tenant',
      email: 'demo@doorli.com',
      industry: 'retail',
      country: 'LK',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
    });
    console.log(`[ERP Seed] Created Doorli Demo Tenant!`);
  } else {
    console.log(`[ERP Seed] Tenant already exists, skipping.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[ERP Seed] Error seeding database:', err);
  process.exit(1);
});
