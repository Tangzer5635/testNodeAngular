import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const CLE_JETON = 'jeton';
const PAGES_PRIVEES = ['/admin', '/mon-compte'];

export type Role = 'admin' | 'client';

export interface UtilisateurConnecte {
  id: number;
  email: string;
  nom: string;
  role: Role;
}

interface ContenuJeton {
  sub: number;
  email: string;
  nom?: string;
  role: Role;
  exp: number;
}

const lireContenu = (jeton: string): ContenuJeton | null => {
  try {
    const base64 = jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const octets = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const contenu = JSON.parse(new TextDecoder().decode(octets));
    const valide =
      typeof contenu.exp === 'number' &&
      contenu.exp * 1000 > Date.now() &&
      (contenu.role === 'admin' || contenu.role === 'client');
    return valide ? contenu : null;
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
  private url = `${environment.apiUrl}/auth`;
  private minuteur?: ReturnType<typeof setTimeout>;

  readonly jeton = signal<string | null>(null);

  readonly utilisateur = computed<UtilisateurConnecte | null>(() => {
    const jeton = this.jeton();
    const contenu = jeton ? lireContenu(jeton) : null;
    return contenu
      ? { id: contenu.sub, email: contenu.email, nom: contenu.nom ?? '', role: contenu.role }
      : null;
  });

  readonly estConnecte = computed(() => this.utilisateur() !== null);
  readonly estAdmin = computed(() => this.utilisateur()?.role === 'admin');
  readonly estClient = computed(() => this.utilisateur()?.role === 'client');

  constructor() {
    const jeton = localStorage.getItem(CLE_JETON);
    if (jeton && lireContenu(jeton)) {
      this.enregistrer(jeton);
    } else {
      localStorage.removeItem(CLE_JETON);
    }
  }

  connexion(email: string, motDePasse: string): Observable<UtilisateurConnecte> {
    return this.http
      .post<{ token: string }>(`${this.url}/login`, { email, motDePasse })
      .pipe(map(reponse => this.enregistrer(reponse.token)));
  }

  inscription(nom: string, email: string, motDePasse: string): Observable<UtilisateurConnecte> {
    return this.http
      .post<{ token: string }>(`${this.url}/inscription`, { nom, email, motDePasse })
      .pipe(map(reponse => this.enregistrer(reponse.token)));
  }

  deconnexion(): void {
    clearTimeout(this.minuteur);
    localStorage.removeItem(CLE_JETON);
    this.jeton.set(null);
  }

  private enregistrer(jeton: string): UtilisateurConnecte {
    const contenu = lireContenu(jeton);
    if (!contenu) {
      this.deconnexion();
      throw new Error('Jeton invalide');
    }
    localStorage.setItem(CLE_JETON, jeton);
    this.jeton.set(jeton);

    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => {
      this.deconnexion();
      const url = this.router.url;
      if (PAGES_PRIVEES.some(page => url.startsWith(page))) {
        this.router.navigate(['/connexion'], { queryParams: { retour: url } });
      }
    }, contenu.exp * 1000 - Date.now());

    return this.utilisateur()!;
  }
}
