import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

const [, , email, motDePasse] = process.argv;

if (!email || !motDePasse) {
  console.error('Utilisation : npm run creer-admin -- <email> <mot de passe>');
  process.exit(1);
}

const hash = await bcrypt.hash(motDePasse, 10);

await pool.query(
  `INSERT INTO utilisateurs (email, mot_de_passe_hash)
   VALUES ($1, $2)
   ON CONFLICT (email) DO UPDATE SET mot_de_passe_hash = EXCLUDED.mot_de_passe_hash`,
  [email, hash]
);

console.log(`Administrateur enregistré : ${email}`);
await pool.end();