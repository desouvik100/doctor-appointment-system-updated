
const { Pool } = require('pg');
let pool = null;

const createPool = () => {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'doctor_appointment_system',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
      max: 20, 
      idleTimeoutMillis: 30000, 
      connectionTimeoutMillis: 2000, 
    });
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });

    console.log('✅ PostgreSQL connection pool created');
  }
  return pool;
};

const connectDB = async () => {
  try {
    const dbPool = createPool();
    const client = await dbPool.connect(); 
    console.log('✅ PostgreSQL connected successfully');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database test query successful:', result.rows[0].now);
    
    client.release();
    return dbPool;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    console.error('Make sure PostgreSQL is running and credentials are correct');
  }
};

const getPool = () => {
  if (!pool) {
   throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

const closePool = async () => {
  if (pool) { 
    await pool.end();
    pool = null;
    console.log('✅ PostgreSQL connection pool closed');
  }
};

module.exports = {
  connectDB,
  getPool,
  closePool
};