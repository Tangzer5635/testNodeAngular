export type StatutCommande = 'en_attente' | 'expediee' | 'annulee';

export const LIBELLES_STATUT: Record<StatutCommande, string> = {
  en_attente: 'En attente',
  expediee: 'Expédiée',
  annulee: 'Annulée',
};

export interface LigneCommande {
  vetementId: number | null; // null si le vêtement a été supprimé depuis
  nom: string;
  taille: string;
  prixUnitaire: number;
  quantite: number;
}

export interface Commande {
  id: number;
  nomClient: string;
  email: string;
  adresse: string;
  total: number;
  statut: StatutCommande;
  creeLe: string;
  lignes: LigneCommande[];
}

// Ce que le front envoie : jamais de prix, c'est le back qui les lit dans la base
export interface NouvelleCommande {
  client: { nom: string; email: string; adresse: string };
  lignes: { vetementId: number; taille: string; quantite: number }[];
}
