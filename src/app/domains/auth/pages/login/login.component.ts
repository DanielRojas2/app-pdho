import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Estados reactivos con Signals
  readonly isSubmitting = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  // Formulario Reactivo
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor() {
    // Verificar si se redirigió por expiración de token y mostrar toast de advertencia
    this.route.queryParams.subscribe((params) => {
      if (params['sesionExpirada']) {
        this.toastService.warning('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const user = this.authService.currentUser();
        if (user?.rol === 'OPERADOR_HOSPEDAJE' || user?.rol === 'DEPENDIENTE_HOSPEDAJE') {
          this.router.navigate(['/operador/mi-informacion']);
        } else {
          this.router.navigate(['/admin/inicio']);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Credenciales incorrectas. Verifique su correo y contraseña.');
      }
    });
  }
}
