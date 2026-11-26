BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'utilisateurs' AND column_name = 'role') THEN
        ALTER TABLE utilisateurs ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'
            CHECK (role IN ('admin', 'client'));
        ALTER TABLE utilisateurs ALTER COLUMN role SET DEFAULT 'client';
    END IF;
END $$;

ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS cree_le TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS utilisateur_id INT REFERENCES utilisateurs (id) ON DELETE SET NULL;

COMMIT;
