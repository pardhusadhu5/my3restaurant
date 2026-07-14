const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for secure serverless connections on Neon
    }
  });
} else if (process.env.NODE_ENV === 'production') {
  console.error('CRITICAL ERROR: DATABASE_URL environment variable is missing in production.');
  process.exit(1);
} else {
  console.warn('DATABASE_URL is missing. Running in local development mock database mode.');
}

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle Neon PostgreSQL client:', err.message);
  });
}

module.exports = pool;
