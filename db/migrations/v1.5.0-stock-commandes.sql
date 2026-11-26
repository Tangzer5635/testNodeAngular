-- Migration v1.5.0 : stock par taille + commandes
--
-- init.sql n'est exécuté que sur une base VIDE. Pour une base qui existe déjà,
-- on lance ce script une seule fois (il ne refait rien s'il a déjà été lancé) :
--
--   PowerShell : Get-Content db/migrations/v1.5.0-stock-commandes.sql | docker compose exec -T db psql -U postgres -d boutique
--   Linux      : docker compose exec -T db psql -U postgres -d boutique < db/migrations/v1.5.0-stock-commandes.sql

BEGIN;

CREATE TABLE IF NOT EXISTS stocks (
    vetement_id INT  NOT NULL REFERENCES vetements (id) ON DELETE CASCADE,
    taille      TEXT NOT NULL,
    quantite    INT  NOT NULL DEFAULT 0 CHECK (quantite >= 0),
    ordre       INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (vetement_id, taille)
);

-- Les anciennes tailles (colonne vetements.tailles) deviennent des lignes de stock, avec 10 pièces chacune,
-- puis la colonne est supprimée. Le IF évite une erreur si la migration a déjà été faite.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'vetements' AND column_name = 'tailles') THEN
        INSERT INTO stocks (vetement_id, taille, quantite, ordre)
        SELECT v.id, t.taille, 10, t.ordre
        FROM vetements v
        CROSS JOIN LATERAL unnest(v.tailles) WITH ORDINALITY AS t (taille, ordre)
        ON CONFLICT DO NOTHING;

        ALTER TABLE vetements DROP COLUMN tailles;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS commandes (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_client TEXT NOT NULL,
    email      TEXT NOT NULL,
    adresse    TEXT NOT NULL,
    total      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    statut     TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'expediee', 'annulee')),
    cree_le    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_commande (
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    commande_id   INT NOT NULL REFERENCES commandes (id) ON DELETE CASCADE,
    vetement_id   INT REFERENCES vetements (id) ON DELETE SET NULL,
    nom           TEXT NOT NULL,
    taille        TEXT NOT NULL,
    prix_unitaire NUMERIC(10, 2) NOT NULL,
    quantite      INT NOT NULL CHECK (quantite > 0)
);

COMMIT;
