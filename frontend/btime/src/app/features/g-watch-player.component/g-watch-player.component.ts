import { Component, inject, input, OnInit, signal, WritableSignal } from "@angular/core";
import { MovieService } from "../../core/services/dashboard/movies.service";
import { ActivatedRoute, Router } from "@angular/router";
import { EpisodeDetail } from "../../core/interfaces/dashboard/movies/seriesDetail.interface";
import { environment } from "../../../environments/environment";

@Component({
  imports: [],
  selector: "g-watch-player",
  styleUrl: "./g-watch-player.component.css",
  templateUrl: "./g-watch-player.component.html",
})
export class GWatchPlayerComponent implements OnInit {
  public readonly id = input<string>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public movS = inject(MovieService);

  public episode: WritableSignal<EpisodeDetail | null> = signal(null);
  public videoUrl: WritableSignal<string> = signal("");
  public iconUrl: WritableSignal<string> = signal("");
  public isLoading: WritableSignal<boolean> = signal(true);

  public ngOnInit(): void {
    const targetId = this.id() || this.route.snapshot.paramMap.get("id") || "";

    // 1. Prova a leggere l'episodio passato tramite Router State (istantaneo, 0 attesa)
    const stateEp = history.state?.episode as EpisodeDetail | undefined;
    if (stateEp && (!targetId || stateEp.id.toLowerCase() === targetId.toLowerCase())) {
      this.setEpisodeData(stateEp);
      this.isLoading.set(false);
      return;
    }

    // 2. Se non presente nello state (es. refresh F5), recupera dal backend via API
    if (targetId) {
      this.movS.getEpisodeById(targetId).subscribe({
        next: (ep) => {
          this.setEpisodeData(ep);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error("Errore recupero episodio:", err);
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  private setEpisodeData(ep: EpisodeDetail): void {
    this.episode.set(ep);
    this.videoUrl.set(this.formatMediaUrl(ep.path));
    this.iconUrl.set(this.formatMediaUrl(ep.icon));
  }

  private formatMediaUrl(url?: string): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${url}`;
    }
    return url;
  }

  public close(): void {
    this.router.navigate(["/dashboard/movies"]);
  }
}
