import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { DashItem } from "../interfaces/dashboard/dashItem.interface";
import { Observable, tap } from "rxjs";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private http = inject(HttpClient);
  public dashMenu: WritableSignal<DashItem[] | null> = signal(null);
  public isLoading: WritableSignal<boolean> = signal(false);

  public loadDashMenu(): Observable<DashItem[]> {
    this.isLoading.set(true);

    return this.http.get<DashItem[]>("https://localhost:7255/api/dashboard/dashMenu").pipe(
      tap({
        next: (res) => {
          this.dashMenu.set(res);
          this.isLoading.set(false);
        },
        error: () => {
          this.dashMenu.set([]);
          this.isLoading.set(false);
        },
      })
    );
  }
}
