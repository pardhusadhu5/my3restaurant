const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Required for secure serverless connections on Neon
      }
    });
    console.log('Neon PostgreSQL client pool initialized successfully.');
  } catch (error) {
    console.error('Error creating Neon PostgreSQL client pool:', error.message);
  }
} else {
  console.log('Neon DATABASE_URL missing in environment configurations.');
}

module.exports = pool;
