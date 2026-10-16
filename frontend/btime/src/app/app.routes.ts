import { Routes } from '@angular/router';
import { GLoginComponent } from './features/g-login.component/g-login.component';
import { authGuard } from './core/auth/auth.guard';
import { GDashboardComponent } from './features/g-dashboard.component/g-dashboard.component';

export const routes: Routes = [
  {
    path: "login",
    component: GLoginComponent,
  }, {
    path: "dashboard",
    component: GDashboardComponent,
    canActivate: [authGuard]
  },

  // Rotta di Fallback
  { path: "**", redirectTo: "login" }
];
