import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, EMPTY, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

  // Evitar disparar peticiones autenticadas a la API durante SSR (sin localStorage)
  if (!isBrowser && req.url.startsWith(environment.apiUrl)) {
    return EMPTY;
  }

  // Clonar la solicitud e inyectar el Bearer Token para rutas de la API de PDHO
  let authReq = req;
  if (token && req.url.startsWith(environment.apiUrl)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isBrowser && error.status === 401 && !req.url.includes('/usuarios/login')) {
        // Token expirado o inválido -> Cerrar sesión y redirigir
        authService.logout();
        router.navigate(['/login'], { queryParams: { sesionExpirada: true } });
      } else if (error.status === 403) {
        console.error('Acceso prohibido: permisos insuficientes (RBAC).');
      }
      return throwError(() => error);
    })
  );
};
