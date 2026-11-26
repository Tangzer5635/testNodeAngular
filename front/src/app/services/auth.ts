import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const CLE_JETON = 'jeton';

// Date d'expiration du jeton (en millisecondes), lue dans sa partie centrale (le « payload »)
const lireExpiration = (jeton: string): number | null => {
  try {
    const contenu = JSON.parse(atob(jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof contenu.exp === 'number' ? contenu.exp * 1000 : null;
  } catch {
    return null;
  }
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = `${environment.apiUrl}/auth/login`;
  private minuteur?: ReturnType<typeof setTimeout>;

  readonly jeton = signal<string | null>(null);
  readonly estConnecte = computed(() => this.jeton() !== null);

  constructor() {
    const jeton = localStorage.getItem(CLE_JETON);
    if (jeton) {
      this.enregistrer(jeton);
    }
  }

  connexion(email: string, motDePasse: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.url, { email, motDePasse }).pipe(
      tap(reponse => this.enregistrer(reponse.token)),
    );
  }

  deconnexion(): void {
    clearTimeout(this.minuteur);
    localStorage.removeItem(CLE_JETON);
    this.jeton.set(null);
  }

  // Garde le jeton s'il n'est pas expiré, et programme la déconnexion automatique
  // au moment exact où il expire (sinon le header afficherait « Administration » trop longtemps).
  private enregistrer(jeton: string): void {
    const expiration = lireExpiration(jeton);
    if (expiration === null || expiration <= Date.now()) {
      this.deconnexion();
      return;
    }
    localStorage.setItem(CLE_JETON, jeton);
    this.jeton.set(jeton);

    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => {
      this.deconnexion();
      // Si on était sur une page d'administration, on la quitte
      if (this.router.url.startsWith('/admin')) {
        this.router.navigate(['/connexion'], { queryParams: { retour: this.router.url } });
      }
    }, expiration - Date.now());
  }
}
