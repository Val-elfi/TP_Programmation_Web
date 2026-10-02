import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Adds the bearer token to protected API requests and handles 401 errors. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const authReq = token
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : request;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si la requête échoue avec un code 401 (sauf sur la tentative de connexion /api/auth/login),
      // le jeton est expiré ou invalide : on nettoie l'état local et on redirige vers /login
      if (error.status === 401 && !request.url.includes('/api/auth/login')) {
        console.warn('[authInterceptor] Jeton expiré ou non autorisé (401), retour à /login');
        auth.logout();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};

