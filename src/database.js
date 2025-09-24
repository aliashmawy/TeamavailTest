const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'teamavail',
  user: process.env.DB_USER || 'teamavail',
  password: process.env.DB_PASSWORD || 'teamavail_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database table
const initDatabase = async () => {
  try {
    const client = await pool.connect();

    // Create history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Save history data to database
const saveHistory = async (data) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO history (data) VALUES ($1) RETURNING id',
      [JSON.stringify(data)]
    );
    client.release();
    return result.rows[0].id;
  } catch (err) {
    console.error('Error saving to database:', err);
    throw err;
  }
};

// Get history data from database
const getHistory = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM history ORDER BY created_at DESC'
    );
    client.release();
    return result.rows;
  } catch (err) {
    console.error('Error getting history from database:', err);
    throw err;
  }
};

module.exports = {
  pool,
  initDatabase,
  saveHistory,
  getHistory,
};
