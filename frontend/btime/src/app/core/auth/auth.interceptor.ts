import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { catchError, finalize, switchMap, throwError, Observable } from "rxjs";
import { LoadingService } from "../services/loading.service";

const ERROR401 = 401;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const aLoading = inject(LoadingService);

  const appendLoading = <T>(func: () => Observable<T>): Observable<T> => {
    aLoading.show();
    return func().pipe(
      finalize(() => aLoading.hide())
    );
  };

  const token = auth.currentUser()?.token;

  if (!token) {
    return appendLoading(() => next(req));
  }

  const cloneReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return appendLoading(() =>
    next(cloneReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === ERROR401 && !req.url.includes("/api/auth/")) {
          return auth.refreshToken().pipe(
            switchMap((refreshRes) => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${refreshRes.JwtToken}`,
                },
              });

              return next(retryReq);
            }),
            catchError((refreshErr) => {
              auth.logout();
              return throwError(() => refreshErr);
            }),
          );
        }

        return throwError(() => err);
      })
    )
  );
};
