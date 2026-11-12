import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { UserService } from "../../../core/services/user/user.service";
import { AlertService } from "../../../core/services/alertMessage/alert.service";
import { StatusType } from "../../../core/enums/statusType.enum";
import { UserProfile } from "../../../core/interfaces/user/userProfile.interface";
import { environment } from "../../../../environments/environment";

const DEFAULT_AVATAR =
  "https://imgs.search.brave.com/Nt1z2ObBrGxK-9i_PJ6ioz7PbFpYm1yCo7tbltrIVV0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2M4LzA5/L2MzL2M4MDljM2Fh/MjI1N2I2ZTEwM2Zl/OGIzNzcwMWMwZDAw/LmpwZw";

@Component({
  imports: [CommonModule, FormsModule],
  selector: "g-user-profile",
  styleUrl: "./g-user-profile.component.css",
  templateUrl: "./g-user-profile.component.html",
})
export class GUserProfileComponent implements OnInit {
  public auth = inject(AuthService);
  private userService = inject(UserService);
  private alertService = inject(AlertService);

  public profile = signal<UserProfile | null>(null);
  public isSavingProfile = signal(false);
  public isUploadingAvatar = signal(false);

  // Campi non sensibili
  public usernameInput = signal("");
  public avatarPreview = signal<string | null>(null);
  public pendingAvatarFile = signal<File | null>(null);
  public pendingRemoveAvatar = signal<boolean>(false);

  // Stato sicurezza dati sensibili (bloccato di default)
  public isSensitiveUnlocked = signal(false);
  public isVerifying = signal(false);
  public isRequestingOtp = signal(false);
  public isConfirmingOtp = signal(false);
  public isOtpStep = signal(false);
  public maskedOtpEmail = signal("");
  public otpInput = signal("");

  public currentPasswordInput = signal("");
  public newEmailInput = signal("");
  public newPasswordInput = signal("");
  public confirmPasswordInput = signal("");
  public showCurrentPassword = signal(false);
  public showNewPassword = signal(false);

  public resolvedAvatar = computed(() => {
    if (this.avatarPreview()) return this.avatarPreview()!;
    if (this.pendingRemoveAvatar()) return DEFAULT_AVATAR;
    const raw = this.profile()?.avatarUrl ?? this.auth.currentUser()?.avatarUrl;
    if (!raw) return DEFAULT_AVATAR;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;
  });

  public hasPendingAvatarChange = computed(
    () => Boolean(this.pendingAvatarFile()) || this.pendingRemoveAvatar(),
  );

  public hasCustomAvatar = computed(() => {
    if (this.pendingRemoveAvatar()) return false;
    if (this.avatarPreview()) return true;
    return Boolean(this.profile()?.avatarUrl ?? this.auth.currentUser()?.avatarUrl);
  });

  public maskedEmail = computed(() => {
    const email = this.profile()?.email ?? this.auth.currentUser()?.email ?? "";
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const local = parts[0];
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${parts[1]}`;
  });

  public ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.usernameInput.set(data.username);
        this.newEmailInput.set(data.email);
      },
    });
  }

  public onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.pendingAvatarFile.set(file);
    this.pendingRemoveAvatar.set(false);

    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
    input.value = "";
  }

  public removeAvatar(): void {
    this.pendingAvatarFile.set(null);
    this.avatarPreview.set(null);
    this.pendingRemoveAvatar.set(true);
  }

  public cancelAvatarChange(): void {
    this.pendingAvatarFile.set(null);
    this.avatarPreview.set(null);
    this.pendingRemoveAvatar.set(false);
  }

  public async saveProfile(): Promise<void> {
    const username = this.usernameInput().trim();
    if (username.length < 3) {
      this.alertService.show({
        title: "Username non valido",
        message: "Lo username deve contenere almeno 3 caratteri.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isSavingProfile.set(true);
    try {
      const fileToUpload = this.pendingAvatarFile();
      let uploadedAvatarUrl: string | undefined;

      if (fileToUpload) {
        this.isUploadingAvatar.set(true);
        const upRes = await firstValueFrom(this.userService.uploadAvatar(fileToUpload));
        uploadedAvatarUrl = upRes.avatarUrl;
      }

      const res = await firstValueFrom(
        this.userService.updateProfile({
          username,
          avatarUrl: uploadedAvatarUrl,
          removeAvatar: !fileToUpload && this.pendingRemoveAvatar(),
        }),
      );

      this.profile.update((p) =>
        p ? { ...p, username: res.username, avatarUrl: res.avatarUrl ?? null } : p,
      );
      this.pendingAvatarFile.set(null);
      this.pendingRemoveAvatar.set(false);
      this.avatarPreview.set(null);

      this.alertService.show({
        title: "Profilo Salvato",
        message: "Le informazioni del tuo profilo sono state aggiornate.",
        status: StatusType.Good,
      });
    } catch (err: any) {
      this.alertService.show({
        title: "Errore",
        message: err.error?.message || "Errore durante l'aggiornamento del profilo.",
        status: StatusType.Bad,
      });
    } finally {
      this.isUploadingAvatar.set(false);
      this.isSavingProfile.set(false);
    }
  }

  public async unlockSensitiveSection(): Promise<void> {
    const pwd = this.currentPasswordInput();
    if (!pwd) {
      this.alertService.show({
        title: "Password richiesta",
        message: "Inserisci la password attuale per sbloccare le impostazioni sensibili.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isVerifying.set(true);
    try {
      const res = await firstValueFrom(this.userService.verifyPassword(pwd));
      this.isSensitiveUnlocked.set(true);
      this.isOtpStep.set(false);
      this.newEmailInput.set(this.profile()?.email ?? this.auth.currentUser()?.email ?? "");
      this.newPasswordInput.set("");
      this.confirmPasswordInput.set("");

      this.alertService.show({
        title: "Accesso Consentito",
        message: res.message || "Password verificata. È stata inviata un'email di avviso di sicurezza.",
        status: StatusType.Good,
      });
    } catch (err: any) {
      this.alertService.show({
        title: "Verifica Fallita",
        message: err.error?.message || "Password attuale non corretta.",
        status: StatusType.Bad,
      });
    } finally {
      this.isVerifying.set(false);
    }
  }

  public lockSensitiveSection(): void {
    this.isSensitiveUnlocked.set(false);
    this.isOtpStep.set(false);
    this.otpInput.set("");
    this.maskedOtpEmail.set("");
    this.currentPasswordInput.set("");
    this.newPasswordInput.set("");
    this.confirmPasswordInput.set("");
  }

  public backToSensitiveInputs(): void {
    this.isOtpStep.set(false);
    this.otpInput.set("");
  }

  public async requestSensitiveOtp(): Promise<void> {
    const currentEmail = this.profile()?.email ?? this.auth.currentUser()?.email ?? "";
    const nextEmail = this.newEmailInput().trim();
    const nextPwd = this.newPasswordInput();
    const confirmPwd = this.confirmPasswordInput();

    const emailChanged = nextEmail.length > 0 && nextEmail.toLowerCase() !== currentEmail.toLowerCase();
    const pwdChanged = nextPwd.length > 0;

    if (!emailChanged && !pwdChanged) {
      this.alertService.show({
        title: "Nessuna modifica",
        message: "Modifica l'indirizzo email o inserisci una nuova password prima di procedere.",
        status: StatusType.Bad,
      });
      return;
    }

    if (pwdChanged) {
      if (nextPwd.length < 8) {
        this.alertService.show({
          title: "Password troppo corta",
          message: "La nuova password deve contenere almeno 8 caratteri.",
          status: StatusType.Bad,
        });
        return;
      }
      if (nextPwd !== confirmPwd) {
        this.alertService.show({
          title: "Password non coincidenti",
          message: "La nuova password e la conferma non corrispondono.",
          status: StatusType.Bad,
        });
        return;
      }
    }

    this.isRequestingOtp.set(true);
    try {
      const res = await firstValueFrom(
        this.userService.requestSensitiveChange({
          currentPassword: this.currentPasswordInput(),
          newEmail: emailChanged ? nextEmail : undefined,
          newPassword: pwdChanged ? nextPwd : undefined,
        }),
      );

      this.maskedOtpEmail.set(res.maskedEmail);
      this.isOtpStep.set(true);
      this.otpInput.set("");

      this.alertService.show({
        title: "Codice OTP Inviato",
        message: res.message,
        status: StatusType.Good,
      });
    } catch (err: any) {
      this.alertService.show({
        title: "Errore Richiesta",
        message: err.error?.message || "Impossibile avviare la procedura di modifica.",
        status: StatusType.Bad,
      });
    } finally {
      this.isRequestingOtp.set(false);
    }
  }

  public async confirmSensitiveOtp(): Promise<void> {
    const code = this.otpInput().trim();
    if (!code || code.length !== 6) {
      this.alertService.show({
        title: "Codice non valido",
        message: "Inserisci il codice numerico a 6 cifre ricevuto via email.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isConfirmingOtp.set(true);
    try {
      const res = await firstValueFrom(
        this.userService.confirmSensitiveChange({ otpCode: code }),
      );

      this.profile.update((p) => (p ? { ...p, email: res.email } : p));
      this.alertService.show({
        title: "Sicurezza Aggiornata",
        message: res.message,
        status: StatusType.Good,
      });

      this.lockSensitiveSection();
    } catch (err: any) {
      this.alertService.show({
        title: "Verifica Codice Fallita",
        message: err.error?.message || "Il codice di verifica inserito non è valido o è scaduto.",
        status: StatusType.Bad,
      });
    } finally {
      this.isConfirmingOtp.set(false);
    }
  }
}
