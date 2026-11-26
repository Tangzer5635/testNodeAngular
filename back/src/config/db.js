import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export default pool;

// Exécute plusieurs requêtes comme UN SEUL bloc (transaction) :
// soit tout est enregistré (COMMIT), soit rien du tout en cas d'erreur (ROLLBACK).
// « travail » reçoit la connexion à utiliser pour toutes ses requêtes.
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
    db.release(); // rend la connexion au pool
  }
};
