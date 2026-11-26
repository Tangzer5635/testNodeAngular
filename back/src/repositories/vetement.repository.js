import pool, { transaction } from '../config/db.js';

const SELECT_VETEMENTS = `
  SELECT v.id, v.nom, v.prix::float AS prix, v.description, v.image, c.nom AS categorie,
    COALESCE(
      (SELECT json_agg(json_build_object('taille', s.taille, 'stock', s.quantite) ORDER BY s.ordre)
       FROM stocks s WHERE s.vetement_id = v.id),
      '[]'
    ) AS tailles
  FROM vetements v
  JOIN categories c ON v.categorie_id = c.id`;

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
  const result = await pool.query(`${SELECT_VETEMENTS} WHERE v.id = $1`, [id]);
  return result.rows[0];
};

const enregistrerStocks = (db, vetementId, tailles) =>
  db.query(
    `INSERT INTO stocks (vetement_id, taille, quantite, ordre)
     SELECT $1, t.taille, t.quantite, t.ordre
     FROM unnest($2::text[], $3::int[]) WITH ORDINALITY AS t (taille, quantite, ordre)`,
    [vetementId, tailles.map(t => t.taille), tailles.map(t => t.stock)]
  );

export const create = (vetement) =>
  transaction(async (db) => {
    const { nom, prix, description, image, tailles, categorie } = vetement;
    const result = await db.query(
      `INSERT INTO vetements (nom, prix, description, image, categorie_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM categories WHERE nom = $5)) RETURNING id`,
      [nom, prix, description, image, categorie]
    );
    const id = result.rows[0].id;
    await enregistrerStocks(db, id, tailles);
    return id;
  });

export const update = (id, vetement) =>
  transaction(async (db) => {
    const { nom, prix, description, image, tailles, categorie } = vetement;
    const result = await db.query(
      `UPDATE vetements SET nom = $1, prix = $2, description = $3, image = $4,
         categorie_id = (SELECT id FROM categories WHERE nom = $5)
       WHERE id = $6`,
      [nom, prix, description, image, categorie, id]
    );
    if (result.rowCount === 0) {
      return 0;
    }
    await db.query('DELETE FROM stocks WHERE vetement_id = $1', [id]);
    await enregistrerStocks(db, id, tailles);
    return result.rowCount;
  });

export const remove = async (id) => {
  const result = await pool.query('DELETE FROM vetements WHERE id = $1', [id]);
  return result.rowCount;
};
