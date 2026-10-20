import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  // Verifica se l'utente è autenticato e ha il ruolo Admin
  if (user && user.role === "Admin") {
    return true;
  }

  // Se non autorizzato, reindirizza alla dashboard
  return router.createUrlTree(["/dashboard"]);
};

