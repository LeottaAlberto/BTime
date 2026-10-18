import { Component, inject, OnInit } from "@angular/core";
import { GNavbarComponent } from "../g-navbar.component/g-navbar.component";
import { DashboardService } from "../../core/services/dashboard.service";
import { LoadingService } from "../../core/services/loading.service";
import { GDashCardComponent } from "../g-dash-card.component/g-dash-card.component";

@Component({
  imports: [GNavbarComponent, GDashCardComponent],
  selector: "g-dashboard",
  styleUrl: "./g-dashboard.component.css",
  templateUrl: "./g-dashboard.component.html",
})
export class GDashboardComponent implements OnInit {
  public dashService = inject(DashboardService);
  public loadScreen = inject(LoadingService);

  ngOnInit(): void {
    this.loadScreen.showLoading(() => this.dashService.loadDashMenu());
  }
}
