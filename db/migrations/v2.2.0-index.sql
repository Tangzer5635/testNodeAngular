CREATE INDEX IF NOT EXISTS commandes_statut_idx ON commandes (statut);
CREATE INDEX IF NOT EXISTS commandes_utilisateur_idx ON commandes (utilisateur_id);
CREATE INDEX IF NOT EXISTS lignes_commande_commande_idx ON lignes_commande (commande_id);
