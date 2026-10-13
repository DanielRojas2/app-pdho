import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { guestGuard } from './guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [guestGuard]
  }
];
