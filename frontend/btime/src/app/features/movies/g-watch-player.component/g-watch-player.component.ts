import { Component, inject, input, OnInit, signal, WritableSignal } from "@angular/core";
import { MovieService } from "../../../core/services/dashboard/movies.service";
import { ActivatedRoute, Router } from "@angular/router";
import { EpisodeDetail } from "../../../core/interfaces/dashboard/movies/seriesDetail.interface";
import { environment } from "../../../../environments/environment";
import { GCustomPlayerComponent } from "../g-custom-player.component/g-custom-player.component";
import { Location } from "@angular/common";

@Component({
  imports: [GCustomPlayerComponent],
  selector: "g-watch-player",
  styleUrl: "./g-watch-player.component.css",
  templateUrl: "./g-watch-player.component.html",
})
export class GWatchPlayerComponent implements OnInit {
  public readonly id = input<string>();
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  public movS = inject(MovieService);
  public videoUrl: WritableSignal<string> = signal("");
  public iconUrl: WritableSignal<string> = signal("");
  public episode: WritableSignal<EpisodeDetail | null> = signal(null);
  public isLoading: WritableSignal<boolean> = signal(true);
  public initialTime: WritableSignal<number> = signal(0);

  public ngOnInit(): void {
    const targetId = this.id() || this.route.snapshot.paramMap.get("id") || "";

    const stateTime = history.state?.stoppedAtSeconds;
    if (typeof stateTime === "number" && stateTime > 0) {
      this.initialTime.set(stateTime);
    }

    // Prova a leggere l'episodio passato tramite Router State (istantaneo, 0 attesa se è un EpisodeDetail valido)
    const stateEp = history.state?.episode;

    if (stateEp && typeof stateEp === "object" && typeof stateEp.id === "string") {
      if (!targetId || stateEp.id.toLowerCase() === targetId.toLowerCase()) {
        this.setEpisodeData(stateEp as EpisodeDetail);
        if (stateTime === undefined && !stateEp.isCompleted && stateEp.stoppedAtSeconds && stateEp.stoppedAtSeconds > 0) {
          this.initialTime.set(stateEp.stoppedAtSeconds);
        }
        this.isLoading.set(false);
        return;
      }
    }

    // Se non presente nello state (es. refresh F5), recupera dal backend via API
    if (targetId) {
      this.movS.getEpisodeById(targetId).subscribe({
        next: (ep) => {
          this.setEpisodeData(ep);
          if (this.initialTime() === 0 && !ep.isCompleted && ep.stoppedAtSeconds && ep.stoppedAtSeconds > 0) {
            this.initialTime.set(ep.stoppedAtSeconds);
          }
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
    this.episode.set({
      ...ep,
      path: this.formatMediaUrl(ep.path),
      icon: this.formatMediaUrl(ep.icon),
    });
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
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
    this.location.back();
  }
}
