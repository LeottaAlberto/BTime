import { Component, effect, inject, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { GTopNavBarComponent } from "../../dashboard/g-top-nav-bar.component/g-top-nav-bar.component";
import { GHeroBannerComponent } from "../g-hero-banner.component/g-hero-banner.component";
import { GMediaRowComponent } from "../g-media-row.component/g-media-row.component";
import { MovieService } from "../../../core/services/dashboard/movies.service";
import { WatchPartyService } from "../../../core/services/watchParty/watchParty.service";

@Component({
  imports: [GTopNavBarComponent, GHeroBannerComponent, GMediaRowComponent],
  selector: "g-movies",
  styleUrl: "./g-movies.component.css",
  templateUrl: "./g-movies.component.html",
})
export class GMoviesComponent implements OnInit {
  public movS = inject(MovieService);
  public partyS = inject(WatchPartyService);
  private router = inject(Router);
  public isJoining = signal(false);

  constructor() {
    effect(() => {
      const room = this.partyS.room();
      if (this.isJoining() && room?.mediaId) {
        this.isJoining.set(false);
        this.router.navigate(["/dashboard/movies/watch", room.mediaId]);
      }
    });
  }

  public ngOnInit(): void {
    this.movS.getContinueWatchingMovies().subscribe();
    this.movS.getFilms().subscribe();
    this.movS.getTvSeries().subscribe();
  }

  public async joinWatchParty(code: string): Promise<void> {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    this.partyS.error.set(null);
    this.isJoining.set(true);
    try {
      await this.partyS.joinParty(trimmed);
    } catch {
      this.isJoining.set(false);
    }
  }
}
