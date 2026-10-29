import { Routes } from '@angular/router';
import { GLoginComponent } from './features/g-login.component/g-login.component';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
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
      { path: "", loadComponent: () => import("./features/g-dash-overview.component/g-dash-overview.component").then((c) => c.GDashOverviewComponent) },
      { path: "cloud", loadComponent: () => import("./features/g-cloud.component/g-cloud.component").then((c) => c.GCloudComponent) },
      { path: "photos", loadComponent: () => import("./features/g-photos.component/g-photos.component").then((c) => c.GPhotosComponent) },
      { path: "movies", loadComponent: () => import("./features/g-movies.component/g-movies.component").then((c) => c.GMoviesComponent) },
      { path: "movies/media-details/:id", loadComponent: () => import("./features/g-media-detail.component/g-media-detail.component").then((c) => c.GMediaDetailComponent) },
      { path: "movies/media-details", loadComponent: () => import("./features/g-media-detail.component/g-media-detail.component").then((c) => c.GMediaDetailComponent) },
      { path: "movies/media-details", loadComponent: () => import("./features/g-media-detail.component/g-media-detail.component").then((c) => c.GMediaDetailComponent) },
      { path: "movies/watch/:id", loadComponent: () => import("./features/g-watch-player.component/g-watch-player.component").then((c) => c.GWatchPlayerComponent) },
      { path: "admin", canActivate: [adminGuard], loadComponent: () => import("./features/g-admin.component/g-admin.component").then((c) => c.GAdminComponent) },
    ],
  },
  { path: "admin", redirectTo: "dashboard/admin", pathMatch: "full" },

  // Rotta di Fallback
  { path: "**", redirectTo: "login" },
];
