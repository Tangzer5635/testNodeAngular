# Boutique de vêtements — Node.js / Express / PostgreSQL / Angular

Site vitrine de vente de vêtements avec une partie administration (CRUD complet).

| Dossier | Contenu |
|---|---|
| `db/` | script SQL de création des tables et des données de départ |
| `back/` | API REST Express (routes → controllers → services → repositories) |
| `front/` | application Angular (catalogue, fiche produit, administration) |

## Prérequis

- Node.js 24 ou plus récent
- Docker (avec Docker Compose)
- Git

## Installation (première fois)

```bash
git clone https://github.com/Tangzer5635/testNodeAngular.git
cd testNodeAngular

# 1. Mot de passe de la base
cp .env.example .env              # puis choisir un mot de passe dans .env
cp back/.env.example back/.env    # et mettre le MÊME mot de passe dans DB_PASSWORD

# 2. Base de données (crée les tables et les 8 vêtements au premier démarrage)
docker compose up -d

# 3. Dépendances
cd back && npm install && cd ..
cd front && npm install && cd ..
```

## Lancer le projet

Trois choses doivent tourner en même temps :

| Quoi | Où | Commande | Adresse |
|---|---|---|---|
| Base PostgreSQL | racine | `docker compose start` | port 5433 |
| API | `back/` | `npm run dev` | http://localhost:3000 |
| Front | `front/` | `npm start` | http://localhost:4200 |

## API

| Méthode | URL | Rôle |
|---|---|---|
| GET | `/api/vetements` (option `?categorie=vestes`) | liste des vêtements |
| GET | `/api/vetements/:id` | un vêtement |
| POST | `/api/vetements` | créer (201) |
| PUT | `/api/vetements/:id` | modifier |
| DELETE | `/api/vetements/:id` | supprimer (204) |
| GET | `/api/categories` | liste des catégories |
| GET | `/images/:fichier` | images des vêtements (`back/public/images`) |

Erreurs, toujours en JSON : 400 (données invalides), 404 (introuvable), 500 (erreur serveur).

## Repartir d'une base neuve

```bash
docker compose down -v   # ⚠️ supprime toutes les données
docker compose up -d     # recrée la base à partir de db/init.sql
```

## Travailler sur plusieurs PC

- En commençant : `git pull`
- En finissant : `git add .`, `git commit -m "..."`, `git push`
