export interface TailleStock {
  taille: string;
  stock: number;
}

export interface Vetement {
  id: number;
  nom: string;
  description: string;
  prix: number;
  tailles: TailleStock[];
  image: string;
  categorie: string;
}

// Nombre total de pièces disponibles, toutes tailles confondues
export const stockTotal = (vetement: Vetement): number =>
  vetement.tailles.reduce((somme, t) => somme + t.stock, 0);
