import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PanierService } from '../../services/panier';
import { CommandeService } from '../../services/commande';

@Component({
  selector: 'app-commande',
  imports: [CurrencyPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './commande.html',
  styleUrl: './commande.scss',
})
export class Commande {
  protected panier = inject(PanierService);
  private commandeService = inject(CommandeService);
  private fb = inject(FormBuilder);

  protected erreur = signal<string | null>(null);
  protected information = signal<string | null>(null);
  protected enCours = signal(false);
  protected confirmation = signal<{ id: number; total: number; nom: string } | null>(null);

  protected commandeForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    adresse: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  constructor() {
    this.panier.actualiser().subscribe(message => this.information.set(message));
  }

  protected commander() {
    if (this.commandeForm.invalid) {
      this.commandeForm.markAllAsTouched();
      return;
    }
    const client = this.commandeForm.getRawValue();
    const lignes = this.panier.lignes().map(l => ({
      vetementId: l.vetementId,
      taille: l.taille,
      quantite: l.quantite,
    }));

    this.erreur.set(null);
    this.enCours.set(true);
    this.commandeService.passer({ client, lignes }).subscribe({
      next: reponse => {
        this.confirmation.set({ ...reponse, nom: client.nom });
        this.panier.vider();
        this.enCours.set(false);
      },
      error: err => {
        this.enCours.set(false);
        if (err.status === 409) {
          this.erreur.set(`${err.error?.message ?? 'Stock insuffisant'}. Ton panier a été mis à jour, vérifie-le avant de valider.`);
          this.panier.actualiser().subscribe(message => this.information.set(message));
        } else if (err.status === 400 || err.status === 429) {
          this.erreur.set(err.error?.message ?? 'Commande invalide.');
        } else {
          this.erreur.set('Impossible de passer la commande. Réessaie dans un instant.');
        }
      },
    });
  }
}
