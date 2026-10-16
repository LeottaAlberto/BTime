import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthed = auth.currentUser() != null;

  if (isAuthed)
    return true;

  return router.createUrlTree(["/login"]);
};
