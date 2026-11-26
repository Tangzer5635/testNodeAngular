import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { authGuard, inviteGuard } from './auth.guard';

const fauxJeton = (expDansSecondes: number) => {
  const payload = btoa(JSON.stringify({ sub: 1, exp: Math.floor(Date.now() / 1000) + expDansSecondes }));
  return `entete.${payload}.signature`;
};

const lancer = (guard: typeof authGuard, url = '/admin') =>
  TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
  );

const configurer = () =>
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });

describe('Guards de connexion', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('sans jeton : /admin renvoie vers /connexion en gardant la page demandée', () => {
    configurer();
    const resultat = lancer(authGuard, '/admin/3') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/connexion?retour=%2Fadmin%2F3');
  });

  it('avec un jeton valide : /admin est accessible', () => {
    localStorage.setItem('jeton', fauxJeton(3600));
    configurer();
    expect(lancer(authGuard)).toBe(true);
  });

  it('avec un jeton expiré : /admin est refusé et le jeton est supprimé', () => {
    localStorage.setItem('jeton', fauxJeton(-60));
    configurer();
    expect(lancer(authGuard)).toBeInstanceOf(UrlTree);
    expect(localStorage.getItem('jeton')).toBeNull();
  });

  it('déjà connecté : /connexion renvoie vers /admin', () => {
    localStorage.setItem('jeton', fauxJeton(3600));
    configurer();
    const resultat = lancer(inviteGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultat)).toBe('/admin');
  });

  it('pas connecté : /connexion est accessible', () => {
    configurer();
    expect(lancer(inviteGuard)).toBe(true);
  });
});
