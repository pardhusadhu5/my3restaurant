const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL ERROR: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for secure serverless connections on Neon
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Neon PostgreSQL client:', err.message);
});

module.exports = pool;
