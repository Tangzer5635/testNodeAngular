import { computed, effect, Injectable, signal } from '@angular/core';
import { Vetement } from '../models/vetement';

export interface LignePanier {
  vetementId: number;
  nom: string;
  prix: number;
  image: string;
  taille: string;
  quantite: number;
}

const CLE_PANIER = 'panier';
export const QUANTITE_MAX = 10;

// Une ligne venant du localStorage peut avoir été modifiée à la main : on vérifie sa forme
const estLigneValide = (l: any): l is LignePanier =>
  l !== null && typeof l === 'object' &&
  Number.isInteger(l.vetementId) && typeof l.nom === 'string' && typeof l.prix === 'number' &&
  typeof l.taille === 'string' && Number.isInteger(l.quantite) && l.quantite > 0;

const lirePanier = (): LignePanier[] => {
  try {
    const contenu = JSON.parse(localStorage.getItem(CLE_PANIER) ?? '[]');
    return Array.isArray(contenu)
      ? contenu.filter(estLigneValide).map(l => ({ ...l, quantite: Math.min(l.quantite, QUANTITE_MAX) }))
      : [];
  } catch {
    return [];
  }
};

@Injectable({
  providedIn: 'root',
})
export class PanierService {
  readonly lignes = signal<LignePanier[]>(lirePanier());
  readonly nombreArticles = computed(() =>
    this.lignes().reduce((somme, ligne) => somme + ligne.quantite, 0)
  );
  readonly total = computed(() =>
    this.lignes().reduce((somme, ligne) => somme + ligne.prix * ligne.quantite, 0)
  );

  constructor() {
    // Relancé automatiquement à chaque changement de lignes() : sauvegarde du panier
    effect(() => {
      localStorage.setItem(CLE_PANIER, JSON.stringify(this.lignes()));
    });
  }

  ajouter(vetement: Vetement, taille: string): void {
    this.lignes.update(lignes => {
      const existante = lignes.find(l => l.vetementId === vetement.id && l.taille === taille);
      if (existante) {
        // Même vêtement, même taille : on augmente la quantité
        return lignes.map(l =>
          l === existante ? { ...l, quantite: Math.min(l.quantite + 1, QUANTITE_MAX) } : l
        );
      }
      return [
        ...lignes,
        {
          vetementId: vetement.id,
          nom: vetement.nom,
          prix: vetement.prix,
          image: vetement.image,
          taille,
          quantite: 1,
        },
      ];
    });
  }

  changerQuantite(ligne: LignePanier, quantite: number): void {
    if (quantite <= 0) {
      this.retirer(ligne);
      return;
    }
    this.lignes.update(lignes =>
      lignes.map(l => (l === ligne ? { ...l, quantite: Math.min(quantite, QUANTITE_MAX) } : l))
    );
  }

  retirer(ligne: LignePanier): void {
    this.lignes.update(lignes => lignes.filter(l => l !== ligne));
  }

  vider(): void {
    this.lignes.set([]);
  }

  // Met le panier à jour avec les vêtements actuels de la boutique (nom, prix, image).
  // Retire les lignes dont le vêtement a été supprimé ou dont la taille n'est plus proposée.
  // Renvoie le nombre de lignes retirées.
  synchroniser(vetements: Vetement[]): number {
    const parId = new Map(vetements.map(v => [v.id, v]));
    const avant = this.lignes();
    const apres = avant
      .filter(l => parId.get(l.vetementId)?.tailles.includes(l.taille))
      .map(l => {
        const v = parId.get(l.vetementId)!;
        return { ...l, nom: v.nom, prix: v.prix, image: v.image };
      });
    this.lignes.set(apres);
    return avant.length - apres.length;
  }
}