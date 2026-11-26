import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, forkJoin, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { CommandeService } from '../../services/commande';
import {
  Commande, CompteursCommandes, LIBELLES_STATUT, StatutCommande, TriCommandes,
} from '../../models/commande';
import { Pagination } from '../../components/pagination/pagination';

type FiltreStatut = StatutCommande | 'toutes';

interface Etat {
  statut: FiltreStatut;
  recherche: string;
  du: string;
  au: string;
  tri: TriCommandes;
  page: number;
}

const STATUTS: FiltreStatut[] = ['en_attente', 'expediee', 'annulee', 'toutes'];
const TRIS: TriCommandes[] = ['recent', 'ancien', 'montant_desc', 'montant_asc'];
const PAR_PAGE = 20;

const lireEtat = (p: ParamMap): Etat => {
  const statut = p.get('statut') as FiltreStatut;
  const tri = p.get('tri') as TriCommandes;
  return {
    statut: STATUTS.includes(statut) ? statut : 'en_attente',
    recherche: p.get('recherche') ?? '',
    du: p.get('du') ?? '',
    au: p.get('au') ?? '',
    tri: TRIS.includes(tri) ? tri : 'recent',
    page: Math.max(1, Math.floor(Number(p.get('page'))) || 1),
  };
};

@Component({
  selector: 'app-admin-commandes',
  imports: [CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule, Pagination],
  templateUrl: './admin-commandes.html',
  styleUrl: './admin-commandes.scss',
})
export class AdminCommandes {
  private commandeService = inject(CommandeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recharger = new Subject<void>();

  protected etat = signal<Etat>(lireEtat(this.route.snapshot.queryParamMap));
  protected commandes = signal<Commande[]>([]);
  protected compteurs = signal<CompteursCommandes | null>(null);
  protected total = signal(0);
  protected erreur = signal<string | null>(null);
  protected chargement = signal(true);
  protected libelles = LIBELLES_STATUT;
  protected recherche = new FormControl('', { nonNullable: true });

  protected nbPages = computed(() => Math.max(1, Math.ceil(this.total() / PAR_PAGE)));
  protected filtresActifs = computed(() => {
    const e = this.etat();
    return e.recherche !== '' || e.du !== '' || e.au !== '' || e.tri !== 'recent';
  });

  protected readonly statuts: { valeur: FiltreStatut; libelle: string }[] = [
    { valeur: 'en_attente', libelle: 'En attente' },
    { valeur: 'expediee', libelle: 'Expédiées' },
    { valeur: 'annulee', libelle: 'Annulées' },
    { valeur: 'toutes', libelle: 'Toutes' },
  ];

  protected readonly tris: { valeur: TriCommandes; libelle: string }[] = [
    { valeur: 'recent', libelle: 'Plus récentes' },
    { valeur: 'ancien', libelle: 'Plus anciennes' },
    { valeur: 'montant_desc', libelle: 'Montant décroissant' },
    { valeur: 'montant_asc', libelle: 'Montant croissant' },
  ];

  constructor() {
    combineLatest([this.route.queryParamMap, this.recharger.pipe(startWith(undefined))])
      .pipe(
        map(([params]) => lireEtat(params)),
        tap(etat => {
          this.etat.set(etat);
          this.recherche.setValue(etat.recherche, { emitEvent: false });
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap(etat => {
          const periode = { recherche: etat.recherche, du: etat.du, au: etat.au };
          return forkJoin({
            liste: this.commandeService.getAll({
              ...periode,
              statut: etat.statut === 'toutes' ? undefined : etat.statut,
              tri: etat.tri,
              page: etat.page,
            }),
            compteurs: this.commandeService.getCompteurs(periode),
          }).pipe(
            catchError(err => {
              this.erreur.set(err.error?.message ?? 'Impossible de charger les commandes.');
              return of(null);
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(resultat => {
        if (resultat) {
          this.commandes.set(resultat.liste.commandes);
          this.total.set(resultat.liste.total);
          this.compteurs.set(resultat.compteurs);
        }
        this.chargement.set(false);
      });

    this.recherche.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(texte => this.appliquer({ recherche: texte.trim() || null }));
  }

  protected nombre(compteurs: CompteursCommandes, statut: FiltreStatut): number {
    return statut === 'toutes' ? compteurs.total : compteurs[statut];
  }

  protected choisirStatut(statut: FiltreStatut) {
    this.appliquer({ statut: statut === 'en_attente' ? null : statut });
  }

  protected changerDate(nom: 'du' | 'au', evenement: Event) {
    this.appliquer({ [nom]: (evenement.target as HTMLInputElement).value || null });
  }

  protected changerTri(evenement: Event) {
    const tri = (evenement.target as HTMLSelectElement).value;
    this.appliquer({ tri: tri === 'recent' ? null : tri });
  }

  protected effacer() {
    this.appliquer({ recherche: null, du: null, au: null, tri: null });
  }

  protected allerA(page: number) {
    this.appliquer({ page: page === 1 ? null : page }, true);
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
      next: () => this.recharger.next(),
      error: err => this.erreur.set(err.error?.message ?? 'Impossible de modifier la commande.'),
    });
  }

  private appliquer(changements: Record<string, string | number | null>, garderPage = false) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: garderPage ? changements : { ...changements, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
