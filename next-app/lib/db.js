import { Pool } from '@neondatabase/serverless';

let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}
pool = global._pgPool;

export default pool;
