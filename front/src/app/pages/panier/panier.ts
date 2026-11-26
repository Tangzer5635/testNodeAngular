import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LignePanier, PanierService, QUANTITE_MAX } from '../../services/panier';
import { VetementService } from '../../services/vetement';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-panier',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './panier.html',
  styleUrl: './panier.scss',
})
export class Panier {
  protected panier = inject(PanierService);
  protected imagesUrl = environment.imagesUrl;
  protected quantiteMax = QUANTITE_MAX;
  protected information = signal<string | null>(null);

  constructor() {
    // Le panier est stocké dans le navigateur : les prix ont pu changer, des articles ont pu disparaître
    if (this.panier.lignes().length > 0) {
      inject(VetementService).getAll().subscribe({
        next: vetements => {
          const retirees = this.panier.synchroniser(vetements);
          if (retirees > 0) {
            this.information.set(
              retirees === 1
                ? "Un article n'est plus disponible : il a été retiré de ton panier."
                : `${retirees} articles ne sont plus disponibles : ils ont été retirés de ton panier.`
            );
          }
        },
        error: () => {}, // pas grave : on garde le panier tel quel
      });
    }
  }

  protected moins(ligne: LignePanier) {
    this.panier.changerQuantite(ligne, ligne.quantite - 1);
  }

  protected plus(ligne: LignePanier) {
    this.panier.changerQuantite(ligne, ligne.quantite + 1);
  }

  protected vider() {
    if (confirm('Vider le panier ?')) {
      this.panier.vider();
    }
  }

  protected commander() {
    alert('Démonstration : le paiement n\'est pas encore disponible.');
  }
}