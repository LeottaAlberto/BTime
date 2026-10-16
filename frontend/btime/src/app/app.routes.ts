import { Routes } from '@angular/router';
import { GLoginComponent } from './features/g-login.component/g-login.component';
import { authGuard } from './core/auth/auth.guard';
import { GDashboardComponent } from './features/g-dashboard.component/g-dashboard.component';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
  {
    path: "login",
    component: GLoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: "dashboard",
    component: GDashboardComponent,
    canActivate: [authGuard],
  },

  // Rotta di Fallback
  { path: "**", redirectTo: "login" },
];
