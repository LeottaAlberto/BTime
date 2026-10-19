import { Component, inject, OnInit } from "@angular/core";
import { DashboardService } from "../../core/services/dashboard.service";
import { LoadingService } from "../../core/services/loading.service";
import { GDashCardComponent } from "../g-dash-card.component/g-dash-card.component";

@Component({
  imports: [GDashCardComponent],
  selector: "g-dash-overview",
  styleUrl: "./g-dash-overview.component.css",
  templateUrl: "./g-dash-overview.component.html",
})
export class GDashOverviewComponent implements OnInit {
  public dashService = inject(DashboardService);
  public loadScreen = inject(LoadingService);

  ngOnInit(): void {
    this.loadScreen.showLoading(() => this.dashService.loadDashMenu());
  }
}

