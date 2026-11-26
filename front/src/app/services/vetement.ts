import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Vetement } from '../models/vetement';
import { environment } from '../../environments/environment';

export interface FiltresVetements {
  categorie?: string;
  recherche?: string;
  tri?: string;
}

export interface PageVetements {
  vetements: Vetement[];
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
export class VetementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vetements`;

  getAll(filtres: FiltresVetements = {}): Observable<Vetement[]> {
    return this.http.get<Vetement[]>(this.apiUrl, { params: enParametres(filtres) });
  }

  getPage(filtres: FiltresVetements, page: number, parPage: number): Observable<PageVetements> {
    return this.http
      .get<Vetement[]>(this.apiUrl, { params: enParametres({ ...filtres, page, parPage }), observe: 'response' })
      .pipe(
        map(reponse => ({
          vetements: reponse.body ?? [],
          total: Number(reponse.headers.get('X-Total-Count') ?? reponse.body?.length ?? 0),
        }))
      );
  }

  getById(id: number): Observable<Vetement> {
    return this.http.get<Vetement>(`${this.apiUrl}/${id}`);
  }

  create(vetement: Omit<Vetement, 'id'>): Observable<Vetement> {
    return this.http.post<Vetement>(this.apiUrl, vetement);
  }

  update(id: number, vetement: Omit<Vetement, 'id'>): Observable<Vetement> {
    return this.http.put<Vetement>(`${this.apiUrl}/${id}`, vetement);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  envoyerImage(fichier: File): Observable<{ image: string }> {
    const donnees = new FormData();
    donnees.append('image', fichier);
    return this.http.post<{ image: string }>(`${environment.apiUrl}/images`, donnees);
  }
}