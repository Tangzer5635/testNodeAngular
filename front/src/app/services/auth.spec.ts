import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth';
import { fauxJeton, jetonDe } from '../testing/jetons';

const creer = () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  return TestBed.inject(AuthService);
};

describe('AuthService', () => {
  beforeEach(() => localStorage.clear());

  it("n'est connecté à personne au départ", () => {
    const auth = creer();
    expect(auth.estConnecte()).toBe(false);
    expect(auth.utilisateur()).toBeNull();
  });

  it('lit le rôle et le nom (avec accents) dans le jeton enregistré', () => {
    localStorage.setItem('jeton', jetonDe('client', { nom: 'Chloé Petit' }));
    const auth = creer();
    expect(auth.utilisateur()?.nom).toBe('Chloé Petit');
    expect(auth.estClient()).toBe(true);
    expect(auth.estAdmin()).toBe(false);
  });

  it("reconnaît un administrateur", () => {
    localStorage.setItem('jeton', jetonDe('admin'));
    const auth = creer();
    expect(auth.estAdmin()).toBe(true);
    expect(auth.estClient()).toBe(false);
  });

  it('supprime un jeton expiré', () => {
    localStorage.setItem('jeton', jetonDe('client', { dansSecondes: -60 }));
    const auth = creer();
    expect(auth.estConnecte()).toBe(false);
    expect(localStorage.getItem('jeton')).toBeNull();
  });

  it('supprime un ancien jeton sans rôle', () => {
    localStorage.setItem('jeton', fauxJeton({ sub: 1, email: 'a@b.fr', exp: Math.floor(Date.now() / 1000) + 3600 }));
    const auth = creer();
    expect(auth.estConnecte()).toBe(false);
    expect(localStorage.getItem('jeton')).toBeNull();
  });

  it('supprime un jeton illisible', () => {
    localStorage.setItem('jeton', 'nimportequoi');
    const auth = creer();
    expect(auth.estConnecte()).toBe(false);
  });

  it('se connecte, enregistre le jeton et renvoie l\'utilisateur', () => {
    const auth = creer();
    const http = TestBed.inject(HttpTestingController);
    let nom = '';
    auth.connexion('lea@test.fr', 'motdepasse1').subscribe(u => (nom = u.nom));

    const requete = http.expectOne(r => r.url.endsWith('/auth/login'));
    expect(requete.request.body).toEqual({ email: 'lea@test.fr', motDePasse: 'motdepasse1' });
    requete.flush({ token: jetonDe('client') });

    expect(nom).toBe('Léa Martin');
    expect(localStorage.getItem('jeton')).not.toBeNull();
    http.verify();
  });

  it("crée un compte et connecte directement l'utilisateur", () => {
    const auth = creer();
    const http = TestBed.inject(HttpTestingController);
    auth.inscription('Hugo', 'hugo@test.fr', 'motdepasse1').subscribe();

    const requete = http.expectOne(r => r.url.endsWith('/auth/inscription'));
    expect(requete.request.method).toBe('POST');
    requete.flush({ token: jetonDe('client', { nom: 'Hugo' }) });

    expect(auth.estClient()).toBe(true);
    expect(auth.utilisateur()?.nom).toBe('Hugo');
  });

  it('se déconnecte', () => {
    localStorage.setItem('jeton', jetonDe('admin'));
    const auth = creer();
    auth.deconnexion();
    expect(auth.estConnecte()).toBe(false);
    expect(localStorage.getItem('jeton')).toBeNull();
  });
});
