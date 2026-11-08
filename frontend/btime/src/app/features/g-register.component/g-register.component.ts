import { Component, inject, signal, WritableSignal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { GTitleComponent } from "../g-title.component/g-title.component";
import { GFormInputComponent } from "../g-form-input.component/g-form-input.component";
import { GButtonComponent } from "../g-button.component/g-button.component";

@Component({
  imports: [GTitleComponent, GFormInputComponent, GButtonComponent],
  selector: "g-register",
  styleUrl: "./g-register.component.css",
  templateUrl: "./g-register.component.html",
})
export class GRegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  public username: WritableSignal<string | null> = signal(null);
  public email: WritableSignal<string | null> = signal(null);
  public password: WritableSignal<string | null> = signal(null);
  public confirmPassword: WritableSignal<string | null> = signal(null);
  public secretPassword: WritableSignal<string | null> = signal(null);

  public errorMessage: WritableSignal<string | null> = signal(null);
  public successMessage: WritableSignal<string | null> = signal(null);
  public isLoading: WritableSignal<boolean> = signal(false);

  public async onSubmit(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const u = this.username()?.trim();
    const e = this.email()?.trim();
    const p = this.password()?.trim();
    const cp = this.confirmPassword()?.trim();
    const sp = this.secretPassword()?.trim();

    if (!u || !e || !p || !cp || !sp) {
      this.errorMessage.set("Compila tutti i campi obbligatori per procedere.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      this.errorMessage.set("Inserisci un indirizzo email valido.");
      return;
    }

    if (p.length < 6) {
      this.errorMessage.set("La password deve contenere almeno 6 caratteri.");
      return;
    }

    if (p !== cp) {
      this.errorMessage.set("Le due password inserite non coincidono.");
      return;
    }

    this.isLoading.set(true);

    try {
      const res = await firstValueFrom(
        this.auth.register({
          Username: u,
          Email: e,
          Password: p,
        }),
      );

      this.successMessage.set(
        res?.message || "Registrazione completata con successo! Reindirizzamento...",
      );

      setTimeout(() => {
        this.router.navigate(["/login"]);
      }, 1500);
    } catch (err: any) {
      const serverMsg = err?.error?.message || err?.error;
      if (err?.status === 0) {
        this.errorMessage.set(
          "Server non raggiungibile. Verifica che il backend sia attivo sulla porta 5008.",
        );
      } else if (typeof serverMsg === "string") {
        this.errorMessage.set(serverMsg);
      } else {
        this.errorMessage.set("Si è verificato un errore durante la registrazione. Riprova.");
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  public onClickLogin(): void {
    this.router.navigate(["/login"]);
  }
}
