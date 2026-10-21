import { Component, inject, signal, WritableSignal } from "@angular/core";
import { AuthService } from "../../core/auth/auth.service";
import { LoginRequest } from "../../core/interfaces/login/loginRequest.interface";
import { Router } from "@angular/router";
import { getClientDeviceInfo } from "../../core/services/deviceInfo/parseUserAgent.service";
import { LoadingService } from "../../core/services/loading.service";
import { firstValueFrom } from "rxjs";

@Component({
  imports: [],
  selector: "g-login",
  styleUrl: "./g-login.component.css",
  templateUrl: "./g-login.component.html",
})
export class GLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public loadService = inject(LoadingService);

  public username: WritableSignal<string | null> = signal(null);
  public email: WritableSignal<string | null> = signal(null);
  public password: WritableSignal<string | null> = signal(null);
  public errorMessage: WritableSignal<string | null> = signal(null);

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

      const req: LoginRequest = {
        Username: user,
        Password: pwd,
        Email: mail,
        IpAddress: deviceInfo.ip ?? "",
        DeviceInfo: deviceInfo.deviceType,
      };

      await this.loadService.showLoading(async () => {
        const res = await firstValueFrom(this.auth.login(req));
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
          typeof serverMsg === "string" ? serverMsg : "Si è verificato un errore durante il login. Riprova."
        );
      }
    }
  }
}
