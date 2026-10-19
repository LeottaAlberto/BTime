import { Component, inject, signal, WritableSignal } from "@angular/core";
import { AuthService } from "../../core/auth/auth.service";
import { LoginRequest } from "../../core/interfaces/login/loginRequest.interface";
import { Router } from "@angular/router";
import { getClientDeviceInfo } from "../../core/services/deviceInfo/parseUserAgent.service";
import { LoadingService } from "../../core/services/loading.service";

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

  public async onClick(): Promise<void> {
    const user = this.username();
    const mail = this.email();
    const pwd = this.password();
    const deviceInfo = await getClientDeviceInfo();

    if (!user || !mail || !pwd) {
      return;
    }

    const req: LoginRequest = {
      Username: user,
      Password: pwd,
      Email: mail,
      IpAddress: deviceInfo.ip ?? "",
      DeviceInfo: deviceInfo.deviceType
    };

    this.loadService.showLoading(() => {
      this.auth.login(req).subscribe({
        next: (res) => {
          this.auth.currentUser.set(res);
          this.router.navigate(["/dashboard"]);
        },
        error: (err) => {
          this.loginShowError(err.statusText);
        }
      });
    });
  }

  private loginShowError(err: string) : void {
    if(err.includes("Unknown Error"))
      alert("Docker OFF")

    console.error(err);
  }
}
