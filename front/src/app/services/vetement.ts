import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vetement } from '../models/vetement';

@Injectable({
  providedIn: 'root',
})
export class VetementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/vetements';

  getAll(): Observable<Vetement[]> {
    return this.http.get<Vetement[]>(this.apiUrl);
  }

  getById(id: number): Observable<Vetement> {
    return this.http.get<Vetement>(`${this.apiUrl}/${id}`);
  }

  create(vetement: Vetement): Observable<Vetement> {
    return this.http.post<Vetement>(this.apiUrl, vetement);
  }

  update(id: number, vetement: Vetement): Observable<Vetement> {
    return this.http.put<Vetement>(`${this.apiUrl}/${id}`, vetement);
  } 

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}