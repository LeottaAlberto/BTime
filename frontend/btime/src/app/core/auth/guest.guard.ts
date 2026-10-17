import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Se l'utente è già loggato, lo rimanda alla dashboard
  if (auth.currentUser() != null) {
    return router.createUrlTree(["/dashboard"]);
  }

  return true;
};
