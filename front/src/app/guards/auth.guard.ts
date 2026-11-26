import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

const versConnexion = (url: string) =>
  inject(Router).createUrlTree(['/connexion'], { queryParams: { retour: url } });

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (auth.estAdmin()) {
    return true;
  }
  return auth.estConnecte() ? inject(Router).createUrlTree(['/']) : versConnexion(state.url);
};

export const clientGuard: CanActivateFn = (route, state) =>
  inject(AuthService).estConnecte() ? true : versConnexion(state.url);

export const inviteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.estConnecte()) {
    return true;
  }
  return inject(Router).createUrlTree([auth.estAdmin() ? '/admin' : '/mon-compte']);
};
