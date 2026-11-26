import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { VetementService } from '../../services/vetement';
import { CategorieService } from '../../services/categorie';
import { Vetement } from '../../models/vetement';
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

  // Filtres actuels, recopiés depuis l'URL (pour savoir quoi mettre en évidence)
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

    // 1. L'URL change → on recharge les vêtements avec les filtres de l'URL
    this.route.queryParamMap.pipe(
      switchMap(params => {
        const filtres = {
          categorie: params.get('categorie') ?? undefined,
          recherche: params.get('recherche') ?? undefined,
          tri: params.get('tri') ?? undefined,
        };

        this.categorie.set(filtres.categorie ?? null);
        this.tri.set(filtres.tri ?? 'recent');
        // emitEvent: false → ne pas déclencher valueChanges (sinon : boucle URL ↔ champ)
        this.recherche.setValue(filtres.recherche ?? '', { emitEvent: false });
        this.erreur.set(null);

        // switchMap annule la requête précédente si les filtres changent avant sa réponse
        return this.vetementService.getAll(filtres).pipe(
          // catchError ICI (et pas plus bas) : une erreur ne doit pas arrêter l'écoute de l'URL
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

    // 2. L'utilisateur tape dans la recherche → on met à jour l'URL quand il s'arrête de taper
    this.recherche.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(texte => this.appliquerFiltres({ recherche: texte.trim() || null }));
  }

  protected choisirCategorie(categorie: string | null) {
    this.appliquerFiltres({ categorie });
  }

  protected changerTri(tri: string) {
    // « recent » est le tri par défaut : inutile de l'écrire dans l'URL
    this.appliquerFiltres({ tri: tri === 'recent' ? null : tri });
  }

  protected reinitialiser() {
    this.appliquerFiltres({ categorie: null, recherche: null, tri: null });
  }

  // Modifie seulement les paramètres de l'URL (null = supprimer le paramètre)
  private appliquerFiltres(changements: Record<string, string | null>) {
    this.router.navigate([], { queryParams: changements, queryParamsHandling: 'merge' });
  }
}