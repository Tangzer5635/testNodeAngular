import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LignePanier, PanierService, quantiteMaxLigne } from '../../services/panier';
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
  protected quantiteMax = quantiteMaxLigne;
  protected information = signal<string | null>(null);

  constructor() {
    this.panier.actualiser().subscribe(message => this.information.set(message));
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
}
