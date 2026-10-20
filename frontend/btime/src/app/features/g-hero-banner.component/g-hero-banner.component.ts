import { Component, InputSignal, OnInit, inject, input } from "@angular/core";
import { GHeroInfoComponent } from "../g-hero-info.component/g-hero-info.component";
import { DashboardService } from "../../core/services/dashboard.service";

@Component({
  imports: [GHeroInfoComponent],
  selector: "g-hero-banner",
  styleUrl: "./g-hero-banner.component.css",
  templateUrl: "./g-hero-banner.component.html",
})
export class GHeroBannerComponent implements OnInit {
  public dashboard = inject(DashboardService);

  public icon: InputSignal<string> = input("");

  public ngOnInit(): void {
    this.dashboard.loadMovieBanner().subscribe();
  }
}
