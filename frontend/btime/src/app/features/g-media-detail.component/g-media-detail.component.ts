import { Component, computed, inject, input, OnInit, signal, WritableSignal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MovieService } from "../../core/services/dashboard/movies.service";
import { SeriesCard } from "../../core/interfaces/dashboard/movies/seriesCard.interface";
import { SeriesDetail, SeasonDetail, EpisodeDetail } from "../../core/interfaces/dashboard/movies/seriesDetail.interface";
import { environment } from "../../../environments/environment";

@Component({
  imports: [],
  selector: "g-media-detail",
  styleUrl: "./g-media-detail.component.css",
  templateUrl: "./g-media-detail.component.html",
})
export class GMediaDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public movS = inject(MovieService);

  public id = input<string>("");

  public seriesDetail: WritableSignal<SeriesDetail | null> = signal(null);
  public selectedSeason: WritableSignal<SeasonDetail | null> = signal(null);
  public tvInfo: WritableSignal<SeriesCard | null> = signal(null);
  public isLoading: WritableSignal<boolean> = signal(true);

  public resolvedIcon = computed(() => {
    const raw = this.seriesDetail()?.icon || this.tvInfo()?.icon;
    if (!raw) return "/hero-banner-fallback.jpg";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;
  });

  public ngOnInit(): void {
    const targetId = this.id() || this.route.snapshot.paramMap.get("id") || "";

    // 1. Inizializzazione immediata da dati in cache (se già caricati)
    if (targetId) {
      const cached = (this.movS.series() ?? []).find(
        (v) => v.id.toLowerCase() === targetId.toLowerCase()
      );
      if (cached) {
        this.tvInfo.set(cached);
      }
    }

    // 2. Chiamata API per ottenere tutti i dettagli con stagioni ed episodi
    if (targetId) {
      this.movS.getSeriesDetail(targetId).subscribe({
        next: (detail) => {
          this.seriesDetail.set(detail);
          this.tvInfo.set(detail);
          if (detail.seasons && detail.seasons.length > 0) {
            this.selectedSeason.set(detail.seasons[0]);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.warn("Dettagli serie non trovati con ID, tento fallback su lista...", err);
          this.fallbackLoad(targetId);
        },
      });
    } else {
      this.fallbackLoad("");
    }
  }

  public close(): void {
    this.router.navigate(["dashboard/movies"])
  }

  public playEpisode(ep: EpisodeDetail): void {
    this.router.navigate(["/dashboard/movies/watch", ep.id], {
      state: { episode: ep },
    });
  }

  private fallbackLoad(targetId: string): void {
    this.movS.getTvSeries().subscribe({
      next: (value) => {
        const tv = targetId
          ? (value ?? []).find((v) => v.id.toLowerCase() === targetId.toLowerCase())
          : (value ?? [])[0];
        if (tv) {
          this.tvInfo.set(tv);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  public selectSeason(season: SeasonDetail): void {
    this.selectedSeason.set(season);
  }

  public resolveEpisodeIcon(ep: EpisodeDetail): string {
    const raw = ep.icon || this.resolvedIcon();
    if (!raw) return "/hero-banner-fallback.jpg";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;

  }
}
