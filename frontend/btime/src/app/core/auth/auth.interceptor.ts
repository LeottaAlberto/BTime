import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { catchError, finalize, switchMap, throwError, Observable } from "rxjs";
import { LoadingService } from "../services/loading.service";
import { isTvAppBTimeClient } from "../services/deviceInfo/parseUserAgent.service";

const ERROR401 = 401;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const aLoading = inject(LoadingService);

  // Evita l'overlay full-screen durante il polling silenzioso del QR Code sulla TV
  const skipGlobalLoading = req.url.includes("/auth/qr/");

  const appendLoading = <T>(func: () => Observable<T>): Observable<T> => {
    if (skipGlobalLoading) {
      return func();
    }
    aLoading.show();
    return func().pipe(finalize(() => aLoading.hide()));
  };

  const headers: Record<string, string> = {};
  if (isTvAppBTimeClient()) {
    headers["X-Client-App"] = "TvAppBTime";
  }

  const token = auth.currentUser()?.token;

  if (!token) {
    const unauthReq = Object.keys(headers).length > 0 ? req.clone({ setHeaders: headers }) : req;
    return appendLoading(() => next(unauthReq));
  }

  const cloneReq = req.clone({
    setHeaders: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  });

  return appendLoading(() =>
    next(cloneReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === ERROR401 && !req.url.includes("/api/auth/")) {
          return auth.refreshToken().pipe(
            switchMap((refreshRes: any) => {
              const newJwt = refreshRes?.jwtToken || refreshRes?.JwtToken || refreshRes?.token;
              const retryReq = req.clone({
                setHeaders: {
                  ...headers,
                  Authorization: `Bearer ${newJwt}`,
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
      }),
    ),
  );
};
