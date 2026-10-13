import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { LoginResponse } from "../interfaces/login/loginResponse.interface";
import { jwtDecode } from "jwt-decode";
import { LoginRequest } from "../interfaces/login/loginRequest.interface";
import { Observable, tap } from "rxjs";
import { RefreshTokenResponse } from "../interfaces/refreshToken/refreshTokenResponse.interface";
import { RefreshTokenRequest } from "../interfaces/refreshToken/refreshTokenRequest.interface";

@Injectable({ providedIn: "root" }) // Questo decoratore permette di creare una sola instanza di questa classe per tutte l'app
export class AuthService {
  public currentUser = signal<LoginResponse | null>(null);
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    const jwt = this.getJwt();
    const refreshToken = this.getRefreshToken();

    if (!jwt)
      return;

    try {
      const jwtDec = jwtDecode<Record<string, any>>(jwt);

      // Verifica scadenza token
      if (jwtDec["exp"] && jwtDec["exp"] * 1000 < Date.now()) {
        this.logout();
        return;
      }

      // Ricostruisce lo stato dell'utente mappando i claim del JWT
      this.currentUser.set({
        Token: jwt,
        RefreshToken: refreshToken ?? "",
        Username:
          jwtDec["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
          jwtDec["name"] ??
          jwtDec["unique_name"] ??
          "",
        Email:
          jwtDec["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ??
          jwtDec["email"] ??
          "",
        Role:
          jwtDec["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
          jwtDec["role"] ??
          ""
      });
    } catch (error) {
      console.error("JWT non valido o corrotto:", error);
      this.logout();
    }
  }

  public login(req: LoginRequest) : Observable<LoginResponse> {
    return this.http.post<LoginResponse>("https://localhost:7001/api/auth/login", req).pipe(
      tap((res) => {
        this.saveTokens(res.Token, res.RefreshToken);
        this.currentUser.set(res);
      }),
    );
  }

  public refreshToken() : Observable<RefreshTokenResponse> {
    const req: RefreshTokenRequest = {
      JwtToken: this.getJwt() ?? "",
      RefreshToken: this.getRefreshToken() ?? "",
    };

    return this.http
      .post<RefreshTokenResponse>("https://localhost:7001/api/auth/refresh-token", req)
      .pipe(tap((res) => this.saveTokens(res.JwtToken, res.RefreshToken)));
  }

  public logout(): void {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshToken");
    this.currentUser.set(null);
  }

  private saveTokens(jwt: string, refresh: string): void {
    localStorage.setItem("jwt", jwt);
    localStorage.setItem("refreshToken", refresh);
  }

  private getJwt(): string | null {
    return localStorage.getItem("jwt")?.toString() ?? null;
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken")?.toString() ?? null;
  }
}
