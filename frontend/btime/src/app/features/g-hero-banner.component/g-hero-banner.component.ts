import { Component } from "@angular/core";
import { GHeroInfoComponent } from "../g-hero-info.component/g-hero-info.component";

@Component({
  imports: [GHeroInfoComponent],
  selector: "g-hero-banner",
  styleUrl: "./g-hero-banner.component.css",
  templateUrl: "./g-hero-banner.component.html",
})
export class GHeroBannerComponent {}
