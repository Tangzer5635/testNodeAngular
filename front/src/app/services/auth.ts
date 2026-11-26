import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const CLE_JETON = 'jeton';

const lireJetonValide = (): string | null => {
  const jeton = localStorage.getItem(CLE_JETON);
  if (!jeton) {
    return null;
  }
  try {
    const contenu = JSON.parse(atob(jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (contenu.exp * 1000 > Date.now()) {
      return jeton;
    }
  } catch {
  }
  localStorage.removeItem(CLE_JETON);
  return null;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth/login`;

  readonly jeton = signal<string | null>(lireJetonValide());
  readonly estConnecte = computed(() => this.jeton() !== null);

  connexion(email: string, motDePasse: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.url, { email, motDePasse }).pipe(
      tap(reponse => {
        localStorage.setItem(CLE_JETON, reponse.token);
        this.jeton.set(reponse.token);
      }),
    );
  }

  deconnexion(): void {
    localStorage.removeItem(CLE_JETON);
    this.jeton.set(null);
  }
}