# Boutique de vêtements — Node.js / Express / PostgreSQL / Angular

Site vitrine de vente de vêtements, avec une partie administration protégée par connexion (CRUD complet).

| Dossier | Contenu |
|---|---|
| `db/` | script SQL de création des tables et des données de départ |
| `back/` | API REST Express (routes → controllers → services → repositories), authentification JWT |
| `front/` | application Angular (catalogue, fiche produit, connexion, administration) |

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
| GET | `/api/vetements` (option `?categorie=vestes`) | liste des vêtements | non |
| GET | `/api/vetements/:id` | un vêtement | non |
| POST | `/api/vetements` | créer (201) | **oui** |
| PUT | `/api/vetements/:id` | modifier | **oui** |
| DELETE | `/api/vetements/:id` | supprimer (204) | **oui** |
| GET | `/api/categories` | liste des catégories | non |
| GET | `/images/:fichier` | images des vêtements (`back/public/images`) | non |

Jeton : en-tête `Authorization: Bearer <jeton>`.
Erreurs, toujours en JSON : 400 (données invalides), 401 (non authentifié), 404 (introuvable), 500 (erreur serveur).

## Repartir d'une base neuve

```bash
docker compose down -v   # ⚠️ supprime toutes les données
docker compose up -d db  # recrée la base à partir de db/init.sql
```

## Travailler sur plusieurs PC

- En commençant : `git pull`
- En finissant : `git add .`, `git commit -m "..."`, `git push`
