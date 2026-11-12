import { Component, inject, input, OnDestroy, OnInit, signal, WritableSignal } from "@angular/core";
import { MovieService } from "../../../core/services/dashboard/movies.service";
import { ActivatedRoute, Router } from "@angular/router";
import { EpisodeDetail } from "../../../core/interfaces/dashboard/movies/seriesDetail.interface";
import { environment } from "../../../../environments/environment";
import { GCustomPlayerComponent } from "../g-custom-player.component/g-custom-player.component";
import { Location } from "@angular/common";
import { WatchPartyService } from "../../../core/services/watchParty/watchParty.service";
import { MediaType } from "../../../core/enums/mediaType.enum";
import { Subscription } from "rxjs";

@Component({
  imports: [GCustomPlayerComponent],
  selector: "g-watch-player",
  styleUrl: "./g-watch-player.component.css",
  templateUrl: "./g-watch-player.component.html",
})
export class GWatchPlayerComponent implements OnInit, OnDestroy {
  public readonly id = input<string>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  public movS = inject(MovieService);
  public partyS = inject(WatchPartyService);
  public videoUrl: WritableSignal<string> = signal("");
  public iconUrl: WritableSignal<string> = signal("");
  public episode: WritableSignal<EpisodeDetail | null> = signal(null);
  public mediaType: WritableSignal<MediaType> = signal(MediaType.Episode);
  public isLoading: WritableSignal<boolean> = signal(true);
  public initialTime: WritableSignal<number> = signal(0);

  private routeSub?: Subscription;
  private mediaChangedSub?: Subscription;

  public ngOnInit(): void {
    // Ascolta i cambi di episodio sulla stessa rotta (/watch/:id -> /watch/:nextId)
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const targetId = params.get("id") || this.id() || "";
      this.loadMedia(targetId);
    });

    // Ascolta i cambi episodio decisi dal Watch Party senza chiudere la stanza
    this.mediaChangedSub = this.partyS.mediaChanged$.subscribe((payload) => {
      if (payload.mediaId && payload.mediaId.toLowerCase() !== this.episode()?.id?.toLowerCase()) {
        this.router.navigate(["/dashboard/movies/watch", payload.mediaId]);
      }
    });
  }

  private loadMedia(targetId: string): void {
    this.isLoading.set(true);
    this.initialTime.set(0);

    const activeRoom = this.partyS.room();
    if (activeRoom && activeRoom.mediaId.toLowerCase() === targetId.toLowerCase()) {
      this.initialTime.set(activeRoom.currentTimeSeconds);
    }

    const isMovie =
      activeRoom?.mediaType === MediaType.Movie ||
      String(activeRoom?.mediaType).toLowerCase() === "movie" ||
      history.state?.mediaType === MediaType.Movie;
    this.mediaType.set(isMovie ? MediaType.Movie : MediaType.Episode);

    const stateTime = history.state?.stoppedAtSeconds;
    if (!activeRoom && typeof stateTime === "number" && stateTime > 0) {
      this.initialTime.set(stateTime);
    }

    // Prova a leggere l'episodio passato tramite Router State (solo se l'ID coincide con targetId!)
    const stateEp = history.state?.episode;

    if (stateEp && typeof stateEp === "object" && typeof stateEp.id === "string") {
      if (targetId && stateEp.id.toLowerCase() === targetId.toLowerCase()) {
        this.setEpisodeData(stateEp as EpisodeDetail);
        if (!activeRoom && stateTime === undefined && !stateEp.isCompleted && stateEp.stoppedAtSeconds && stateEp.stoppedAtSeconds > 0) {
          this.initialTime.set(stateEp.stoppedAtSeconds);
        }
        this.isLoading.set(false);
        return;
      }
    }

    // Recupera dal backend via API (include anche NextEpisodeId / NextEpisodeTitle)
    if (targetId) {
      const request$ =
        this.mediaType() === MediaType.Movie
          ? this.movS.getFilmById(targetId)
          : this.movS.getEpisodeById(targetId);

      request$.subscribe({
        next: (ep) => {
          this.setEpisodeData(ep);
          if (!this.partyS.room() && this.initialTime() === 0 && !ep.isCompleted && ep.stoppedAtSeconds && ep.stoppedAtSeconds > 0) {
            this.initialTime.set(ep.stoppedAtSeconds);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error("Errore recupero contenuto:", err);
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  public ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.mediaChangedSub?.unsubscribe();
    // Esce dal Party solo se stiamo davvero lasciando il player (non cambiando episodio)
    if (this.partyS.room() && !this.router.url.includes("/watch")) {
      this.partyS.leaveParty();
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
    if (this.partyS.room()) {
      this.partyS.leaveParty();
    }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }

    const seriesId = this.episode()?.seriesId;
    if (this.mediaType() === MediaType.Episode && seriesId) {
      this.router.navigate(["/dashboard/movies/media-details", seriesId]);
    } else {
      this.router.navigate(["/dashboard/movies"]);
    }
  }
}
