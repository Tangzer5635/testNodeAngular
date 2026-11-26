import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export default pool;

export const transaction = async (travail) => {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const resultat = await travail(db);
    await db.query('COMMIT');
    return resultat;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
};
