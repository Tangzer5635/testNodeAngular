import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { VetementService } from '../../services/vetement';
import { CategorieService } from '../../services/categorie';
import { stockTotal, Vetement } from '../../models/vetement';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-catalogue',
  imports: [CurrencyPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class Catalogue {
  private vetementService = inject(VetementService);
  private categorieService = inject(CategorieService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected vetements = signal<Vetement[]>([]);
  protected categories = signal<string[]>([]);
  protected erreur = signal<string | null>(null);
  protected chargement = signal(true);
  protected imagesUrl = environment.imagesUrl;
  protected stockTotal = stockTotal;

  protected categorie = signal<string | null>(null);
  protected tri = signal('recent');
  protected recherche = new FormControl('', { nonNullable: true });

  protected readonly tris = [
    { valeur: 'recent', libelle: 'Nouveautés' },
    { valeur: 'prix_asc', libelle: 'Prix croissant' },
    { valeur: 'prix_desc', libelle: 'Prix décroissant' },
    { valeur: 'nom', libelle: 'Nom (A → Z)' },
  ];

  constructor() {
    this.categorieService.getAll().subscribe({
      next: categories => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    this.route.queryParamMap.pipe(
      switchMap(params => {
        const filtres = {
          categorie: params.get('categorie') ?? undefined,
          recherche: params.get('recherche') ?? undefined,
          tri: params.get('tri') ?? undefined,
        };

        this.categorie.set(filtres.categorie ?? null);
        this.tri.set(filtres.tri ?? 'recent');
        this.recherche.setValue(filtres.recherche ?? '', { emitEvent: false });
        this.erreur.set(null);

        return this.vetementService.getAll(filtres).pipe(
          catchError(() => {
            this.erreur.set('Impossible de charger le catalogue.');
            return of([]);
          }),
        );
      }),
    ).subscribe(vetements => {
      this.vetements.set(vetements);
      this.chargement.set(false);
    });

    this.recherche.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(texte => this.appliquerFiltres({ recherche: texte.trim() || null }));
  }

  protected choisirCategorie(categorie: string | null) {
    this.appliquerFiltres({ categorie });
  }

  protected changerTri(tri: string) {
    this.appliquerFiltres({ tri: tri === 'recent' ? null : tri });
  }

  protected reinitialiser() {
    this.appliquerFiltres({ categorie: null, recherche: null, tri: null });
  }

  private appliquerFiltres(changements: Record<string, string | null>) {
    this.router.navigate([], { queryParams: changements, queryParamsHandling: 'merge' });
  }
}
