import bcrypt from 'bcryptjs';
import pool, { transaction } from '../src/config/db.js';
import { CATALOGUE, CATEGORIES, DOMAINES, NOMS, PRENOMS, RUES, TAILLES, VILLES } from './donnees.js';

const NB_CLIENTS = 400;
const NB_COMMANDES = 3000;
const JOURS = 365;
const MOT_DE_PASSE_DEMO = 'motdepasse1';

if (!process.argv.includes('--remplacer')) {
  console.error('Ce script REMPLACE le catalogue, les clients et les commandes (les admins sont gardés).');
  console.error('Pour confirmer : npm run seed -- --remplacer');
  process.exit(1);
}

let graine = 20261126;
const hasard = () => {
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entier = (min, max) => min + Math.floor(hasard() * (max - min + 1));
const choisir = (liste) => liste.at(Math.floor(hasard() * liste.length));
const choisirPondere = (liste, poids) => {
  let r = hasard() * poids.reduce((s, p) => s + p, 0);
  for (let i = 0; i < liste.length; i++) {
    r -= poids.at(i);
    if (r <= 0) {
      return liste.at(i);
    }
  }
  return liste.at(-1);
};
const sansAccents = (texte) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const maintenant = Date.now();
const JOUR = 24 * 3600 * 1000;

const poidsJour = Array.from({ length: JOURS }, (_, i) => {
  const age = JOURS - i;
  const date = new Date(maintenant - age * JOUR);
  const croissance = 0.5 + i / JOURS;
  const noel = 1 + 1.4 * Math.exp(-(((date.getMonth() === 11 ? date.getDate() : date.getMonth() === 10 ? date.getDate() - 30 : 99) - 8) ** 2) / 60);
  const soldes = date.getMonth() === 0 && date.getDate() < 25 ? 1.6 : 1;
  const weekend = [0, 6].includes(date.getDay()) ? 1.35 : 1;
  return croissance * noel * soldes * weekend;
});

const dateCommande = () => {
  const jour = choisirPondere([...Array(JOURS).keys()], poidsJour);
  const heure = choisirPondere([8, 10, 12, 13, 18, 20, 21, 22], [1, 2, 3, 2, 3, 4, 4, 2]);
  return new Date(maintenant - (JOURS - jour) * JOUR + heure * 3600 * 1000 + entier(0, 3599) * 1000);
};

const adresse = () => {
  const [cp, ville] = choisir(VILLES);
  return `${entier(1, 120)} ${choisir(RUES)}\n${cp} ${ville}`;
};

const personne = (emailsPris) => {
  const prenom = choisir(PRENOMS);
  const nom = choisir(NOMS);
  let email = `${sansAccents(prenom)}.${sansAccents(nom)}@${choisir(DOMAINES)}`;
  for (let n = 2; emailsPris.has(email); n++) {
    email = `${sansAccents(prenom)}.${sansAccents(nom)}${n}@${choisir(DOMAINES)}`;
  }
  emailsPris.add(email);
  return { nom: `${prenom} ${nom}`, email };
};

const statutSelonAge = (date) => {
  const jours = (maintenant - date.getTime()) / JOUR;
  if (jours > 10) {
    return choisirPondere(['expediee', 'annulee'], [93, 7]);
  }
  if (jours > 3) {
    return choisirPondere(['expediee', 'en_attente', 'annulee'], [70, 25, 5]);
  }
  return choisirPondere(['en_attente', 'annulee'], [95, 5]);
};

const genererCatalogue = () =>
  CATALOGUE.map((v, rang) => ({
    ...v,
    stocks: TAILLES[v.tailles].map((taille, ordre) => ({
      taille,
      ordre: ordre + 1,
      quantite: hasard() < 0.1 ? 0 : hasard() < 0.15 ? entier(1, 3) : entier(4, 40),
    })),
    popularite: 1 / (rang % 13 + 2) + hasard() * 0.2,
  }));

const genererClients = (emailsPris) =>
  Array.from({ length: NB_CLIENTS }, () => ({ ...personne(emailsPris), adresse: adresse(), commandes: 0 }));

const genererCommandes = (catalogue, clients, emailsPris) => {
  const commandes = Array.from({ length: NB_COMMANDES }, () => {
    const date = dateCommande();
    const client = hasard() < 0.65 ? choisir(clients) : null;
    const invite = client ? null : { ...personne(emailsPris), adresse: adresse() };
    const nbLignes = choisirPondere([1, 2, 3, 4], [55, 30, 11, 4]);
    const lignes = new Map();
    for (let i = 0; i < nbLignes; i++) {
      const vetement = choisirPondere(catalogue, catalogue.map(v => v.popularite));
      const taille = choisir(vetement.stocks).taille;
      const cle = `${vetement.nom}|${taille}`;
      const quantite = (lignes.get(cle)?.quantite ?? 0) + (hasard() < 0.85 ? 1 : 2);
      lignes.set(cle, { vetement, taille, quantite });
    }
    if (client) {
      client.commandes++;
      client.premiere = Math.min(client.premiere ?? Infinity, date.getTime());
    }
    return { date, client, invite, statut: statutSelonAge(date), lignes: [...lignes.values()] };
  });
  return commandes.sort((a, b) => a.date - b.date);
};

const enCentimes = (prix) => Math.round(prix * 100);

const inserer = async (catalogue, clients, commandes, hash) =>
  transaction(async (db) => {
    await db.query('TRUNCATE lignes_commande, commandes, stocks, vetements, categories RESTART IDENTITY CASCADE');
    await db.query("DELETE FROM utilisateurs WHERE role = 'client'");

    await db.query('INSERT INTO categories (nom) SELECT unnest($1::text[])', [CATEGORIES]);

    const vetements = await db.query(
      `INSERT INTO vetements (nom, description, prix, image, categorie_id)
       SELECT v.nom, v.description, v.prix, v.image, c.id
       FROM unnest($1::text[], $2::text[], $3::numeric[], $4::text[], $5::text[]) WITH ORDINALITY AS v (nom, description, prix, image, categorie, n)
       JOIN categories c ON c.nom = v.categorie
       ORDER BY v.n
       RETURNING id, nom`,
      [catalogue.map(v => v.nom), catalogue.map(v => v.description), catalogue.map(v => v.prix), catalogue.map(v => v.image), catalogue.map(v => v.categorie)]
    );
    const idVetement = new Map(vetements.rows.map(r => [r.nom, r.id]));

    const stocks = catalogue.flatMap(v => v.stocks.map(s => ({ ...s, id: idVetement.get(v.nom) })));
    await db.query(
      `INSERT INTO stocks (vetement_id, taille, quantite, ordre)
       SELECT * FROM unnest($1::int[], $2::text[], $3::int[], $4::int[])`,
      [stocks.map(s => s.id), stocks.map(s => s.taille), stocks.map(s => s.quantite), stocks.map(s => s.ordre)]
    );

    const inscrits = clients.map(c => ({
      ...c,
      creeLe: new Date((c.premiere ?? maintenant - entier(1, JOURS) * JOUR) - entier(0, 30) * JOUR),
    }));
    const utilisateurs = await db.query(
      `INSERT INTO utilisateurs (email, nom, mot_de_passe_hash, role, cree_le)
       SELECT email, nom, $3, 'client', cree_le FROM unnest($1::text[], $2::text[], $4::timestamptz[]) AS u (email, nom, cree_le)
       RETURNING id, email`,
      [inscrits.map(c => c.email), inscrits.map(c => c.nom), hash, inscrits.map(c => c.creeLe)]
    );
    const idClient = new Map(utilisateurs.rows.map(r => [r.email, r.id]));

    const lignesPlates = [];
    const entetes = commandes.map((c, i) => {
      const id = i + 1;
      const qui = c.client ?? c.invite;
      let total = 0;
      for (const l of c.lignes) {
        total += enCentimes(l.vetement.prix) * l.quantite;
        lignesPlates.push({ commande: id, vetement: idVetement.get(l.vetement.nom), nom: l.vetement.nom, taille: l.taille, prix: l.vetement.prix, quantite: l.quantite });
      }
      return {
        id,
        utilisateur: c.client ? idClient.get(c.client.email) : null,
        nom: qui.nom,
        email: qui.email,
        adresse: qui.adresse,
        total: (total / 100).toFixed(2),
        statut: c.statut,
        date: c.date,
      };
    });

    await db.query(
      `INSERT INTO commandes (id, utilisateur_id, nom_client, email, adresse, total, statut, cree_le)
       OVERRIDING SYSTEM VALUE
       SELECT * FROM unnest($1::int[], $2::int[], $3::text[], $4::text[], $5::text[], $6::numeric[], $7::text[], $8::timestamptz[])`,
      [
        entetes.map(e => e.id), entetes.map(e => e.utilisateur), entetes.map(e => e.nom), entetes.map(e => e.email),
        entetes.map(e => e.adresse), entetes.map(e => e.total), entetes.map(e => e.statut), entetes.map(e => e.date),
      ]
    );
    await db.query("SELECT setval(pg_get_serial_sequence('commandes', 'id'), (SELECT MAX(id) FROM commandes))");

    await db.query(
      `INSERT INTO lignes_commande (commande_id, vetement_id, nom, taille, prix_unitaire, quantite)
       SELECT * FROM unnest($1::int[], $2::int[], $3::text[], $4::text[], $5::numeric[], $6::int[])`,
      [
        lignesPlates.map(l => l.commande), lignesPlates.map(l => l.vetement), lignesPlates.map(l => l.nom),
        lignesPlates.map(l => l.taille), lignesPlates.map(l => l.prix), lignesPlates.map(l => l.quantite),
      ]
    );

    return { lignes: lignesPlates.length };
  });

const debut = Date.now();
const emailsPris = new Set();
const catalogue = genererCatalogue();
const clients = genererClients(emailsPris);
const commandes = genererCommandes(catalogue, clients, emailsPris);
const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
const { lignes } = await inserer(catalogue, clients, commandes, hash);

const resume = await pool.query(`
  SELECT
    (SELECT COUNT(*) FROM vetements) AS vetements,
    (SELECT COUNT(*) FROM utilisateurs WHERE role = 'client') AS clients,
    (SELECT COUNT(*) FROM commandes) AS commandes,
    (SELECT COUNT(*) FROM commandes WHERE statut = 'en_attente') AS en_attente,
    (SELECT SUM(total) FROM commandes WHERE statut <> 'annulee') AS chiffre_affaires`);
const r = resume.rows[0];
console.log(`${r.vetements} vêtements, ${r.clients} clients, ${r.commandes} commandes (${lignes} lignes, ${r.en_attente} en attente)`);
console.log(`Chiffre d'affaires : ${Number(r.chiffre_affaires).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
console.log(`Mot de passe de tous les clients de démo : ${MOT_DE_PASSE_DEMO} (ex. ${clients.at(0).email})`);
console.log(`Terminé en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
await pool.end();
