import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategorieService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/categories';

  getAll(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }
}