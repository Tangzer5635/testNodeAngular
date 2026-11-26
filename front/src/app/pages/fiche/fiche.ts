import { Component, inject, signal } from '@angular/core';
import { VetementService } from '../../services/vetement';
import { Vetement } from '../../models/vetement';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-fiche',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './fiche.html',
  styleUrl: './fiche.scss',
})
export class Fiche {
  private vetementService = inject(VetementService);
  private route = inject(ActivatedRoute);
  protected vetement = signal<Vetement | null>(null);
  protected erreur = signal<string | null>(null);
  protected imagesUrl = environment.imagesUrl;

constructor() {
  const id = Number(this.route.snapshot.paramMap.get('id'));
  this.vetementService.getById(id).subscribe({
    next: data => this.vetement.set(data),
    error: err => this.erreur.set(
      err.status === 404 ? "Ce vêtement n'existe pas." : 'Impossible de charger ce vêtement.'
    ),
  });
}
}