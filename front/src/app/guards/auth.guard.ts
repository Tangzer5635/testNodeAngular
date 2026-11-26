import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte()
    ? true
    : router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
};

export const inviteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte() ? router.createUrlTree(['/admin']) : true;
};
