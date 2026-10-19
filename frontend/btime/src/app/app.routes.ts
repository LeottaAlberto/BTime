import { Routes } from '@angular/router';
import { GLoginComponent } from './features/g-login.component/g-login.component';
import { authGuard } from './core/auth/auth.guard';
import { GDashboardComponent } from './features/g-dashboard.component/g-dashboard.component';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "login", component: GLoginComponent, canActivate: [guestGuard] },
  {
    path: "dashboard",
    component: GDashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: "", loadComponent: () =>   import("./features/g-dash-overview.component/g-dash-overview.component").then((c) => c.GDashOverviewComponent),},
      { path: "cloud", loadComponent: () =>   import("./features/g-cloud.component/g-cloud.component").then((c) => c.GCloudComponent),},
      { path: "photos", loadComponent: () =>   import("./features/g-photos.component/g-photos.component").then((c) => c.GPhotosComponent),},
      { path: "movies", loadComponent: () =>   import("./features/g-movies.component/g-movies.component").then((c) => c.GMoviesComponent),},
    ],
  },

  // Rotta di Fallback
  { path: "**", redirectTo: "login" },
];
