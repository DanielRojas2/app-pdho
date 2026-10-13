import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

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
      if (error.status === 401) {
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
