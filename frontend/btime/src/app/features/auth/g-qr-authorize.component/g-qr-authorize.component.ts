import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";

@Component({
  imports: [RouterLink],
  selector: "g-qr-authorize",
  styleUrl: "./g-qr-authorize.component.css",
  templateUrl: "./g-qr-authorize.component.html",
})
export class GQrAuthorizeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public auth = inject(AuthService);

  public code = signal<string>("");
  public checking = signal<boolean>(true);
  public submitting = signal<boolean>(false);
  public isValidQr = signal<boolean>(false);
  public approved = signal<boolean>(false);
  public deviceLabel = signal<string>("TV");
  public isTvApp = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public useOtherAccount = signal<boolean>(false);

  public username = signal<string>("");
  public email = signal<string>("");
  public password = signal<string>("");

  public loggedUser = computed(() => this.auth.currentUser());

  public async ngOnInit(): Promise<void> {
    const rawCode =
      this.route.snapshot.queryParamMap.get("c") ||
      this.route.snapshot.queryParamMap.get("code") ||
      "";
    this.code.set(rawCode.trim());

    if (!this.code()) {
      this.checking.set(false);
      this.isValidQr.set(false);
      this.errorMessage.set("Codice QR mancante o non valido.");
      return;
    }

    try {
      const info = await firstValueFrom(this.auth.getQrSessionInfo(this.code()));
      this.isValidQr.set(info.valid);
      this.deviceLabel.set(info.deviceInfo || "TV");
      this.isTvApp.set(info.isTvAppBTime);
      if (!info.valid) {
        this.errorMessage.set("Questo QR Code è scaduto o è già stato utilizzato. Generane uno nuovo sulla TV.");
      }
    } catch {
      this.isValidQr.set(false);
      this.errorMessage.set("Impossibile contattare il server BTime. Assicurati di essere sulla stessa rete o VPN Tailscale.");
    } finally {
      this.checking.set(false);
    }
  }

  public async approveWithActiveSession(): Promise<void> {
    this.errorMessage.set(null);
    this.submitting.set(true);

    try {
      await firstValueFrom(this.auth.approveQrSession({ code: this.code() }));
      this.approved.set(true);
    } catch (err: any) {
      const msg = err?.error?.message || "Impossibile autorizzare il QR Code. Riprova.";
      this.errorMessage.set(msg);
      if (err?.status === 401) {
        this.useOtherAccount.set(true);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  public async approveWithCredentials(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    this.errorMessage.set(null);

    const userEl = document.querySelector('input[name="qr_username"]') as HTMLInputElement | null;
    const mailEl = document.querySelector('input[name="qr_email"]') as HTMLInputElement | null;
    const pwdEl = document.querySelector('input[name="qr_password"]') as HTMLInputElement | null;

    const user = (this.username() || userEl?.value || "").trim();
    const mail = (this.email() || mailEl?.value || "").trim();
    const pwd = this.password() || pwdEl?.value || "";

    if (!user || !mail || !pwd) {
      this.errorMessage.set("Compila Username, Mail e Password per autorizzare la TV.");
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.auth.approveQrSessionWithCredentials({
          code: this.code(),
          username: user,
          email: mail,
          password: pwd,
        }),
      );
      this.approved.set(true);
    } catch (err: any) {
      const msg =
        err?.error?.message ||
        (err?.status === 401
          ? "Credenziali non valide o utente disattivato."
          : "Errore durante l'autorizzazione della TV.");
      this.errorMessage.set(msg);
    } finally {
      this.submitting.set(false);
    }
  }
}

