import { Component, InputSignal, OnInit, computed, inject, input } from "@angular/core";
import { GHeroInfoComponent } from "../g-hero-info.component/g-hero-info.component";
import { DashboardService } from "../../core/services/dashboard/dashboard.service";
import { MovieService } from "../../core/services/dashboard/movies.service";
import { environment } from "../../../environments/environment";

@Component({
  imports: [GHeroInfoComponent],
  selector: "g-hero-banner",
  styleUrl: "./g-hero-banner.component.css",
  templateUrl: "./g-hero-banner.component.html",
})
export class GHeroBannerComponent implements OnInit {
  public dashboard = inject(DashboardService);
  public movS = inject(MovieService);

  public icon: InputSignal<string> = input("");

  public bannerIcon = computed(() => {
    const raw = this.movS.movieBanner()?.icon;
    if (!raw) return "/hero-banner-fallback.jpg";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;
  });

  public ngOnInit(): void {
    this.movS.loadMovieBanner().subscribe();
  }
}
