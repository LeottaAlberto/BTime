import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { GlobalService } from "../services/globalError/global.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(GlobalService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Il 401 viene gestito dall'authInterceptor
      if (err.status !== 401) {
        let errorMsg = "Si è verificato un errore imprevisto.";

        // Personalizza il messaggio in base allo status code HTTP
        switch (err.status) {
          case 400:
            errorMsg = "Richiesta non valida. Controlla i dati inseriti.";
            break;
          case 403:
            errorMsg = "Accesso negato. Non hai i permessi necessari.";
            break;
          case 404:
            errorMsg = "Risorsa non trovata.";
            break;
          case 500:
            errorMsg = "Errore del server. Riprova più tardi.";
            break;
        }

        const detailsList: string[] = [];

        // Gestione degli errori specifici del backend (ProblemDetails di ASP.NET Core)
        if (err.error) {
          if (typeof err.error === "string") {
            errorMsg = err.error;
          } else if (typeof err.error === "object") {
            if (err.error.detail) {
              detailsList.push(err.error.detail);
            }
            if (err.error.errors && typeof err.error.errors === "object") {
              for (const [key, val] of Object.entries(err.error.errors)) {
                if (Array.isArray(val)) {
                  val.forEach((v) => detailsList.push(`${key}: ${v}`));
                } else if (typeof val === "string") {
                  detailsList.push(`${key}: ${val}`);
                }
              }
            } else if (err.error.message) {
              errorMsg = err.error.message;
            }
          }
        }

        const titleText =
          err.status === 0
            ? "Errore di Connessione"
            : `Errore ${err.status}`;

        errorService.show({
          title: titleText,
          message: errorMsg,
          statusCode: err.status,
          statusText: err.statusText || (err.status === 0 ? "Server non raggiungibile" : ""),
          url: req.url,
          method: req.method,
          details: detailsList,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      // Si propaga l'errore
      return throwError(() => err);
    }),
  );
};
