import { Component } from "@angular/core";
import { GNavbarComponent } from "../g-navbar.component/g-navbar.component";
import { RouterOutlet } from "@angular/router";

@Component({
  imports: [GNavbarComponent, RouterOutlet],
  selector: "g-dashboard",
  styleUrl: "./g-dashboard.component.css",
  templateUrl: "./g-dashboard.component.html",
})
export class GDashboardComponent {}
