import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { VetementService } from '../../services/vetement';
import { stockTotal, Vetement } from '../../models/vetement';
import { Pagination } from '../../components/pagination/pagination';

const PAR_PAGE = 20;

@Component({
  selector: 'app-admin',
  imports: [CurrencyPipe, RouterLink, ReactiveFormsModule, Pagination],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private vetementService = inject(VetementService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recharger = new Subject<void>();

  protected vetements = signal<Vetement[]>([]);
  protected total = signal(0);
  protected page = signal(1);
  protected nbPages = computed(() => Math.max(1, Math.ceil(this.total() / PAR_PAGE)));
  protected erreur = signal<string | null>(null);
  protected chargement = signal(true);
  protected recherche = new FormControl('', { nonNullable: true });
  protected stockTotal = stockTotal;

  constructor() {
    combineLatest([this.route.queryParamMap, this.recharger.pipe(startWith(undefined))])
      .pipe(
        tap(([params]) => {
          this.page.set(Math.max(1, Math.floor(Number(params.get('page'))) || 1));
          this.recherche.setValue(params.get('recherche') ?? '', { emitEvent: false });
          this.chargement.set(true);
        }),
        switchMap(([params]) =>
          this.vetementService
            .getPage({ recherche: params.get('recherche') ?? undefined }, this.page(), PAR_PAGE)
            .pipe(
              catchError(() => {
                this.erreur.set('Impossible de charger les vêtements.');
                return of(null);
              })
            )
        ),
        takeUntilDestroyed()
      )
      .subscribe(resultat => {
        if (resultat) {
          this.vetements.set(resultat.vetements);
          this.total.set(resultat.total);
          if (resultat.vetements.length === 0 && this.page() > 1) {
            this.allerA(this.nbPages());
          }
        }
        this.chargement.set(false);
      });

    this.recherche.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(texte =>
        this.router.navigate([], { queryParams: { recherche: texte.trim() || null, page: null }, queryParamsHandling: 'merge' })
      );
  }

  protected allerA(page: number) {
    this.router.navigate([], { queryParams: { page: page === 1 ? null : page }, queryParamsHandling: 'merge' });
  }

  protected tailles(vetement: Vetement): string {
    return vetement.tailles.map(t => `${t.taille} : ${t.stock}`).join(' · ');
  }

  protected supprimer(vetement: Vetement) {
    if (!confirm(`Supprimer « ${vetement.nom} » ?`)) {
      return;
    }
    this.erreur.set(null);
    this.vetementService.delete(vetement.id).subscribe({
      next: () => this.recharger.next(),
      error: () => this.erreur.set(`Impossible de supprimer « ${vetement.nom} ».`),
    });
  }
}
