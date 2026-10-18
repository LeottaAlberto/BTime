import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { LoginResponse } from "../interfaces/login/loginResponse.interface";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private http = inject(HttpClient);
  public users: WritableSignal<LoginResponse[] | null> = signal(null);
  public isLoading: WritableSignal<boolean> = signal(false);

  public loadUser(): void {
    this.isLoading.set(true);

    this.http.get<LoginResponse[]>("https://localhost:7255/api/dashboard/users").subscribe({
      next: (res) => {
        this.users.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.isLoading.set(false);
      },
    });

  }

}
