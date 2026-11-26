import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'secret-de-test';
const { default: app } = await import('../src/app.js');

let serveur;
let url;

before(() => {
  serveur = app.listen(0);
  url = `http://localhost:${serveur.address().port}`;
});

after(() => {
  serveur.closeAllConnections();
  serveur.close();
});

const jetonDe = (role) => jwt.sign({ sub: 1, email: `${role}@test.fr`, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
const jetonValide = () => jetonDe('admin');

test('une route inconnue renvoie 404 en JSON', async () => {
  const reponse = await fetch(`${url}/api/inconnue`);
  assert.equal(reponse.status, 404);
  assert.match((await reponse.json()).message, /Route introuvable/);
});

test("l'en-tête X-Powered-By n'est pas envoyé", async () => {
  const reponse = await fetch(`${url}/`);
  assert.equal(reponse.headers.get('x-powered-by'), null);
});

test('créer un vêtement sans jeton renvoie 401', async () => {
  const reponse = await fetch(`${url}/api/vetements`, { method: 'POST' });
  assert.equal(reponse.status, 401);
});

test('un jeton signé avec une autre clé est refusé', async () => {
  const faux = jwt.sign({ sub: 1 }, 'pas-la-bonne-cle');
  const reponse = await fetch(`${url}/api/vetements/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${faux}` },
  });
  assert.equal(reponse.status, 401);
});

test('un jeton expiré est refusé', async () => {
  const expire = jwt.sign({ sub: 1, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
  const reponse = await fetch(`${url}/api/vetements/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${expire}` },
  });
  assert.equal(reponse.status, 401);
});

test('envoyer une image sans jeton renvoie 401', async () => {
  const reponse = await fetch(`${url}/api/images`, { method: 'POST' });
  assert.equal(reponse.status, 401);
});

test('un id invalide renvoie 404', async () => {
  const reponse = await fetch(`${url}/api/vetements/abc`);
  assert.equal(reponse.status, 404);
});

test('un tri inconnu renvoie 400', async () => {
  const reponse = await fetch(`${url}/api/vetements?tri=DROP`);
  assert.equal(reponse.status, 400);
});

test('un JSON mal formé renvoie 400', async () => {
  const reponse = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ pas du json',
  });
  assert.equal(reponse.status, 400);
});

test('une connexion sans email ni mot de passe renvoie 400', async () => {
  const reponse = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(reponse.status, 400);
});

test('un nom d\'image dangereux est refusé (400) avant tout accès à la base', async () => {
  const reponse = await fetch(`${url}/api/vetements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jetonValide()}` },
    body: JSON.stringify({ nom: 'Test', prix: 10, tailles: [{ taille: 'M', stock: 1 }], image: '../../index.js', categorie: 'vestes' }),
  });
  assert.equal(reponse.status, 400);
});

test('des tailles sans stock (ancien format) sont refusées (400)', async () => {
  const reponse = await fetch(`${url}/api/vetements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jetonValide()}` },
    body: JSON.stringify({ nom: 'Test', prix: 10, tailles: ['S', 'M'], categorie: 'vestes' }),
  });
  assert.equal(reponse.status, 400);
});

test('un client ne peut pas créer de vêtement (403)', async () => {
  const reponse = await fetch(`${url}/api/vetements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jetonDe('client')}` },
    body: '{}',
  });
  assert.equal(reponse.status, 403);
});

test('un client ne peut pas supprimer de vêtement (403)', async () => {
  const reponse = await fetch(`${url}/api/vetements/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jetonDe('client')}` },
  });
  assert.equal(reponse.status, 403);
});

test('un client ne peut pas envoyer d\'image (403)', async () => {
  const reponse = await fetch(`${url}/api/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jetonDe('client')}` },
  });
  assert.equal(reponse.status, 403);
});

test('un ancien jeton sans rôle n\'a pas les droits admin (403)', async () => {
  const ancien = jwt.sign({ sub: 1, email: 'admin@test.fr' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const reponse = await fetch(`${url}/api/commandes`, { headers: { Authorization: `Bearer ${ancien}` } });
  assert.equal(reponse.status, 403);
});

test('un client ne voit pas la liste de toutes les commandes (403)', async () => {
  const reponse = await fetch(`${url}/api/commandes`, { headers: { Authorization: `Bearer ${jetonDe('client')}` } });
  assert.equal(reponse.status, 403);
});

test('mes commandes sans être connecté renvoie 401', async () => {
  const reponse = await fetch(`${url}/api/commandes/miennes`);
  assert.equal(reponse.status, 401);
});

test('passer commande avec un jeton invalide renvoie 401', async () => {
  const reponse = await fetch(`${url}/api/commandes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer pas.un.jeton' },
    body: '{}',
  });
  assert.equal(reponse.status, 401);
});

const inscrire = (corps) => fetch(`${url}/api/auth/inscription`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corps),
});

test('inscription : nom manquant refusé (400)', async () => {
  const reponse = await inscrire({ email: 'a@b.fr', motDePasse: 'motdepasse1' });
  assert.equal(reponse.status, 400);
});

test('inscription : email invalide refusé (400)', async () => {
  const reponse = await inscrire({ nom: 'Léa', email: 'lea', motDePasse: 'motdepasse1' });
  assert.equal(reponse.status, 400);
});

test('inscription : mot de passe trop court refusé (400)', async () => {
  const reponse = await inscrire({ nom: 'Léa', email: 'lea@b.fr', motDePasse: 'abc1' });
  assert.equal(reponse.status, 400);
});

test('inscription : mot de passe sans chiffre refusé (400)', async () => {
  const reponse = await inscrire({ nom: 'Léa', email: 'lea@b.fr', motDePasse: 'motdepasse' });
  assert.equal(reponse.status, 400);
});

const commande = (corps) => fetch(`${url}/api/commandes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corps),
});
const client = { nom: 'Léa Martin', email: 'lea@test.fr', adresse: '12 rue de la Paix, Lyon' };

test('passer commande : un panier vide est refusé (400)', async () => {
  const reponse = await commande({ client, lignes: [] });
  assert.equal(reponse.status, 400);
});

test('passer commande : un email invalide est refusé (400)', async () => {
  const reponse = await commande({ client: { ...client, email: 'pas-un-email' }, lignes: [{ vetementId: 1, taille: 'M', quantite: 1 }] });
  assert.equal(reponse.status, 400);
});

test('passer commande : plus de 10 exemplaires (même réparti sur 2 lignes) est refusé (400)', async () => {
  const lignes = [{ vetementId: 1, taille: 'M', quantite: 6 }, { vetementId: 1, taille: 'M', quantite: 5 }];
  const reponse = await commande({ client, lignes });
  assert.equal(reponse.status, 400);
});

test('passer commande : une quantité négative est refusée (400)', async () => {
  const reponse = await commande({ client, lignes: [{ vetementId: 1, taille: 'M', quantite: -2 }] });
  assert.equal(reponse.status, 400);
});

test('la liste des commandes est réservée à l\'admin (401)', async () => {
  const reponse = await fetch(`${url}/api/commandes`);
  assert.equal(reponse.status, 401);
});

test('changer le statut d\'une commande sans jeton renvoie 401', async () => {
  const reponse = await fetch(`${url}/api/commandes/1`, { method: 'PATCH' });
  assert.equal(reponse.status, 401);
});

test('un statut inconnu est refusé (400)', async () => {
  const reponse = await fetch(`${url}/api/commandes/1`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jetonValide()}` },
    body: JSON.stringify({ statut: 'livree-par-drone' }),
  });
  assert.equal(reponse.status, 400);
});

test('après 10 connexions ratées, la 11e est bloquée (429)', async () => {
  let derniere;
  for (let i = 0; i < 10; i++) {
    derniere = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  }
  assert.equal(derniere.status, 429);
  assert.match((await derniere.json()).message, /Trop de tentatives/);
});
