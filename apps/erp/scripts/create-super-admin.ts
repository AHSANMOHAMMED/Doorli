import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

async function createSuperAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Creating super admin...');

  try {
    const passwordHash = await bcrypt.hash('Gaje@7616', 10);

    const result = await pool.query(`
      INSERT INTO super_admins (email, password_hash, full_name, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_active = true,
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
      RETURNING id
    `, ['ravindu2012@hotmail.com', passwordHash, 'Super Admin']);

    if (result.rowCount && result.rowCount > 0) {
      console.log('Super admin ready!');
      console.log('Email: ravindu2012@hotmail.com');
      console.log('Password: Gaje@7616');
      console.log('Login URL: http://localhost:3010/sys-control/login');
    } else {
      console.log('Super admin already exists, skipping.');
    }
  } finally {
    await pool.end();
  }
}

createSuperAdmin().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
