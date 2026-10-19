import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { LoginResponse } from "../interfaces/login/loginResponse.interface";
import { jwtDecode } from "jwt-decode";
import { LoginRequest } from "../interfaces/login/loginRequest.interface";
import { Observable, tap } from "rxjs";
import { RefreshTokenResponse } from "../interfaces/refreshToken/refreshTokenResponse.interface";
import { RefreshTokenRequest } from "../interfaces/refreshToken/refreshTokenRequest.interface";
import { environment } from "../../../environments/environment.development";

@Injectable({ providedIn: "root" }) // Questo decoratore permette di creare una sola instanza di questa classe per tutte l'app
export class AuthService {
  public currentUser = signal<LoginResponse | null>(null);
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly JWT_KEY = "jwt";
  private readonly REFRESH_KEY = "refreshToken";

  constructor() {
    const jwt = this.getJwt();
    const refreshToken = this.getRefreshToken();

    if (!jwt) return;

    try {
      const jwtDec = jwtDecode<Record<string, any>>(jwt);

      // Verifica scadenza token
      if (jwtDec["exp"] && jwtDec["exp"] * 1000 < Date.now()) {
        this.logout();
        return;
      }

      // Ricostruisce lo stato dell'utente mappando i claim del JWT
      this.currentUser.set({
        token: jwt,
        refreshToken: refreshToken ?? "",
        username:
          jwtDec["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
          jwtDec["name"] ??
          jwtDec["unique_name"] ??
          "",
        email:
          jwtDec["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ??
          jwtDec["email"] ??
          "",
        role:
          jwtDec["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
          jwtDec["role"] ??
          "",
      });
    } catch (error) {
      console.error("JWT non valido o corrotto:", error);
      this.logout();
    }
  }

  public login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, req).pipe(
      tap((res) => {
        this.saveTokens(res);
      }),
    );
  }

  public refreshToken(): Observable<RefreshTokenResponse> {
    const req: RefreshTokenRequest = {
      JwtToken: this.getJwt() ?? "",
      RefreshToken: this.getRefreshToken() ?? "",
    };

    return this.http
      .post<RefreshTokenResponse>(`${environment.apiUrl}/api/auth/refresh-token`, req)
      .pipe(tap((res) => this.saveTokens(res)));
  }

  public logout(): void {
    localStorage.removeItem(this.JWT_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUser.set(null);
    this.router.navigate(["/login"]);
  }

  private saveTokens(res: LoginResponse | RefreshTokenResponse): void {
    const jwt = "token" in res ? res.token : res.JwtToken;
    const refresh = "refreshToken" in res ? res.refreshToken : res.RefreshToken;

    if (!jwt || !refresh) return;

    localStorage.setItem(this.JWT_KEY, jwt);
    localStorage.setItem(this.REFRESH_KEY, refresh);

    // Se è un LoginResponse abbiamo già tutti i dati dell'utente
    if ("username" in res) this.currentUser.set(res);
    else {
      // Se è un refresh-token, aggiorniamo solo i token mantenendo username, email e role
      this.currentUser.update((user) =>
        user ? { ...user, token: jwt, refreshToken: refresh } : null,
      );
    }
  }

  private getJwt(): string | null {
    if (typeof window === "undefined")
      return null; // Evita il crash lato server
    return localStorage.getItem(this.JWT_KEY);
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined")
      return null;

    return localStorage.getItem(this.REFRESH_KEY);
  }
}
