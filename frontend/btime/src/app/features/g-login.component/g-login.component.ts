import { Component, inject, signal, WritableSignal } from "@angular/core";
import { AuthService } from "../../core/auth/auth.service";
import { LoginRequest } from "../../core/interfaces/login/loginRequest.interface";

@Component({
  imports: [],
  selector: "g-login",
  styleUrl: "./g-login.component.css",
  templateUrl: "./g-login.component.html",
})
export class GLoginComponent {
  private auth = inject(AuthService);

  public username: WritableSignal<string | null> = signal(null);
  public email: WritableSignal<string | null> = signal(null);
  public password: WritableSignal<string | null> = signal(null);

  public onClick(): void {
    const user = this.username();
    const mail = this.email();
    const pwd = this.password();

    if (!user || !mail || !pwd) {
      return;
    }

    const req: LoginRequest = {
      Username: user,
      Password: pwd,
      Email: mail
    };

    this.auth.login(req).subscribe({
      next: (res) => {
        alert("Login success");
      },
      error: (err) => {
        this.loginShowError(err.statusText);
      }
    });

    console.log("");
  }

  private loginShowError(err: string) : void {
    if(err.includes("Unknown Error"))
      alert("Docker OFF")
    else
      alert("Login Error")

    console.error(err);
  }
}
