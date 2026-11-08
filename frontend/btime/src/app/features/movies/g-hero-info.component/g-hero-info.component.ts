import { Component, input, InputSignal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-hero-info",
  styleUrl: "./g-hero-info.component.css",
  templateUrl: "./g-hero-info.component.html",
})
export class GHeroInfoComponent {
  public bannerTitle: InputSignal<string> = input("");
  public description: InputSignal<string> = input("");
}
