import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VetementService } from '../../services/vetement';
import { PanierService } from '../../services/panier';
import { Vetement } from '../../models/vetement';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fiche',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './fiche.html',
  styleUrl: './fiche.scss',
})
export class Fiche {
  private vetementService = inject(VetementService);
  private panier = inject(PanierService);
  private route = inject(ActivatedRoute);

  protected vetement = signal<Vetement | null>(null);
  protected erreur = signal<string | null>(null);
  protected imagesUrl = environment.imagesUrl;

  protected tailleChoisie = signal<string | null>(null);
  protected ajoute = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.vetementService.getById(id).subscribe({
      next: data => this.vetement.set(data),
      error: err => this.erreur.set(
        err.status === 404 ? "Ce vêtement n'existe pas." : 'Impossible de charger ce vêtement.'
      ),
    });
  }

  protected choisirTaille(taille: string) {
    this.tailleChoisie.set(taille);
    this.ajoute.set(false);
  }

  protected ajouterAuPanier() {
    const vetement = this.vetement();
    const taille = this.tailleChoisie();
    if (!vetement || !taille) {
      return;
    }
    this.panier.ajouter(vetement, taille);
    this.ajoute.set(true);
  }
}