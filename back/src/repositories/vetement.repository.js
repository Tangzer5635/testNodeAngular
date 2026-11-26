import pool from "../config/db.js";

const findAllVetements = ("SELECT v.id, v.nom, v.prix::Float, v.description, v.image, v.tailles, c.nom AS categorie FROM vetements v JOIN categories c ON v.categorie_id = c.id");

export const findAll = async () => {
    const result = await pool.query(findAllVetements+" ORDER BY v.id");
    return result.rows;
};

export const findAllByCategorie = async (categorie) => {
    const result = await pool.query(findAllVetements+" WHERE c.nom = $1 ORDER BY v.id", [categorie]);
    return result.rows;
}

export const findById = async (id) => {
    const result = await pool.query(findAllVetements+" WHERE v.id = $1", [id]);
    return result.rows[0];
}
