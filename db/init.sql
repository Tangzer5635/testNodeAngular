CREATE TABLE IF NOT EXISTS categories (
    id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vetements (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom          TEXT NOT NULL,
    description  TEXT,
    prix         NUMERIC(10, 2) NOT NULL CHECK (prix >= 0),
    image        TEXT,
    categorie_id INT NOT NULL REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS stocks (
    vetement_id INT  NOT NULL REFERENCES vetements (id) ON DELETE CASCADE,
    taille      TEXT NOT NULL,
    quantite    INT  NOT NULL DEFAULT 0 CHECK (quantite >= 0),
    ordre       INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (vetement_id, taille)
);

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

CREATE TABLE IF NOT EXISTS utilisateurs (
    id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email    TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL
);

INSERT INTO categories (nom) VALUES
    ('t-shirts'),
    ('pantalons'),
    ('vestes'),
    ('sweats');

INSERT INTO vetements (nom, description, prix, image, categorie_id) VALUES
    ('T-shirt blanc classique',
     'T-shirt blanc en coton, confortable et facile à porter au quotidien.',
     19.99, 'tshirt-blanc.jpg',
     (SELECT id FROM categories WHERE nom = 't-shirts')),

    ('T-shirt noir oversize',
     'T-shirt noir coupe oversize pour un style décontracté.',
     24.99, 'tshirt-noir.jpg',
     (SELECT id FROM categories WHERE nom = 't-shirts')),

    ('Jean slim bleu',
     'Jean slim bleu avec une coupe moderne et confortable.',
     49.99, 'jean-bleu.jpg',
     (SELECT id FROM categories WHERE nom = 'pantalons')),

    ('Pantalon cargo beige',
     'Pantalon cargo beige avec plusieurs poches pratiques.',
     54.99, 'cargo-beige.jpg',
     (SELECT id FROM categories WHERE nom = 'pantalons')),

    ('Veste en jean',
     'Veste en jean intemporelle, idéale pour la mi-saison.',
     69.99, 'veste-jean.jpg',
     (SELECT id FROM categories WHERE nom = 'vestes')),

    ('Blouson noir',
     'Blouson noir élégant avec fermeture zippée.',
     89.99, 'blouson-noir.jpg',
     (SELECT id FROM categories WHERE nom = 'vestes')),

    ('Sweat à capuche gris',
     'Sweat à capuche gris en coton doux avec poche kangourou.',
     39.99, 'sweat-gris.jpg',
     (SELECT id FROM categories WHERE nom = 'sweats')),

    ('Sweat beige',
     'Sweat beige minimaliste, parfait pour un look casual.',
     44.99, 'sweat-beige.jpg',
     (SELECT id FROM categories WHERE nom = 'sweats'));

INSERT INTO stocks (vetement_id, taille, quantite, ordre)
SELECT v.id, s.taille, s.quantite, s.ordre
FROM vetements v
JOIN (VALUES
    ('T-shirt blanc classique', ARRAY['S', 'M', 'L', 'XL'],             ARRAY[8, 15, 12, 5]),
    ('T-shirt noir oversize',   ARRAY['S', 'M', 'L', 'XL'],             ARRAY[6, 10, 10, 4]),
    ('Jean slim bleu',          ARRAY['36', '38', '40', '42', '44'],    ARRAY[0, 4, 7, 5, 2]),
    ('Pantalon cargo beige',    ARRAY['S', 'M', 'L', 'XL'],             ARRAY[3, 6, 6, 2]),
    ('Veste en jean',           ARRAY['S', 'M', 'L', 'XL'],             ARRAY[2, 5, 3, 0]),
    ('Blouson noir',            ARRAY['S', 'M', 'L', 'XL'],             ARRAY[1, 3, 3, 1]),
    ('Sweat à capuche gris',    ARRAY['S', 'M', 'L', 'XL'],             ARRAY[10, 12, 9, 6]),
    ('Sweat beige',             ARRAY['S', 'M', 'L', 'XL'],             ARRAY[0, 0, 0, 0])
) AS d (nom, tailles, quantites) ON d.nom = v.nom
CROSS JOIN LATERAL unnest(d.tailles, d.quantites) WITH ORDINALITY AS s (taille, quantite, ordre);
