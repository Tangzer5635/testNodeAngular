import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VetementService } from '../../services/vetement';
import { Vetement } from '../../models/vetement';

@Component({
  selector: 'app-admin',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private vetementService = inject(VetementService);
  protected vetements = signal<Vetement[]>([]);
  protected erreur = signal<string | null>(null);

  constructor() {
    this.vetementService.getAll().subscribe({
      next: data => this.vetements.set(data),
      error: () => this.erreur.set('Impossible de charger les vêtements.'),
    });
  }

  protected supprimer(vetement: Vetement) {
    if (!confirm(`Supprimer « ${vetement.nom} » ?`)) {
      return;
    }
    this.erreur.set(null);
    this.vetementService.delete(vetement.id).subscribe({
      next: () => this.vetements.update(liste => liste.filter(v => v.id !== vetement.id)),
      error: () => this.erreur.set(`Impossible de supprimer « ${vetement.nom} ».`),
    });
  }
}