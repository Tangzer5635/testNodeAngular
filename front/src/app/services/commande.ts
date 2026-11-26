import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  Commande, CompteursCommandes, FiltresCommandes, NouvelleCommande, StatutCommande,
} from '../models/commande';
import { environment } from '../../environments/environment';

export interface PageCommandes {
  commandes: Commande[];
  total: number;
}

const enParametres = (valeurs: object): HttpParams =>
  Object.entries(valeurs).reduce(
    (params, [cle, valeur]) => (valeur === undefined || valeur === null || valeur === '' ? params : params.set(cle, valeur)),
    new HttpParams()
  );

@Injectable({
  providedIn: 'root',
})
export class CommandeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/commandes`;

  passer(commande: NouvelleCommande): Observable<{ id: number; total: number }> {
    return this.http.post<{ id: number; total: number }>(this.apiUrl, commande);
  }

  getAll(filtres: FiltresCommandes = {}): Observable<PageCommandes> {
    return this.lirePage(this.apiUrl, enParametres(filtres));
  }

  getCompteurs(filtres: Pick<FiltresCommandes, 'recherche' | 'du' | 'au'> = {}): Observable<CompteursCommandes> {
    return this.http.get<CompteursCommandes>(`${this.apiUrl}/compteurs`, { params: enParametres(filtres) });
  }

  getMiennes(page = 1): Observable<PageCommandes> {
    return this.lirePage(`${this.apiUrl}/miennes`, enParametres({ page }));
  }

  changerStatut(id: number, statut: StatutCommande): Observable<Commande> {
    return this.http.patch<Commande>(`${this.apiUrl}/${id}`, { statut });
  }

  private lirePage(url: string, params: HttpParams): Observable<PageCommandes> {
    return this.http.get<Commande[]>(url, { params, observe: 'response' }).pipe(
      map(reponse => ({
        commandes: reponse.body ?? [],
        total: Number(reponse.headers.get('X-Total-Count') ?? reponse.body?.length ?? 0),
      }))
    );
  }
}
