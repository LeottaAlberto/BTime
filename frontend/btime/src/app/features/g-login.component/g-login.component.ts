import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import { AuthService } from "../../core/auth/auth.service";
import { LoginRequest } from "../../core/interfaces/login/loginRequest.interface";
import { Router } from "@angular/router";
import {
  getClientDeviceInfo,
  isTvAppBTimeClient,
  isTvClient,
} from "../../core/services/deviceInfo/parseUserAgent.service";
import { LoadingService } from "../../core/services/loading.service";
import { firstValueFrom } from "rxjs";
import { generateQrSvgData, QrSvgData } from "../../core/utils/qr-code.util";

@Component({
  imports: [],
  selector: "g-login",
  styleUrl: "./g-login.component.css",
  templateUrl: "./g-login.component.html",
})
export class GLoginComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  public loadService = inject(LoadingService);

  public username: WritableSignal<string | null> = signal(null);
  public email: WritableSignal<string | null> = signal(null);
  public password: WritableSignal<string | null> = signal(null);
  public errorMessage: WritableSignal<string | null> = signal(null);

  // Rilevamento TV e TvAppBTime
  public isTv = signal<boolean>(false);
  public isTvApp = signal<boolean>(false);

  // Stato Login tramite QR Code (attivo solo su client TV)
  public qrCode = signal<string | null>(null);
  public qrSvg = signal<QrSvgData | null>(null);
  public qrScanUrl = signal<string | null>(null);
  public qrLoading = signal<boolean>(false);
  public qrExpired = signal<boolean>(false);
  public qrApproved = signal<boolean>(false);
  public qrError = signal<string | null>(null);
  public qrRemainingSeconds = signal<number>(0);

  public qrFormattedTime = computed(() => {
    const total = Math.max(0, this.qrRemainingSeconds());
    const min = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const sec = (total % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  });

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private detectionTimeouts: Array<ReturnType<typeof setTimeout>> = [];
  private domObserver: MutationObserver | null = null;
  private isPollingInFlight = false;
  private qrInitialized = false;

  public ngOnInit(): void {
    this.detectTvEnvironment();

    // Osserva l'eventuale iniezione asincrona di #__tvFsStyle da parte di WebViewController in TvAppBTime
    if (typeof document !== "undefined" && typeof MutationObserver !== "undefined" && !this.isTv()) {
      this.domObserver = new MutationObserver(() => {
        if (document.getElementById("__tvFsStyle")) {
          this.detectTvEnvironment();
          this.disconnectObserver();
        }
      });
      this.domObserver.observe(document.documentElement, { childList: true, subtree: true });

      this.detectionTimeouts.push(
        setTimeout(() => this.detectTvEnvironment(), 350),
        setTimeout(() => {
          this.detectTvEnvironment();
          this.disconnectObserver();
        }, 1500),
      );
    }
  }

  public ngOnDestroy(): void {
    this.clearQrTimers();
    this.disconnectObserver();
    for (const t of this.detectionTimeouts) {
      clearTimeout(t);
    }
    this.detectionTimeouts = [];
  }

  private detectTvEnvironment(): void {
    const tvApp = isTvAppBTimeClient();
    const tv = isTvClient();

    this.isTvApp.set(tvApp);
    this.isTv.set(tv);

    if (tv && !this.qrInitialized) {
      this.qrInitialized = true;
      void this.initQrSession();
    }
  }

  public async initQrSession(): Promise<void> {
    this.clearQrTimers();
    this.qrLoading.set(true);
    this.qrError.set(null);
    this.qrExpired.set(false);
    this.qrApproved.set(false);

    try {
      const tvApp = isTvAppBTimeClient();
      this.isTvApp.set(tvApp);

      const res = await firstValueFrom(
        this.auth.createQrSession({
          IpAddress: "",
          DeviceInfo: tvApp ? "TV (TvAppBTime)" : "TV",
          IsTvAppBTime: tvApp,
        }),
      );

      const targetUrl = this.buildQrAuthorizeUrl(res.code, res.suggestedHost);
      const svgData = generateQrSvgData(targetUrl, 3);

      this.qrCode.set(res.code);
      this.qrScanUrl.set(targetUrl);
      this.qrSvg.set(svgData);
      this.qrRemainingSeconds.set(res.expiresInSeconds || 300);
      this.qrLoading.set(false);

      this.startQrTimers(res.code);
    } catch (err) {
      console.error("Impossibile generare il QR Code per il login TV:", err);
      this.qrLoading.set(false);
      this.qrError.set("Impossibile generare il QR Code. Verifica la connessione al server.");
    }
  }

  private buildQrAuthorizeUrl(code: string, suggestedHost?: string | null): string {
    if (typeof window === "undefined") {
      return `/qr-auth?c=${encodeURIComponent(code)}`;
    }

    const { protocol, hostname, port } = window.location;
    const isLocalLoopback = hostname === "localhost" || hostname === "127.0.0.1";
    const effectiveHost = isLocalLoopback && suggestedHost ? suggestedHost : hostname;
    const portSegment = port ? `:${port}` : "";

    return `${protocol}//${effectiveHost}${portSegment}/qr-auth?c=${encodeURIComponent(code)}`;
  }

  private startQrTimers(code: string): void {
    this.countdownIntervalId = setInterval(() => {
      const next = this.qrRemainingSeconds() - 1;
      if (next <= 0) {
        this.qrRemainingSeconds.set(0);
        this.qrExpired.set(true);
        this.clearQrTimers();
      } else {
        this.qrRemainingSeconds.set(next);
      }
    }, 1000);

    this.pollIntervalId = setInterval(() => {
      void this.checkQrApproval(code);
    }, 2500);
  }

  private async checkQrApproval(code: string): Promise<void> {
    if (this.isPollingInFlight || this.qrExpired() || this.qrApproved()) {
      return;
    }

    this.isPollingInFlight = true;
    try {
      const status = await firstValueFrom(this.auth.pollQrSessionStatus(code));

      if (status.status === "Approved" && status.loginResponse) {
        this.qrApproved.set(true);
        this.clearQrTimers();
        this.auth.completeQrLogin(status.loginResponse);
        await this.router.navigate(["/dashboard"]);
      } else if (status.status === "Expired") {
        this.qrExpired.set(true);
        this.clearQrTimers();
      }
    } catch {
      // Ignora errori di rete transitori durante il polling silenzioso
    } finally {
      this.isPollingInFlight = false;
    }
  }

  private clearQrTimers(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.isPollingInFlight = false;
  }

  private disconnectObserver(): void {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
  }

  public async onClick(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    this.errorMessage.set(null);

    // Lettura dei valori: supporta sia signal che autofill nativo del browser
    const usernameEl = document.querySelector('input[name="username"]') as HTMLInputElement | null;
    const mailEl = document.querySelector('input[name="mail"]') as HTMLInputElement | null;
    const pwdEl = document.querySelector('input[name="password"]') as HTMLInputElement | null;

    const user = (this.username() || usernameEl?.value || "").trim();
    const mail = (this.email() || mailEl?.value || "").trim();
    const pwd = this.password() || pwdEl?.value || "";

    if (!user || !mail || !pwd) {
      this.errorMessage.set("Inserisci Username, Mail e Password per continuare.");
      return;
    }

    try {
      const deviceInfo = await getClientDeviceInfo();
      const tvApp = deviceInfo.isTvAppBTime || isTvAppBTimeClient();

      const req: LoginRequest = {
        Username: user,
        Password: pwd,
        Email: mail,
        IpAddress: deviceInfo.ip ?? "",
        DeviceInfo: tvApp ? "TV (TvAppBTime)" : deviceInfo.deviceType,
        IsTvAppBTime: tvApp,
      };

      await this.loadService.showLoading(async () => {
        const res = await firstValueFrom(this.auth.login(req));
        this.clearQrTimers();
        this.auth.currentUser.set(res);
        await this.router.navigate(["/dashboard"]);
      });
    } catch (err: any) {
      console.error("Login fallito:", err);
      const serverMsg = err?.error?.message || err?.error || err?.statusText;

      if (err?.status === 401) {
        this.errorMessage.set(serverMsg || "Credenziali non valide o utente non autorizzato.");
      } else if (err?.status === 0) {
        this.errorMessage.set("Server non raggiungibile. Verifica la connessione al Backend su porta 5008.");
      } else {
        this.errorMessage.set(
          typeof serverMsg === "string" ? serverMsg : "Si è verificato un errore durante il login. Riprova.",
        );
      }
    }
  }
}
