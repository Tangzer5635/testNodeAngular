import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VetementService } from '../../services/vetement';
import { PanierService, QUANTITE_MAX } from '../../services/panier';
import { stockTotal, Vetement } from '../../models/vetement';
import { environment } from '../../../environments/environment';

const STOCK_FAIBLE = 3;

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
  protected stockFaible = STOCK_FAIBLE;

  protected tailleChoisie = signal<string | null>(null);
  protected ajoute = signal(false);

  protected epuise = computed(() => {
    const v = this.vetement();
    return v !== null && stockTotal(v) === 0;
  });

  protected stockChoisi = computed(() =>
    this.vetement()?.tailles.find(t => t.taille === this.tailleChoisie())?.stock ?? 0
  );

  protected peutAjouter = computed(() => {
    const v = this.vetement();
    const taille = this.tailleChoisie();
    if (!v || !taille) {
      return false;
    }
    return this.panier.quantiteDans(v.id, taille) < Math.min(this.stockChoisi(), QUANTITE_MAX);
  });

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
    if (!vetement || !taille || !this.peutAjouter()) {
      return;
    }
    this.panier.ajouter(vetement, taille);
    this.ajoute.set(true);
  }
}
