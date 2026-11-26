# Boutique de vêtements — Node.js / Express / PostgreSQL / Angular

[![CI/CD](https://github.com/Tangzer5635/testNodeAngular/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Tangzer5635/testNodeAngular/actions/workflows/ci-cd.yml)

Site vitrine de vente de vêtements, avec une partie administration protégée par connexion (CRUD complet).

| Dossier | Contenu |
|---|---|
| `db/` | script SQL de création des tables et des données de départ |
| `back/` | API REST Express (routes → controllers → services → repositories), authentification JWT |
| `front/` | application Angular (catalogue avec filtres, fiche produit, panier, commande, connexion, administration des vêtements et des commandes) |

## Configuration (dans tous les cas)

```bash
git clone https://github.com/Tangzer5635/testNodeAngular.git
cd testNodeAngular
cp .env.example .env    # puis choisir POSTGRES_PASSWORD et JWT_SECRET
```

Générer une valeur pour `JWT_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Option 1 : tout lancer avec Docker

Seul Docker est nécessaire.

```bash
docker compose up -d --build
```

| Service | Rôle | Adresse |
|---|---|---|
| `front` | Angular compilé, servi par nginx (qui transmet `/api` et `/images` au back) | http://localhost:8080 |
| `back` | API Express | accessible via le front (`/api`) |
| `db` | PostgreSQL | port 5433 |

Créer l'administrateur (la même commande change le mot de passe d'un compte existant) :

```bash
docker compose exec back node scripts/creer-admin.js admin@boutique.fr MonMotDePasse
```

Après une modification du code : `docker compose up -d --build` reconstruit les images.

## Option 2 : développement (rechargement automatique)

Prérequis : Node.js 24 ou plus récent, et Docker pour la base.

```bash
docker compose up -d db                  # seulement la base
cp back/.env.example back/.env           # DB_PASSWORD = POSTGRES_PASSWORD, et un JWT_SECRET
cd back && npm install && npm run dev    # API sur http://localhost:3000
cd front && npm install && npm start     # front sur http://localhost:4200
```

Créer l'administrateur :

```bash
cd back
npm run creer-admin -- admin@boutique.fr MonMotDePasse
```

La page de connexion est sur `/connexion`.

## API

| Méthode | URL | Rôle | Jeton requis |
|---|---|---|---|
| POST | `/api/auth/login` | connexion → `{ token }` | non |
| POST | `/api/auth/inscription` | créer un compte client (201 → `{ token }`, 409 si l'email existe) | non |
| GET | `/api/vetements` (options `?categorie=vestes&recherche=jean&tri=prix_asc`) | liste des vêtements | non |
| GET | `/api/vetements/:id` | un vêtement | non |
| POST | `/api/vetements` | créer (201) | admin |
| PUT | `/api/vetements/:id` | modifier | admin |
| DELETE | `/api/vetements/:id` | supprimer (204) | admin |
| GET | `/api/categories` | liste des catégories | non |
| POST | `/api/commandes` | passer commande (201 → `{ id, total }`, 409 si stock insuffisant) ; liée au compte si un jeton est envoyé | non |
| GET | `/api/commandes/miennes` | commandes du client connecté | client |
| GET | `/api/commandes` (option `?statut=en_attente`) | liste des commandes | admin |
| PATCH | `/api/commandes/:id` (`{ "statut": "expediee" }` ou `"annulee"`) | changer le statut (annuler remet en stock) | admin |
| POST | `/api/images` (champ `image`, JPEG/PNG/WebP, 2 Mo max) | envoyer une image → `{ image }` | admin |
| GET | `/images/:fichier` | images des vêtements (`back/public/images` et `back/uploads`) | non |

Jeton : en-tête `Authorization: Bearer <jeton>`.
Un vêtement contient ses tailles et leur stock : `"tailles": [{ "taille": "M", "stock": 5 }, …]`.

Passer commande : `{ "client": { "nom", "email", "adresse" }, "lignes": [{ "vetementId", "taille", "quantite" }] }`. Le prix n'est **jamais** envoyé par le front : le back le lit dans la base, vérifie et décompte le stock dans une transaction.

Erreurs, toujours en JSON : 400 (données invalides), 401 (non authentifié), 403 (rôle insuffisant), 404 (introuvable), 409 (conflit : stock insuffisant, statut impossible), 429 (trop de tentatives de connexion : 10 échecs par IP sur 15 min), 500 (erreur serveur).

## Accès aux pages

Deux rôles : **client** (compte créé depuis `/inscription`) et **admin** (créé avec `creer-admin`).

| Page | Visiteur | Client | Admin |
|---|---|---|---|
| `/`, `/vetements/:id`, `/panier`, `/commande` | ✅ | ✅ | ✅ |
| `/connexion`, `/inscription` | ✅ | ↪ `/mon-compte` | ↪ `/admin` |
| `/mon-compte` | ↪ `/connexion` | ✅ | ✅ |
| `/admin`, `/admin/nouveau`, `/admin/:id`, `/admin/commandes` | ↪ `/connexion` | ↪ `/` | ✅ |

La session se termine automatiquement à l'expiration du jeton (2 h). L'API vérifie aussi le jeton : masquer les pages côté Angular ne suffirait pas.

## Tests

```bash
cd back && npm test                     # API : sécurité, validations, rôles (sans base de données)
cd front && npx ng test --watch=false   # Angular : services, guards, pages
```

Tests du back sur une vraie base PostgreSQL (catalogue, comptes, commandes, transaction, 10 achats simultanés…).
Ils effacent la base utilisée : ils ne se lancent que si son nom finit par `_test`.

```bash
docker compose exec db createdb -U postgres boutique_test
cd back
cp .env.test.example .env.test         # mettre le mot de passe de PostgreSQL
npm run test:bdd
```

## CI/CD (GitHub Actions)

Fichier : `.github/workflows/ci-cd.yml`. Résultats dans l'onglet **Actions** du dépôt (ou `gh run list`).

| Quand | Ce qui est lancé |
|---|---|
| push sur `main`, pull request | tests du back, tests + build du front, build des 2 images Docker |
| push d'un tag `v*` | tout ce qui précède, **puis** publication des images sur ghcr.io et création de la release |

Les images ne sont publiées que si **tous** les tests passent.

Publier une nouvelle version :

```bash
git tag -a v1.4.0 -m "v1.4.0 – Titre de la version"   # le message devient le titre de la release
git push origin v1.4.0
```

Lancer la boutique avec les images publiées, sans rien compiler (il faut `.env` et `db/init.sql`) :

```bash
docker login ghcr.io -u Tangzer5635      # mot de passe : jeton GitHub avec le droit read:packages
docker compose -f docker-compose.prod.yaml up -d
```

## Mettre à jour une base existante (migrations)

`db/init.sql` n'est lu que lorsque la base est **vide**. Pour garder tes données en passant à une nouvelle version,
lance les scripts de `db/migrations/` (une seule fois, dans l'ordre) :

| Version | Script |
|---|---|
| v1.5.0 | `db/migrations/v1.5.0-stock-commandes.sql` |
| v2.1.0 | `db/migrations/v2.1.0-comptes-clients.sql` |

```powershell
# PowerShell
Get-Content db/migrations/v2.1.0-comptes-clients.sql | docker compose exec -T db psql -U postgres -d boutique
```

```bash
# Linux / macOS
docker compose exec -T db psql -U postgres -d boutique < db/migrations/v2.1.0-comptes-clients.sql
```

## Repartir d'une base neuve

```bash
docker compose down -v   # ⚠️ supprime toutes les données
docker compose up -d db  # recrée la base à partir de db/init.sql
```

## Travailler sur plusieurs PC

- En commençant : `git pull`
- En finissant : `git add .`, `git commit -m "..."`, `git push`
