import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Pages réservées à l'admin : sans connexion, on part vers /connexion,
// en notant la page demandée pour y revenir après la connexion.
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte()
    ? true
    : router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
};

// Page de connexion : inutile si on est déjà connecté.
export const inviteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte() ? router.createUrlTree(['/admin']) : true;
};
