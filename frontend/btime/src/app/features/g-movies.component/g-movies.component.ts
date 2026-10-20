import { Component, inject, OnInit } from "@angular/core";
import { GTopNavBarComponent } from "../g-top-nav-bar.component/g-top-nav-bar.component";
import { GHeroBannerComponent } from "../g-hero-banner.component/g-hero-banner.component";
import { GMediaRowComponent } from "../g-media-row.component/g-media-row.component";
import { MovieService } from "../../core/services/dashboard/movies.service";

@Component({
  imports: [GTopNavBarComponent, GHeroBannerComponent, GMediaRowComponent],
  selector: "g-movies",
  styleUrl: "./g-movies.component.css",
  templateUrl: "./g-movies.component.html",
})
export class GMoviesComponent implements OnInit {
  public movS = inject(MovieService);

  ngOnInit(): void {
    this.movS.getContinueWatchingMovies().subscribe();
    this.movS.getFilms().subscribe();
    this.movS.getTvSeries().subscribe();
  }
}
