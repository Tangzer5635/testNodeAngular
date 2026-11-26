import pool from '../config/db.js';

const SELECT_COMMANDES = `
  SELECT c.id, c.utilisateur_id AS "utilisateurId", c.nom_client AS "nomClient", c.email, c.adresse, c.total::float AS total, c.statut,
    c.cree_le AS "creeLe",
    COALESCE(
      json_agg(json_build_object(
        'vetementId', l.vetement_id, 'nom', l.nom, 'taille', l.taille,
        'prixUnitaire', l.prix_unitaire::float, 'quantite', l.quantite
      ) ORDER BY l.id) FILTER (WHERE l.id IS NOT NULL),
      '[]'
    ) AS lignes
  FROM commandes c
  LEFT JOIN lignes_commande l ON l.commande_id = c.id`;

export const TRIS = {
  recent: 'c.id DESC',
  ancien: 'c.id ASC',
  montant_desc: 'c.total DESC, c.id DESC',
  montant_asc: 'c.total ASC, c.id DESC',
};

const filtrer = ({ statut, utilisateurId, recherche, du, au }) => {
  const conditions = [];
  const valeurs = [];
  const ajouter = (valeur) => {
    valeurs.push(valeur);
    return `$${valeurs.length}`;
  };
  if (statut) {
    conditions.push(`c.statut = ${ajouter(statut)}`);
  }
  if (utilisateurId) {
    conditions.push(`c.utilisateur_id = ${ajouter(utilisateurId)}`);
  }
  if (recherche) {
    const texte = ajouter(`%${recherche}%`);
    const criteres = [
      `c.nom_client ILIKE ${texte}`,
      `c.email ILIKE ${texte}`,
      `EXISTS (SELECT 1 FROM lignes_commande lr WHERE lr.commande_id = c.id AND lr.nom ILIKE ${texte})`,
    ];
    const numero = recherche.match(/^(?:n°|#)?\s*(\d{1,9})$/i);
    if (numero) {
      criteres.push(`c.id = ${ajouter(Number(numero[1]))}`);
    }
    conditions.push(`(${criteres.join(' OR ')})`);
  }
  if (du) {
    conditions.push(`c.cree_le >= ${ajouter(du)}::date`);
  }
  if (au) {
    conditions.push(`c.cree_le < ${ajouter(au)}::date + 1`);
  }
  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', valeurs };
};

export const findAll = async ({ limite, decalage = 0, tri = 'recent', ...filtres } = {}) => {
  const { where, valeurs } = filtrer(filtres);
  let pagination = '';
  if (limite) {
    valeurs.push(limite, decalage);
    pagination = `LIMIT $${valeurs.length - 1} OFFSET $${valeurs.length}`;
  }
  const result = await pool.query(
    `${SELECT_COMMANDES} ${where} GROUP BY c.id ORDER BY ${TRIS[tri]} ${pagination}`,
    valeurs
  );
  return result.rows;
};

export const compter = async (filtres = {}) => {
  const { where, valeurs } = filtrer(filtres);
  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM commandes c ${where}`, valeurs);
  return result.rows[0].total;
};

export const compterParStatut = async ({ statut, ...filtres } = {}) => {
  const { where, valeurs } = filtrer(filtres);
  const result = await pool.query(
    `SELECT c.statut, COUNT(*)::int AS nombre FROM commandes c ${where} GROUP BY c.statut`,
    valeurs
  );
  return result.rows;
};

export const findById = async (id, db = pool) => {
  const result = await db.query(`${SELECT_COMMANDES} WHERE c.id = $1 GROUP BY c.id`, [id]);
  return result.rows[0];
};

export const verrouillerStock = async (db, vetementId, taille) => {
  const result = await db.query(
    `SELECT v.nom, v.prix, s.quantite AS stock
     FROM stocks s JOIN vetements v ON v.id = s.vetement_id
     WHERE s.vetement_id = $1 AND s.taille = $2
     FOR UPDATE OF s`,
    [vetementId, taille]
  );
  return result.rows[0];
};

export const retirerDuStock = (db, vetementId, taille, quantite) =>
  db.query(
    'UPDATE stocks SET quantite = quantite - $3 WHERE vetement_id = $1 AND taille = $2',
    [vetementId, taille, quantite]
  );

export const create = async (db, client, lignes, utilisateurId) => {
  const commande = await db.query(
    'INSERT INTO commandes (utilisateur_id, nom_client, email, adresse) VALUES ($1, $2, $3, $4) RETURNING id',
    [utilisateurId, client.nom, client.email, client.adresse]
  );
  const id = commande.rows[0].id;

  await db.query(
    `INSERT INTO lignes_commande (commande_id, vetement_id, nom, taille, prix_unitaire, quantite)
     SELECT $1, l.vetement_id, l.nom, l.taille, l.prix, l.quantite
     FROM unnest($2::int[], $3::text[], $4::text[], $5::numeric[], $6::int[])
       AS l (vetement_id, nom, taille, prix, quantite)`,
    [
      id,
      lignes.map(l => l.vetementId),
      lignes.map(l => l.nom),
      lignes.map(l => l.taille),
      lignes.map(l => l.prix),
      lignes.map(l => l.quantite),
    ]
  );

  const total = await db.query(
    `UPDATE commandes
     SET total = (SELECT SUM(prix_unitaire * quantite) FROM lignes_commande WHERE commande_id = $1)
     WHERE id = $1
     RETURNING total::float AS total`,
    [id]
  );
  return { id, total: total.rows[0].total };
};

export const verrouillerCommande = async (db, id) => {
  const result = await db.query('SELECT statut FROM commandes WHERE id = $1 FOR UPDATE', [id]);
  return result.rows[0];
};

export const remettreEnStock = (db, commandeId) =>
  db.query(
    `UPDATE stocks s SET quantite = s.quantite + l.quantite
     FROM lignes_commande l
     WHERE l.commande_id = $1 AND s.vetement_id = l.vetement_id AND s.taille = l.taille`,
    [commandeId]
  );

export const changerStatut = (db, id, statut) =>
  db.query('UPDATE commandes SET statut = $2 WHERE id = $1', [id, statut]);
