import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VetementService } from '../../services/vetement';
import { Vetement } from '../../models/vetement';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-catalogue',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class Catalogue {
  private vetementService = inject(VetementService);
  protected vetements = signal<Vetement[]>([]);
  protected erreur = signal<string | null>(null);
  protected chargement = signal(true);
  protected imagesUrl = environment.imagesUrl;

  constructor() {
    this.vetementService.getAll().subscribe({
      next: data => {
        this.vetements.set(data);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger le catalogue.');
        this.chargement.set(false);
      },
    });
  }
}
