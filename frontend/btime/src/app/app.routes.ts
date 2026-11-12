import { Routes } from '@angular/router';
import { GLoginComponent } from './features/auth/g-login.component/g-login.component';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
import { GDashboardComponent } from './features/dashboard/g-dashboard.component/g-dashboard.component';
import { guestGuard } from './core/auth/guest.guard';
import { GRegisterComponent } from './features/auth/g-register.component/g-register.component';

export const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "login", component: GLoginComponent, canActivate: [guestGuard] },
  { path: "register", component: GRegisterComponent, canActivate: [guestGuard] },
  {
    path: "qr-auth",
    loadComponent: () =>
      import("./features/auth/g-qr-authorize.component/g-qr-authorize.component").then(
        (c) => c.GQrAuthorizeComponent,
      ),
  },
  {
    path: "dashboard",
    component: GDashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./features/dashboard/g-dash-overview.component/g-dash-overview.component").then(
            (c) => c.GDashOverviewComponent,
          ),
      },
      {
        path: "cloud",
        loadComponent: () =>
          import("./features/cloud/g-cloud.component/g-cloud.component").then((c) => c.GCloudComponent),
      },
      {
        path: "photos",
        loadComponent: () =>
          import("./features/photos/g-photos.component/g-photos.component").then(
            (c) => c.GPhotosComponent,
          ),
      },
      {
        path: "movies",
        loadComponent: () =>
          import("./features/movies/g-movies.component/g-movies.component").then(
            (c) => c.GMoviesComponent,
          ),
      },
      {
        path: "movies/media-details/:id",
        loadComponent: () =>
          import("./features/movies/g-media-detail.component/g-media-detail.component").then(
            (c) => c.GMediaDetailComponent,
          ),
      },
      {
        path: "movies/media-details",
        loadComponent: () =>
          import("./features/movies/g-media-detail.component/g-media-detail.component").then(
            (c) => c.GMediaDetailComponent,
          ),
      },
      {
        path: "movies/watch/:id",
        loadComponent: () =>
          import("./features/movies/g-watch-player.component/g-watch-player.component").then(
            (c) => c.GWatchPlayerComponent,
          ),
      },
      {
        path: "admin",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./features/admin/g-admin.component/g-admin.component").then((c) => c.GAdminComponent),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/user/g-user-profile.component/g-user-profile.component").then(
            (c) => c.GUserProfileComponent,
          ),
      },
    ],
  },
  { path: "admin", redirectTo: "dashboard/admin", pathMatch: "full" },

  // Rotta di Fallback
  { path: "**", redirectTo: "login" },
];
