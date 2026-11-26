import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../services/auth';
import { CommandeService } from '../../services/commande';
import { Commande, LIBELLES_STATUT } from '../../models/commande';
import { Pagination } from '../../components/pagination/pagination';

const PAR_PAGE = 10;

@Component({
  selector: 'app-mon-compte',
  imports: [CurrencyPipe, DatePipe, RouterLink, Pagination],
  templateUrl: './mon-compte.html',
  styleUrl: './mon-compte.scss',
})
export class MonCompte {
  protected auth = inject(AuthService);
  private commandeService = inject(CommandeService);
  private router = inject(Router);

  protected commandes = signal<Commande[] | null>(null);
  protected total = signal(0);
  protected page = signal(1);
  protected nbPages = computed(() => Math.max(1, Math.ceil(this.total() / PAR_PAGE)));
  protected erreur = signal<string | null>(null);
  protected libelles = LIBELLES_STATUT;

  constructor() {
    inject(ActivatedRoute).queryParamMap
      .pipe(
        map(params => Math.max(1, Math.floor(Number(params.get('page'))) || 1)),
        tap(page => this.page.set(page)),
        switchMap(page =>
          this.commandeService.getMiennes(page).pipe(
            catchError(() => {
              this.erreur.set('Impossible de charger tes commandes.');
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(resultat => {
        if (resultat) {
          this.commandes.set(resultat.commandes);
          this.total.set(resultat.total);
        }
      });
  }

  protected allerA(page: number) {
    this.router.navigate([], { queryParams: { page: page === 1 ? null : page } });
  }
}
