import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { DashItem } from "../interfaces/dashboard/dashItem.interface";
import { HeroBannerRes } from "../interfaces/dashboard/heroBanner.interface";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private http = inject(HttpClient);
  public dashMenu: WritableSignal<DashItem[] | null> = signal(null);
  public movieBanner: WritableSignal<HeroBannerRes | null> = signal(null);

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

  public loadMovieBanner(): Observable<HeroBannerRes> {
    return this.http.get<HeroBannerRes>(`${environment.apiUrl}/dashboard/movies/hero-banner`).pipe(
      tap({
        next: (res) => {
          this.movieBanner.set(res);
          console.log(this.movieBanner()?.icon);
        },
        error: () => {
          this.movieBanner.set(null);
        },
      }),
    );
  }
}
