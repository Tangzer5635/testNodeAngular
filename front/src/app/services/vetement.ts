import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vetement } from '../models/vetement';
import { environment } from '../../environments/environment';

export interface FiltresVetements {
  categorie?: string;
  recherche?: string;
  tri?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VetementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vetements`;

  getAll(filtres: FiltresVetements = {}): Observable<Vetement[]> {
  let params = new HttpParams();
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur) {
      params = params.set(cle, valeur);
    }
  }
  return this.http.get<Vetement[]>(this.apiUrl, { params });
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