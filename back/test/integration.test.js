import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET ??= 'secret-de-test';
const actif = process.env.DB_NAME?.endsWith('_test') ?? false;

const { default: app } = await import('../src/app.js');
const { default: pool } = await import('../src/config/db.js');
const { DOSSIER_UPLOADS } = await import('../src/middlewares/upload.js');

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let serveur;
let url;
let jetonAdmin;
let compteur = 0;
let fichiersAvant;

const appeler = async (methode, chemin, { corps, jeton, formulaire } = {}) => {
  compteur++;
  const headers = { 'X-Forwarded-For': `10.0.${Math.floor(compteur / 250)}.${(compteur % 250) + 1}` };
  if (jeton) {
    headers.Authorization = `Bearer ${jeton}`;
  }
  let body;
  if (formulaire) {
    body = formulaire;
  } else if (corps !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(corps);
  }
  const reponse = await fetch(`${url}${chemin}`, { method: methode, headers, body });
  const texte = await reponse.text();
  let json = null;
  try {
    json = JSON.parse(texte);
  } catch {}
  return { status: reponse.status, body: json };
};

const stock = async (vetementId, taille) => {
  const { body } = await appeler('GET', `/api/vetements/${vetementId}`);
  return body.tailles.find(t => t.taille === taille)?.stock;
};

const contenuJeton = (jeton) => JSON.parse(Buffer.from(jeton.split('.')[1], 'base64url').toString());

const client = { nom: 'Léa Martin', email: 'lea@test.fr', adresse: '12 rue de la Paix, 69002 Lyon' };

const commander = (lignes, options = {}) =>
  appeler('POST', '/api/commandes', { corps: { client: options.client ?? client, lignes }, jeton: options.jeton });

const vetementTest = (nom, tailles, image) => ({
  nom,
  prix: 30,
  description: 'Créé par les tests',
  image,
  tailles,
  categorie: 't-shirts',
});

const envoyerImage = async (contenu = PNG, type = 'image/png', nom = 'photo.png') => {
  const formulaire = new FormData();
  formulaire.append('image', new Blob([contenu], { type }), nom);
  return appeler('POST', '/api/images', { formulaire, jeton: jetonAdmin });
};

const existe = (fichier) => fs.access(path.join(DOSSIER_UPLOADS, fichier)).then(() => true, () => false);

describe('API avec une vraie base de données', { skip: actif ? false : 'base de test absente (DB_NAME doit finir par _test)' }, () => {
  before(async () => {
    await fs.mkdir(DOSSIER_UPLOADS, { recursive: true });
    fichiersAvant = new Set(await fs.readdir(DOSSIER_UPLOADS));
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await pool.query(await fs.readFile(new URL('../../db/init.sql', import.meta.url), 'utf8'));
    await pool.query(
      `INSERT INTO utilisateurs (email, nom, mot_de_passe_hash, role) VALUES ('admin@test.fr', 'Admin', $1, 'admin')`,
      [await bcrypt.hash('Admin123!', 4)]
    );
    serveur = app.listen(0);
    url = `http://localhost:${serveur.address().port}`;
    const { body } = await appeler('POST', '/api/auth/login', { corps: { email: 'admin@test.fr', motDePasse: 'Admin123!' } });
    jetonAdmin = body.token;
  });

  after(async () => {
    for (const fichier of await fs.readdir(DOSSIER_UPLOADS)) {
      if (!fichiersAvant.has(fichier)) {
        await fs.rm(path.join(DOSSIER_UPLOADS, fichier), { force: true });
      }
    }
    serveur.closeAllConnections();
    serveur.close();
    await pool.end();
  });

  describe('Catalogue', () => {
    test('liste les 8 vêtements avec leurs tailles et leur stock', async () => {
      const { status, body } = await appeler('GET', '/api/vetements');
      assert.equal(status, 200);
      assert.equal(body.length, 8);
      const jean = body.find(v => v.nom === 'Jean slim bleu');
      assert.deepEqual(jean.tailles.map(t => t.taille), ['36', '38', '40', '42', '44']);
      assert.equal(typeof jean.prix, 'number');
    });

    test('filtre par catégorie', async () => {
      const { body } = await appeler('GET', '/api/vetements?categorie=vestes');
      assert.deepEqual(body.map(v => v.nom).sort(), ['Blouson noir', 'Veste en jean']);
    });

    test('recherche sans tenir compte des majuscules, dans le nom et la description', async () => {
      const { body } = await appeler('GET', '/api/vetements?recherche=JEAN');
      assert.deepEqual(body.map(v => v.nom).sort(), ['Jean slim bleu', 'Veste en jean']);
    });

    test('trie par prix croissant puis décroissant', async () => {
      const croissant = (await appeler('GET', '/api/vetements?tri=prix_asc')).body.map(v => v.prix);
      const decroissant = (await appeler('GET', '/api/vetements?tri=prix_desc')).body.map(v => v.prix);
      assert.deepEqual(croissant, [...croissant].sort((a, b) => a - b));
      assert.deepEqual(decroissant, [...croissant].reverse());
    });

    test('combine catégorie et recherche', async () => {
      const { body } = await appeler('GET', '/api/vetements?categorie=sweats&recherche=gris');
      assert.deepEqual(body.map(v => v.nom), ['Sweat à capuche gris']);
    });

    test('une recherche sans résultat renvoie une liste vide', async () => {
      const { status, body } = await appeler('GET', '/api/vetements?recherche=chapeau');
      assert.equal(status, 200);
      assert.deepEqual(body, []);
    });

    test('renvoie un vêtement avec une taille épuisée', async () => {
      const { status, body } = await appeler('GET', '/api/vetements/3');
      assert.equal(status, 200);
      assert.equal(body.nom, 'Jean slim bleu');
      assert.equal(body.tailles.find(t => t.taille === '36').stock, 0);
    });

    test('un vêtement inexistant renvoie 404', async () => {
      assert.equal((await appeler('GET', '/api/vetements/9999')).status, 404);
    });

    test('liste les catégories triées', async () => {
      const { body } = await appeler('GET', '/api/categories');
      assert.deepEqual(body, ['pantalons', 'sweats', 't-shirts', 'vestes']);
    });
  });

  describe('Comptes clients', () => {
    test("l'inscription crée un compte client et renvoie un jeton", async () => {
      const { status, body } = await appeler('POST', '/api/auth/inscription', {
        corps: { nom: 'Hugo Bernard', email: 'Hugo@Test.fr', motDePasse: 'motdepasse1' },
      });
      assert.equal(status, 201);
      const contenu = contenuJeton(body.token);
      assert.equal(contenu.role, 'client');
      assert.equal(contenu.email, 'hugo@test.fr');
      assert.equal(contenu.nom, 'Hugo Bernard');
    });

    test('le mot de passe est stocké haché, jamais en clair', async () => {
      const { rows } = await pool.query("SELECT mot_de_passe_hash FROM utilisateurs WHERE email = 'hugo@test.fr'");
      assert.notEqual(rows[0].mot_de_passe_hash, 'motdepasse1');
      assert.match(rows[0].mot_de_passe_hash, /^\$2[aby]\$/);
    });

    test('impossible de créer deux comptes avec le même email (409)', async () => {
      const { status } = await appeler('POST', '/api/auth/inscription', {
        corps: { nom: 'Autre Hugo', email: 'HUGO@test.fr', motDePasse: 'motdepasse2' },
      });
      assert.equal(status, 409);
    });

    test("le client peut se connecter (l'email n'est pas sensible à la casse)", async () => {
      const { status, body } = await appeler('POST', '/api/auth/login', {
        corps: { email: 'hugo@TEST.fr', motDePasse: 'motdepasse1' },
      });
      assert.equal(status, 200);
      assert.equal(contenuJeton(body.token).role, 'client');
    });

    test('mauvais mot de passe et email inconnu donnent le même message (401)', async () => {
      const faux = await appeler('POST', '/api/auth/login', { corps: { email: 'hugo@test.fr', motDePasse: 'mauvais1' } });
      const inconnu = await appeler('POST', '/api/auth/login', { corps: { email: 'personne@test.fr', motDePasse: 'mauvais1' } });
      assert.equal(faux.status, 401);
      assert.equal(inconnu.status, 401);
      assert.equal(faux.body.message, inconnu.body.message);
    });

    test("le jeton de l'admin contient le rôle admin", async () => {
      assert.equal(contenuJeton(jetonAdmin).role, 'admin');
    });
  });

  describe('Administration des vêtements', () => {
    let id;

    test('crée un vêtement avec ses tailles et son stock', async () => {
      const { status, body } = await appeler('POST', '/api/vetements', {
        jeton: jetonAdmin,
        corps: vetementTest('Polo test', [{ taille: 'M', stock: 3 }, { taille: ' L ', stock: 0 }]),
      });
      assert.equal(status, 201);
      assert.deepEqual(body.tailles, [{ taille: 'M', stock: 3 }, { taille: 'L', stock: 0 }]);
      id = body.id;
    });

    test('modifie les tailles (les anciennes sont remplacées)', async () => {
      const { status, body } = await appeler('PUT', `/api/vetements/${id}`, {
        jeton: jetonAdmin,
        corps: vetementTest('Polo test', [{ taille: 'S', stock: 1 }, { taille: 'XL', stock: 9 }]),
      });
      assert.equal(status, 200);
      assert.deepEqual(body.tailles, [{ taille: 'S', stock: 1 }, { taille: 'XL', stock: 9 }]);
    });

    test('refuse une catégorie inconnue (400)', async () => {
      const { status } = await appeler('PUT', `/api/vetements/${id}`, {
        jeton: jetonAdmin,
        corps: { ...vetementTest('Polo test', [{ taille: 'S', stock: 1 }]), categorie: 'chaussures' },
      });
      assert.equal(status, 400);
    });

    test('refuse un stock négatif (400)', async () => {
      const { status } = await appeler('PUT', `/api/vetements/${id}`, {
        jeton: jetonAdmin,
        corps: vetementTest('Polo test', [{ taille: 'S', stock: -1 }]),
      });
      assert.equal(status, 400);
    });

    test('modifier un vêtement inexistant renvoie 404', async () => {
      const { status } = await appeler('PUT', '/api/vetements/9999', {
        jeton: jetonAdmin,
        corps: vetementTest('Fantôme', [{ taille: 'S', stock: 1 }]),
      });
      assert.equal(status, 404);
    });

    test('supprime le vêtement, puis il est introuvable', async () => {
      assert.equal((await appeler('DELETE', `/api/vetements/${id}`, { jeton: jetonAdmin })).status, 204);
      assert.equal((await appeler('GET', `/api/vetements/${id}`)).status, 404);
      assert.equal((await appeler('DELETE', `/api/vetements/${id}`, { jeton: jetonAdmin })).status, 404);
    });

    test('un client connecté ne peut pas modifier un vêtement (403)', async () => {
      const { body } = await appeler('POST', '/api/auth/login', { corps: { email: 'hugo@test.fr', motDePasse: 'motdepasse1' } });
      const { status } = await appeler('PUT', '/api/vetements/1', {
        jeton: body.token,
        corps: vetementTest('Piraté', [{ taille: 'S', stock: 999 }]),
      });
      assert.equal(status, 403);
      assert.equal((await appeler('GET', '/api/vetements/1')).body.nom, 'T-shirt blanc classique');
    });
  });

  describe('Images', () => {
    test("l'admin envoie une image, qui est ensuite servie", async () => {
      const { status, body } = await envoyerImage();
      assert.equal(status, 201);
      assert.match(body.image, /^[0-9a-f-]{36}\.png$/);
      const reponse = await fetch(`${url}/images/${body.image}`);
      assert.equal(reponse.status, 200);
      assert.equal(reponse.headers.get('content-type'), 'image/png');
    });

    test('un fichier qui n\'est pas une image est refusé (400)', async () => {
      const { status } = await envoyerImage(Buffer.from('bonjour'), 'text/plain', 'note.txt');
      assert.equal(status, 400);
    });

    test("une image trop lourde est refusée (400)", async () => {
      const { status } = await envoyerImage(Buffer.alloc(2 * 1024 * 1024 + 1), 'image/png', 'enorme.png');
      assert.equal(status, 400);
    });

    test("remplacer puis supprimer l'image d'un vêtement efface les anciens fichiers", async () => {
      const premiere = (await envoyerImage()).body.image;
      const seconde = (await envoyerImage()).body.image;
      const { body } = await appeler('POST', '/api/vetements', {
        jeton: jetonAdmin,
        corps: vetementTest('Avec photo', [{ taille: 'M', stock: 1 }], premiere),
      });
      assert.equal(await existe(premiere), true);

      await appeler('PUT', `/api/vetements/${body.id}`, {
        jeton: jetonAdmin,
        corps: vetementTest('Avec photo', [{ taille: 'M', stock: 1 }], seconde),
      });
      assert.equal(await existe(premiere), false);
      assert.equal(await existe(seconde), true);

      await appeler('DELETE', `/api/vetements/${body.id}`, { jeton: jetonAdmin });
      assert.equal(await existe(seconde), false);
    });

    test("les images de départ ne sont jamais supprimées", async () => {
      const { body } = await appeler('POST', '/api/vetements', {
        jeton: jetonAdmin,
        corps: vetementTest('Copie', [{ taille: 'M', stock: 1 }], 'tshirt-blanc.jpg'),
      });
      await appeler('DELETE', `/api/vetements/${body.id}`, { jeton: jetonAdmin });
      const reponse = await fetch(`${url}/images/tshirt-blanc.jpg`);
      assert.equal(reponse.status, 200);
    });
  });

  describe('Commandes', () => {
    test('une commande sans compte calcule le total et retire le stock', async () => {
      const avant = await stock(1, 'M');
      const { status, body } = await commander([
        { vetementId: 1, taille: 'M', quantite: 2 },
        { vetementId: 2, taille: 'L', quantite: 1 },
      ]);
      assert.equal(status, 201);
      assert.equal(body.total, 2 * 19.99 + 24.99);
      assert.equal(await stock(1, 'M'), avant - 2);
    });

    test('le prix envoyé par le navigateur est ignoré', async () => {
      const { body } = await commander([{ vetementId: 1, taille: 'L', quantite: 1, prix: 0.01 }]);
      assert.equal(body.total, 19.99);
    });

    test('deux lignes identiques sont regroupées', async () => {
      const avant = await stock(7, 'S');
      const { status } = await commander([
        { vetementId: 7, taille: 'S', quantite: 1 },
        { vetementId: 7, taille: 'S', quantite: 2 },
      ]);
      assert.equal(status, 201);
      assert.equal(await stock(7, 'S'), avant - 3);
    });

    test("une taille épuisée est refusée (409)", async () => {
      const { status, body } = await commander([{ vetementId: 3, taille: '36', quantite: 1 }]);
      assert.equal(status, 409);
      assert.match(body.message, /épuisé/);
    });

    test("stock insuffisant : rien n'est retiré, même sur les autres lignes (transaction)", async () => {
      const avantTshirt = await stock(1, 'S');
      const avantVeste = await stock(5, 'M');
      const { status, body } = await commander([
        { vetementId: 1, taille: 'S', quantite: 1 },
        { vetementId: 5, taille: 'M', quantite: 10 },
      ]);
      assert.equal(status, 409);
      assert.match(body.message, /Il ne reste que/);
      assert.equal(await stock(1, 'S'), avantTshirt);
      assert.equal(await stock(5, 'M'), avantVeste);
    });

    test("une taille qui n'existe pas est refusée (409)", async () => {
      const { status } = await commander([{ vetementId: 1, taille: 'XXXL', quantite: 1 }]);
      assert.equal(status, 409);
    });

    test('10 clients achètent la dernière pièce en même temps : un seul réussit', async () => {
      assert.equal(await stock(6, 'S'), 1);
      const reponses = await Promise.all(
        Array.from({ length: 10 }, () => commander([{ vetementId: 6, taille: 'S', quantite: 1 }]))
      );
      const statuts = reponses.map(r => r.status).sort();
      assert.deepEqual(statuts, [201, 409, 409, 409, 409, 409, 409, 409, 409, 409]);
      assert.equal(await stock(6, 'S'), 0);
    });

    test("la commande d'un client est liée à son compte, avec l'email du compte", async () => {
      const { body: connexion } = await appeler('POST', '/api/auth/login', {
        corps: { email: 'hugo@test.fr', motDePasse: 'motdepasse1' },
      });
      const { status, body } = await commander([{ vetementId: 4, taille: 'M', quantite: 1 }], {
        jeton: connexion.token,
        client: { ...client, nom: 'Hugo Bernard', email: 'autre@pirate.fr' },
      });
      assert.equal(status, 201);

      const miennes = await appeler('GET', '/api/commandes/miennes', { jeton: connexion.token });
      assert.equal(miennes.status, 200);
      assert.deepEqual(miennes.body.map(c => c.id), [body.id]);
      assert.equal(miennes.body[0].email, 'hugo@test.fr');
      assert.equal(miennes.body[0].lignes[0].nom, 'Pantalon cargo beige');
    });

    test("un autre client ne voit pas les commandes d'Hugo", async () => {
      const { body } = await appeler('POST', '/api/auth/inscription', {
        corps: { nom: 'Chloé Petit', email: 'chloe@test.fr', motDePasse: 'motdepasse3' },
      });
      const miennes = await appeler('GET', '/api/commandes/miennes', { jeton: body.token });
      assert.deepEqual(miennes.body, []);
    });

    test("l'admin voit toutes les commandes et peut filtrer par statut", async () => {
      const toutes = await appeler('GET', '/api/commandes', { jeton: jetonAdmin });
      assert.equal(toutes.status, 200);
      assert.ok(toutes.body.length >= 5);
      const enAttente = await appeler('GET', '/api/commandes?statut=en_attente', { jeton: jetonAdmin });
      assert.ok(enAttente.body.every(c => c.statut === 'en_attente'));
      assert.equal((await appeler('GET', '/api/commandes?statut=perdue', { jeton: jetonAdmin })).status, 400);
    });

    test("la liste de l'admin est paginée par 20, avec le total dans l'en-tête X-Total-Count", async () => {
      const { body: stockable } = await appeler('POST', '/api/vetements', {
        jeton: jetonAdmin,
        corps: vetementTest('Stock de test', [{ taille: 'M', stock: 100 }]),
      });
      for (let i = 0; i < 22; i++) {
        assert.equal((await commander([{ vetementId: stockable.id, taille: 'M', quantite: 1 }])).status, 201);
      }
      const page1 = await fetch(`${url}/api/commandes`, { headers: { Authorization: `Bearer ${jetonAdmin}`, 'X-Forwarded-For': '10.9.9.1' } });
      const total = Number(page1.headers.get('x-total-count'));
      const liste1 = await page1.json();
      assert.equal(liste1.length, 20);
      assert.ok(total > 20);

      const page2 = await appeler('GET', '/api/commandes?page=2', { jeton: jetonAdmin });
      assert.equal(page2.body.length, Math.min(20, total - 20));
      assert.equal(page2.body[0].id < liste1.at(-1).id, true);
      assert.equal((await appeler('GET', '/api/commandes?page=0', { jeton: jetonAdmin })).status, 400);
    });

    test('recherche par nom de client, sans tenir compte des majuscules', async () => {
      const { body } = await appeler('GET', '/api/commandes?recherche=HUGO', { jeton: jetonAdmin });
      assert.ok(body.length >= 1);
      assert.ok(body.every(c => /hugo/i.test(c.nomClient) || /hugo/i.test(c.email)));
    });

    test('recherche par numéro de commande (12, #12 ou n°12)', async () => {
      for (const texte of ['3', '#3', 'n°3']) {
        const { body } = await appeler('GET', `/api/commandes?recherche=${encodeURIComponent(texte)}`, { jeton: jetonAdmin });
        assert.ok(body.some(c => c.id === 3), texte);
      }
    });

    test("recherche par nom d'article", async () => {
      const { body } = await appeler('GET', '/api/commandes?recherche=cargo', { jeton: jetonAdmin });
      assert.ok(body.length >= 1);
      assert.ok(body.every(c => c.lignes.some(l => /cargo/i.test(l.nom))));
    });

    test('filtre par période', async () => {
      await pool.query("UPDATE commandes SET cree_le = '2025-12-24 10:00+00' WHERE id = 1");
      const noel = await appeler('GET', '/api/commandes?du=2025-12-24&au=2025-12-24', { jeton: jetonAdmin });
      assert.deepEqual(noel.body.map(c => c.id), [1]);
      const apres = await appeler('GET', '/api/commandes?du=2025-12-25', { jeton: jetonAdmin });
      assert.ok(apres.body.every(c => c.id !== 1));
    });

    test('tri par montant décroissant', async () => {
      const { body } = await appeler('GET', '/api/commandes?tri=montant_desc', { jeton: jetonAdmin });
      const montants = body.map(c => c.total);
      assert.deepEqual(montants, [...montants].sort((a, b) => b - a));
    });

    test('les compteurs par statut suivent la recherche', async () => {
      const tout = await appeler('GET', '/api/commandes/compteurs', { jeton: jetonAdmin });
      assert.equal(tout.body.total, tout.body.en_attente + tout.body.expediee + tout.body.annulee);
      const enAttente = await fetch(`${url}/api/commandes?statut=en_attente`, { headers: { Authorization: `Bearer ${jetonAdmin}`, 'X-Forwarded-For': '10.9.9.2' } });
      assert.equal(Number(enAttente.headers.get('x-total-count')), tout.body.en_attente);

      const hugo = await appeler('GET', '/api/commandes/compteurs?recherche=hugo', { jeton: jetonAdmin });
      assert.ok(hugo.body.total >= 1 && hugo.body.total < tout.body.total);
    });

    test('annuler une commande remet les articles en stock', async () => {
      const avant = await stock(7, 'M');
      const { body } = await commander([{ vetementId: 7, taille: 'M', quantite: 3 }]);
      assert.equal(await stock(7, 'M'), avant - 3);

      const annulee = await appeler('PATCH', `/api/commandes/${body.id}`, { jeton: jetonAdmin, corps: { statut: 'annulee' } });
      assert.equal(annulee.status, 200);
      assert.equal(annulee.body.statut, 'annulee');
      assert.equal(await stock(7, 'M'), avant);
    });

    test("une commande annulée ou expédiée ne peut plus changer (409)", async () => {
      const { body } = await commander([{ vetementId: 2, taille: 'M', quantite: 1 }]);
      const expediee = await appeler('PATCH', `/api/commandes/${body.id}`, { jeton: jetonAdmin, corps: { statut: 'expediee' } });
      assert.equal(expediee.body.statut, 'expediee');
      const annulation = await appeler('PATCH', `/api/commandes/${body.id}`, { jeton: jetonAdmin, corps: { statut: 'annulee' } });
      assert.equal(annulation.status, 409);
      assert.equal((await appeler('PATCH', '/api/commandes/9999', { jeton: jetonAdmin, corps: { statut: 'expediee' } })).status, 404);
    });

    test('supprimer un vêtement ne modifie pas les commandes passées', async () => {
      const { body: vetement } = await appeler('POST', '/api/vetements', {
        jeton: jetonAdmin,
        corps: vetementTest('Éphémère', [{ taille: 'M', stock: 5 }]),
      });
      const { body: commande } = await commander([{ vetementId: vetement.id, taille: 'M', quantite: 2 }]);
      await appeler('DELETE', `/api/vetements/${vetement.id}`, { jeton: jetonAdmin });

      const { body } = await appeler('GET', '/api/commandes', { jeton: jetonAdmin });
      const ligne = body.find(c => c.id === commande.id).lignes[0];
      assert.equal(ligne.nom, 'Éphémère');
      assert.equal(ligne.vetementId, null);
      assert.equal(ligne.prixUnitaire, 30);
    });
  });
});
