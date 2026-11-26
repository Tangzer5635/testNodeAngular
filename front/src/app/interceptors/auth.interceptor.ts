import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const jeton = auth.jeton();
  const versApi = req.url.startsWith(environment.apiUrl);

  const requete = jeton && versApi
    ? req.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } })
    : req;

  return next(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (erreur.status === 401 && versApi && !req.url.endsWith('/auth/login')) {
        auth.deconnexion();
        router.navigate(['/connexion'], { queryParams: { retour: router.url } });
      }
      return throwError(() => erreur);
    }),
  );
};
