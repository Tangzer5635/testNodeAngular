import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Vetement } from '../models/vetement';
import { VetementService } from './vetement';

export interface LignePanier {
  vetementId: number;
  nom: string;
  prix: number;
  image: string;
  taille: string;
  quantite: number;
  stock: number;
}

const CLE_PANIER = 'panier';
export const QUANTITE_MAX = 10;

export const quantiteMaxLigne = (ligne: LignePanier): number => Math.min(QUANTITE_MAX, ligne.stock);

const estLigneValide = (l: any): boolean =>
  l !== null && typeof l === 'object' &&
  Number.isInteger(l.vetementId) && typeof l.nom === 'string' && typeof l.prix === 'number' &&
  typeof l.taille === 'string' && Number.isInteger(l.quantite) && l.quantite > 0;

const lirePanier = (): LignePanier[] => {
  try {
    const contenu = JSON.parse(localStorage.getItem(CLE_PANIER) ?? '[]');
    return Array.isArray(contenu)
      ? contenu.filter(estLigneValide).map(l => ({
          ...l,
          stock: Number.isInteger(l.stock) ? l.stock : QUANTITE_MAX,
          quantite: Math.min(l.quantite, QUANTITE_MAX),
        }))
      : [];
  } catch {
    return [];
  }
};

@Injectable({
  providedIn: 'root',
})
export class PanierService {
  private vetementService = inject(VetementService);

  readonly lignes = signal<LignePanier[]>(lirePanier());
  readonly nombreArticles = computed(() =>
    this.lignes().reduce((somme, ligne) => somme + ligne.quantite, 0)
  );
  readonly total = computed(() =>
    this.lignes().reduce((somme, ligne) => somme + ligne.prix * ligne.quantite, 0)
  );

  constructor() {
    effect(() => {
      localStorage.setItem(CLE_PANIER, JSON.stringify(this.lignes()));
    });
  }

  quantiteDans(vetementId: number, taille: string): number {
    return this.lignes().find(l => l.vetementId === vetementId && l.taille === taille)?.quantite ?? 0;
  }

  ajouter(vetement: Vetement, taille: string): void {
    const stock = vetement.tailles.find(t => t.taille === taille)?.stock ?? 0;
    if (stock === 0) {
      return;
    }
    this.lignes.update(lignes => {
      const existante = lignes.find(l => l.vetementId === vetement.id && l.taille === taille);
      if (existante) {
        return lignes.map(l =>
          l === existante
            ? { ...l, stock, quantite: Math.min(l.quantite + 1, QUANTITE_MAX, stock) }
            : l
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
          stock,
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
      lignes.map(l => (l === ligne ? { ...l, quantite: Math.min(quantite, quantiteMaxLigne(l)) } : l))
    );
  }

  retirer(ligne: LignePanier): void {
    this.lignes.update(lignes => lignes.filter(l => l !== ligne));
  }

  vider(): void {
    this.lignes.set([]);
  }

  synchroniser(vetements: Vetement[]): string | null {
    const parId = new Map(vetements.map(v => [v.id, v]));
    let retirees = 0;
    let reduites = 0;
    const apres: LignePanier[] = [];

    for (const l of this.lignes()) {
      const vetement = parId.get(l.vetementId);
      const stock = vetement?.tailles.find(t => t.taille === l.taille)?.stock ?? 0;
      if (!vetement || stock === 0) {
        retirees++;
        continue;
      }
      const quantite = Math.min(l.quantite, stock, QUANTITE_MAX);
      if (quantite < l.quantite) {
        reduites++;
      }
      apres.push({ ...l, nom: vetement.nom, prix: vetement.prix, image: vetement.image, stock, quantite });
    }
    this.lignes.set(apres);

    const messages = [];
    if (retirees > 0) {
      messages.push(retirees === 1
        ? "Un article n'est plus disponible : il a été retiré de ton panier."
        : `${retirees} articles ne sont plus disponibles : ils ont été retirés de ton panier.`);
    }
    if (reduites > 0) {
      messages.push(reduites === 1
        ? 'Le stock a baissé : la quantité d\'un article a été réduite.'
        : `Le stock a baissé : la quantité de ${reduites} articles a été réduite.`);
    }
    return messages.length > 0 ? messages.join(' ') : null;
  }

  actualiser(): Observable<string | null> {
    if (this.lignes().length === 0) {
      return of(null);
    }
    return this.vetementService.getAll().pipe(
      map(vetements => this.synchroniser(vetements)),
      catchError(() => of(null)),
    );
  }
}
