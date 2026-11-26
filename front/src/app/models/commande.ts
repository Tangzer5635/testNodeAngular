export type StatutCommande = 'en_attente' | 'expediee' | 'annulee';

export const LIBELLES_STATUT: Record<StatutCommande, string> = {
  en_attente: 'En attente',
  expediee: 'Expédiée',
  annulee: 'Annulée',
};

export interface LigneCommande {
  vetementId: number | null;
  nom: string;
  taille: string;
  prixUnitaire: number;
  quantite: number;
}

export interface Commande {
  id: number;
  utilisateurId: number | null;
  nomClient: string;
  email: string;
  adresse: string;
  total: number;
  statut: StatutCommande;
  creeLe: string;
  lignes: LigneCommande[];
}

export interface NouvelleCommande {
  client: { nom: string; email: string; adresse: string };
  lignes: { vetementId: number; taille: string; quantite: number }[];
}
