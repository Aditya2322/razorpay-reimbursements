require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const CFO_EMAIL = 'cfo@org.com';
const CFO_PASSWORD = 'CFO#ORG@April2026';
const CFO_NAME = 'CFO';

async function seedCFO() {
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [CFO_EMAIL]
    );

    if (rows.length > 0) {
      console.log('ℹ️  CFO account already exists — skipping seed.');
      return;
    }

    const passwordHash = await bcrypt.hash(CFO_PASSWORD, 10);

    await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'CFO')`,
      [CFO_NAME, CFO_EMAIL, passwordHash]
    );

    console.log('✅ CFO account seeded successfully.');
  } catch (err) {
    console.error('❌ CFO seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedCFO();
