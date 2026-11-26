import pool from '../config/db.js';

export const findAll = async () => {
    const result = await pool.query('SELECT nom FROM categories ORDER BY nom');
    return result.rows.map(row => row.nom);
};