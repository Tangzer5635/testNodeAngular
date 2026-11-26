import pool from "../config/db.js";

const SELECT_VETEMENTS = "SELECT v.id, v.nom, v.prix::Float, v.description, v.image, v.tailles, c.nom AS categorie FROM vetements v JOIN categories c ON v.categorie_id = c.id";

export const findAll = async () => {
    const result = await pool.query(SELECT_VETEMENTS+" ORDER BY v.id");
    return result.rows;
};

export const findAllByCategorie = async (categorie) => {
    const result = await pool.query(SELECT_VETEMENTS+" WHERE c.nom = $1 ORDER BY v.id", [categorie]);
    return result.rows;
}

export const findById = async (id) => {
    const result = await pool.query(SELECT_VETEMENTS+" WHERE v.id = $1", [id]);
    return result.rows[0];
}

export const create = async (vetement) => {
    const { nom, prix, description, image, tailles, categorie} = vetement;
    const result = await pool.query(
        "INSERT INTO vetements (nom, prix, description, image, tailles, categorie_id) VALUES ($1, $2, $3, $4, $5, (SELECT id FROM categories WHERE nom = $6)) RETURNING id",
        [nom, prix, description, image, tailles, categorie]
    );
    return result.rows[0].id
}

export const update = async (id, vetement) => {
    const { nom, prix, description, image, tailles, categorie} = vetement;
    const result = await pool.query(
        "UPDATE vetements SET nom = $1, prix = $2, description = $3, image = $4, tailles = $5, categorie_id = (SELECT id FROM categories WHERE nom = $6) WHERE id = $7",
        [nom, prix, description, image, tailles, categorie, id]
    );
    return result.rowCount;
}

export const remove = async (id) => {
    const result = await pool.query("DELETE FROM vetements WHERE id = $1", [id]);
    return result.rowCount;
}
