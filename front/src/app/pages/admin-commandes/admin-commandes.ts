import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommandeService } from '../../services/commande';
import { Commande, LIBELLES_STATUT, StatutCommande } from '../../models/commande';

@Component({
  selector: 'app-admin-commandes',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './admin-commandes.html',
  styleUrl: './admin-commandes.scss',
})
export class AdminCommandes {
  private commandeService = inject(CommandeService);

  protected commandes = signal<Commande[]>([]);
  protected filtre = signal<StatutCommande | null>('en_attente');
  protected erreur = signal<string | null>(null);
  protected chargement = signal(true);
  protected libelles = LIBELLES_STATUT;

  protected readonly filtres: { valeur: StatutCommande | null; libelle: string }[] = [
    { valeur: 'en_attente', libelle: 'En attente' },
    { valeur: 'expediee', libelle: 'Expédiées' },
    { valeur: 'annulee', libelle: 'Annulées' },
    { valeur: null, libelle: 'Toutes' },
  ];

  constructor() {
    this.charger();
  }

  protected choisirFiltre(filtre: StatutCommande | null) {
    this.filtre.set(filtre);
    this.charger();
  }

  protected expedier(commande: Commande) {
    this.changerStatut(commande, 'expediee');
  }

  protected annuler(commande: Commande) {
    if (confirm(`Annuler la commande n°${commande.id} ? Les articles seront remis en stock.`)) {
      this.changerStatut(commande, 'annulee');
    }
  }

  private changerStatut(commande: Commande, statut: StatutCommande) {
    this.erreur.set(null);
    this.commandeService.changerStatut(commande.id, statut).subscribe({
      next: () => this.charger(),
      error: err => this.erreur.set(err.error?.message ?? 'Impossible de modifier la commande.'),
    });
  }

  private charger() {
    this.chargement.set(true);
    this.commandeService.getAll(this.filtre() ?? undefined).subscribe({
      next: commandes => {
        this.commandes.set(commandes);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger les commandes.');
        this.chargement.set(false);
      },
    });
  }
}
