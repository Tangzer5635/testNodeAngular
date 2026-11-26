import pool from "../config/db.js";

const SELECT_VETEMENTS = "SELECT v.id, v.nom, v.prix::Float, v.description, v.image, v.tailles, c.nom AS categorie FROM vetements v JOIN categories c ON v.categorie_id = c.id";
export const TRIS = {
  recent: 'v.id DESC',
  prix_asc: 'v.prix ASC',
  prix_desc: 'v.prix DESC',
  nom: 'v.nom ASC',
};

export const findAll = async ({ categorie, recherche, tri = 'recent' } = {}) => {
  const conditions = [];
  const valeurs = [];

  if (categorie) {
    valeurs.push(categorie);
    conditions.push(`c.nom = $${valeurs.length}`);
  }

  if (recherche) {
    valeurs.push(`%${recherche}%`);
    const n = valeurs.length;
    conditions.push(`(v.nom ILIKE $${n} OR v.description ILIKE $${n})`);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const query = `${SELECT_VETEMENTS}${where} ORDER BY ${TRIS[tri]}`;

  const result = await pool.query(query, valeurs);
  return result.rows;
};

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
