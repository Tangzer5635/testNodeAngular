import pool from "../config/db.js";

export const findByEmail = async (email) => {
    const result = await pool.query("SELECT id, email, mot_de_passe_hash FROM utilisateurs WHERE email = $1", [email]);
    if (result.rows.length === 0) { 
        return undefined;
    }
    return result.rows[0];
}