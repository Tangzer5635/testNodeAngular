import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommandeService } from '../../services/commande';
import { Commande, LIBELLES_STATUT } from '../../models/commande';

@Component({
  selector: 'app-mon-compte',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './mon-compte.html',
  styleUrl: './mon-compte.scss',
})
export class MonCompte {
  protected auth = inject(AuthService);
  protected commandes = signal<Commande[] | null>(null);
  protected erreur = signal<string | null>(null);
  protected libelles = LIBELLES_STATUT;

  constructor() {
    inject(CommandeService).getMiennes().subscribe({
      next: commandes => this.commandes.set(commandes),
      error: () => this.erreur.set('Impossible de charger tes commandes.'),
    });
  }
}
