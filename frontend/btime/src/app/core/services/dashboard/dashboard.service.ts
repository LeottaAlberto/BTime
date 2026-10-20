import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { DashItem } from "../../interfaces/dashboard/dashItem.interface";
import { Observable, tap } from "rxjs";
import { environment } from "../../../../environments/environment";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private http = inject(HttpClient);
  public dashMenu: WritableSignal<DashItem[] | null> = signal(null);

  public loadDashMenu(): Observable<DashItem[]> {
    return this.http.get<DashItem[]>(`${environment.apiUrl}/dashboard/dashMenu`).pipe(
      tap({
        next: (res) => {
          this.dashMenu.set(res);
        },
        error: () => {
          this.dashMenu.set([]);
        },
      }),
    );
  }
}
