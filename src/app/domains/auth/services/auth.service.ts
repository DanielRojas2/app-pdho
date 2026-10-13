import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest, TokenResponse, Usuario, RolUsuario } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Estados reactivos con Signals
  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<Usuario | null>(this.getStoredUser());

  // Señales calculadas
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly userRole = computed<RolUsuario | null>(() => this.currentUser()?.rol ?? null);
  readonly isAdmin = computed(() => this.userRole() === 'ADMIN_DEPARTAMENTAL');
  readonly isOperador = computed(() => this.userRole() === 'OPERADOR_HOSPEDAJE');

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/usuarios/login`, credentials).pipe(
      tap((res) => {
        const usuario = res.usuario ?? res.user ?? null;
        if (this.isBrowser) {
          localStorage.setItem(environment.tokenStorageKey, res.access_token);
          if (usuario) {
            localStorage.setItem(environment.userStorageKey, JSON.stringify(usuario));
          }
        }
        this.token.set(res.access_token);
        this.currentUser.set(usuario);
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(environment.tokenStorageKey);
      localStorage.removeItem(environment.userStorageKey);
    }
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private getStoredToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(environment.tokenStorageKey);
  }

  private getStoredUser(): Usuario | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(environment.userStorageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}
