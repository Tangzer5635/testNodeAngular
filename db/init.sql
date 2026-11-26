
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
    tailles      TEXT[] NOT NULL DEFAULT '{}',
    categorie_id INT NOT NULL REFERENCES categories (id)
);

INSERT INTO categories (nom) VALUES
    ('t-shirts'),
    ('pantalons'),
    ('vestes'),
    ('sweats');

-- categorie_id est retrouvé d'après le nom de la catégorie (sous-requête),
-- pour ne pas dépendre des ids générés.
INSERT INTO vetements (nom, description, prix, image, tailles, categorie_id) VALUES
    ('T-shirt blanc classique',
     'T-shirt blanc en coton, confortable et facile à porter au quotidien.',
     19.99, 'tshirt-blanc.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 't-shirts')),

    ('T-shirt noir oversize',
     'T-shirt noir coupe oversize pour un style décontracté.',
     24.99, 'tshirt-noir.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 't-shirts')),

    ('Jean slim bleu',
     'Jean slim bleu avec une coupe moderne et confortable.',
     49.99, 'jean-bleu.jpg', ARRAY['36', '38', '40', '42', '44'],
     (SELECT id FROM categories WHERE nom = 'pantalons')),

    ('Pantalon cargo beige',
     'Pantalon cargo beige avec plusieurs poches pratiques.',
     54.99, 'cargo-beige.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 'pantalons')),

    ('Veste en jean',
     'Veste en jean intemporelle, idéale pour la mi-saison.',
     69.99, 'veste-jean.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 'vestes')),

    ('Blouson noir',
     'Blouson noir élégant avec fermeture zippée.',
     89.99, 'blouson-noir.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 'vestes')),

    ('Sweat à capuche gris',
     'Sweat à capuche gris en coton doux avec poche kangourou.',
     39.99, 'sweat-gris.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 'sweats')),

    ('Sweat beige',
     'Sweat beige minimaliste, parfait pour un look casual.',
     44.99, 'sweat-beige.jpg', ARRAY['S', 'M', 'L', 'XL'],
     (SELECT id FROM categories WHERE nom = 'sweats'));
