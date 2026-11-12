import { HttpClient, HttpContext } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { LoginResponse } from "../interfaces/login/loginResponse.interface";
import { jwtDecode } from "jwt-decode";
import { LoginRequest } from "../interfaces/login/loginRequest.interface";
import { RegisterRequest } from "../interfaces/register/registerRequest.interface";
import { RegisterResponse } from "../interfaces/register/registerResponse.interface";
import { Observable, tap } from "rxjs";
import { RefreshTokenResponse } from "../interfaces/refreshToken/refreshTokenResponse.interface";
import { RefreshTokenRequest } from "../interfaces/refreshToken/refreshTokenRequest.interface";
import { environment } from "../../../environments/environment";
import { isTvAppBTimeClient } from "../services/deviceInfo/parseUserAgent.service";
import {
  QrApproveRequest,
  QrApproveWithCredentialsRequest,
  QrCreateRequest,
  QrCreateResponse,
  QrInfoResponse,
  QrStatusResponse,
} from "../interfaces/qrLogin/qrLogin.interface";
import { SKIP_LOADING } from "../http/http-context.tokens";

@Injectable({ providedIn: "root" }) // Questo decoratore permette di creare una sola instanza di questa classe per tutte l'app
export class AuthService {
  public currentUser = signal<LoginResponse | null>(null);
  public isAdmin = computed(() => this.currentUser()?.role === "Admin");
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly JWT_KEY = "jwt";
  private readonly REFRESH_KEY = "refreshToken";
  private readonly AVATAR_KEY = "avatarUrl";

  constructor() {
    const jwt = this.getJwt();
    const refreshToken = this.getRefreshToken();

    if (!jwt) return;

    try {
      const jwtDec = jwtDecode<Record<string, any>>(jwt);

      // Ricostruisce lo stato dell'utente mappando i claim del JWT
      const restoredUser: LoginResponse = {
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
        avatarUrl: typeof window !== "undefined" ? (localStorage.getItem(this.AVATAR_KEY) ?? undefined) : undefined,
      };

      // Verifica scadenza token: se è scaduto ma abbiamo un RefreshToken valido (es. TvAppBTime),
      // rinnova silenziosamente la sessione invece di disconnettere subito il dispositivo.
      if (jwtDec["exp"] && jwtDec["exp"] * 1000 < Date.now()) {
        if (refreshToken) {
          this.currentUser.set(restoredUser);
          queueMicrotask(() => {
            this.refreshToken().subscribe({
              error: () => this.logout(),
            });
          });
          return;
        }
        this.logout();
        return;
      }

      this.currentUser.set(restoredUser);
    } catch (error) {
      console.error("JWT non valido o corrotto:", error);
      this.logout();
    }
  }

  public login(req: LoginRequest): Observable<LoginResponse> {
    const payload: LoginRequest = {
      ...req,
      IsTvAppBTime: req.IsTvAppBTime ?? isTvAppBTimeClient(),
    };
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((res) => {
        this.saveTokens(res);
      }),
    );
  }

  public register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, req);
  }

  public refreshToken(): Observable<RefreshTokenResponse> {
    const req: RefreshTokenRequest = {
      JwtToken: this.getJwt() ?? "",
      RefreshToken: this.getRefreshToken() ?? "",
      IsTvAppBTime: isTvAppBTimeClient(),
    };

    return this.http
      .post<RefreshTokenResponse>(`${environment.apiUrl}/auth/refresh-token`, req)
      .pipe(tap((res) => this.saveTokens(res)));
  }

  // ==================== QR CODE LOGIN ====================

  public createQrSession(req: QrCreateRequest): Observable<QrCreateResponse> {
    return this.http.post<QrCreateResponse>(`${environment.apiUrl}/auth/qr/create`, req, { context: new HttpContext().set(SKIP_LOADING, true) });
  }

  public getQrSessionInfo(code: string): Observable<QrInfoResponse> {
    return this.http.get<QrInfoResponse>(
      `${environment.apiUrl}/auth/qr/info/${encodeURIComponent(code)}`,
    );
  }

  public pollQrSessionStatus(code: string): Observable<QrStatusResponse> {
    return this.http.get<QrStatusResponse>(
      `${environment.apiUrl}/auth/qr/status/${encodeURIComponent(code)}`,
      { context: new HttpContext().set(SKIP_LOADING, true) },
    );
  }

  public approveQrSession(req: QrApproveRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/qr/approve`, req);
  }

  public approveQrSessionWithCredentials(
    req: QrApproveWithCredentialsRequest,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/qr/approve-credentials`,
      req,
    );
  }

  public completeQrLogin(res: LoginResponse): void {
    this.saveTokens(res);
  }

  public logout(): void {
    localStorage.removeItem(this.JWT_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.AVATAR_KEY);
    this.currentUser.set(null);
    this.router.navigate(["/login"]);
  }

  public updateCurrentUser(partial: Partial<LoginResponse>): void {
    if (partial.token) {
      localStorage.setItem(this.JWT_KEY, partial.token);
    }
    if ("avatarUrl" in partial) {
      if (partial.avatarUrl) {
        localStorage.setItem(this.AVATAR_KEY, partial.avatarUrl);
      } else {
        localStorage.removeItem(this.AVATAR_KEY);
      }
    }
    this.currentUser.update((user) => (user ? { ...user, ...partial } : null));
  }

  private saveTokens(res: LoginResponse | RefreshTokenResponse): void {
    const anyRes = res as any;
    const jwt = anyRes.token || anyRes.jwtToken || anyRes.JwtToken;
    const refresh = anyRes.refreshToken || anyRes.RefreshToken;

    if (!jwt || !refresh) return;

    localStorage.setItem(this.JWT_KEY, jwt);
    localStorage.setItem(this.REFRESH_KEY, refresh);

    // Se è un LoginResponse abbiamo già tutti i dati dell'utente
    if ("username" in anyRes || "Username" in anyRes) {
      const avatar = anyRes.avatarUrl || anyRes.AvatarUrl || undefined;
      if (avatar) {
        localStorage.setItem(this.AVATAR_KEY, avatar);
      } else {
        localStorage.removeItem(this.AVATAR_KEY);
      }

      this.currentUser.set({
        token: jwt,
        refreshToken: refresh,
        username: anyRes.username || anyRes.Username || "",
        email: anyRes.email || anyRes.Email || "",
        role: anyRes.role || anyRes.Role || "",
        avatarUrl: avatar,
      });
    } else {
      // Se è un refresh-token, aggiorniamo solo i token mantenendo username, email e role
      this.currentUser.update((user) =>
        user ? { ...user, token: jwt, refreshToken: refresh } : null,
      );
    }
  }

  private getJwt(): string | null {
    if (typeof window === "undefined") return null; // Evita il crash lato server
    return localStorage.getItem(this.JWT_KEY);
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;

    return localStorage.getItem(this.REFRESH_KEY);
  }
}
