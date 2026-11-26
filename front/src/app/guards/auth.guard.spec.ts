import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { adminGuard, clientGuard, inviteGuard } from './auth.guard';
import { jetonDe } from '../testing/jetons';

type Guard = typeof adminGuard;

const lancer = (guard: Guard, url = '/admin') =>
  TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

const adresse = (resultat: unknown) => TestBed.inject(Router).serializeUrl(resultat as UrlTree);

const connecter = (role?: 'admin' | 'client') => {
  if (role) {
    localStorage.setItem('jeton', jetonDe(role));
  }
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
};

describe('Guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('adminGuard', () => {
    it('visiteur : renvoie vers la connexion en gardant la page demandée', () => {
      connecter();
      expect(adresse(lancer(adminGuard, '/admin/3'))).toBe('/connexion?retour=%2Fadmin%2F3');
    });

    it('client : renvoie au catalogue', () => {
      connecter('client');
      expect(adresse(lancer(adminGuard))).toBe('/');
    });

    it('admin : accès autorisé', () => {
      connecter('admin');
      expect(lancer(adminGuard)).toBe(true);
    });
  });

  describe('clientGuard', () => {
    it('visiteur : renvoie vers la connexion', () => {
      connecter();
      expect(adresse(lancer(clientGuard, '/mon-compte'))).toBe('/connexion?retour=%2Fmon-compte');
    });

    it('client : accès autorisé', () => {
      connecter('client');
      expect(lancer(clientGuard, '/mon-compte')).toBe(true);
    });
  });

  describe('inviteGuard', () => {
    it('visiteur : la page de connexion est accessible', () => {
      connecter();
      expect(lancer(inviteGuard, '/connexion')).toBe(true);
    });

    it('client déjà connecté : renvoie vers son compte', () => {
      connecter('client');
      expect(adresse(lancer(inviteGuard, '/connexion'))).toBe('/mon-compte');
    });

    it('admin déjà connecté : renvoie vers l\'administration', () => {
      connecter('admin');
      expect(adresse(lancer(inviteGuard, '/connexion'))).toBe('/admin');
    });

    it('un jeton expiré compte comme un visiteur', () => {
      localStorage.setItem('jeton', jetonDe('admin', { dansSecondes: -10 }));
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
      expect(lancer(inviteGuard, '/connexion')).toBe(true);
    });
  });
});
