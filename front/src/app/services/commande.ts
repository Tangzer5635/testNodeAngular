import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande, NouvelleCommande, StatutCommande } from '../models/commande';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommandeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/commandes`;

  passer(commande: NouvelleCommande): Observable<{ id: number; total: number }> {
    return this.http.post<{ id: number; total: number }>(this.apiUrl, commande);
  }

  getAll(statut?: StatutCommande): Observable<Commande[]> {
    const params = statut ? new HttpParams().set('statut', statut) : undefined;
    return this.http.get<Commande[]>(this.apiUrl, { params });
  }

  changerStatut(id: number, statut: StatutCommande): Observable<Commande> {
    return this.http.patch<Commande>(`${this.apiUrl}/${id}`, { statut });
  }
}
