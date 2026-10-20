import { Component } from "@angular/core";
import { GTopNavBarComponent } from "../g-top-nav-bar.component/g-top-nav-bar.component";
import { GHeroBannerComponent } from "../g-hero-banner.component/g-hero-banner.component";
import { GMediaRowComponent } from "../g-media-row.component/g-media-row.component";

@Component({
  imports: [GTopNavBarComponent, GHeroBannerComponent, GMediaRowComponent],
  selector: "g-movies",
  styleUrl: "./g-movies.component.css",
  templateUrl: "./g-movies.component.html",
})
export class GMoviesComponent {

}
