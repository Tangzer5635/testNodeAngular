import pool from '../config/db.js';

export const findByEmail = async (email) => {
  const result = await pool.query(
    'SELECT id, email, nom, role, mot_de_passe_hash FROM utilisateurs WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

export const create = async ({ email, nom, motDePasseHash }) => {
  const result = await pool.query(
    `INSERT INTO utilisateurs (email, nom, mot_de_passe_hash, role)
     VALUES ($1, $2, $3, 'client')
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, nom, role`,
    [email, nom, motDePasseHash]
  );
  return result.rows[0];
};
