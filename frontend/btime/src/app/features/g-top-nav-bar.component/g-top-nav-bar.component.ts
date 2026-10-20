import { Component } from "@angular/core";
import { GSearchInputComponent } from "../g-search-input.component/g-search-input.component";
import { GCategoryFilterGroupComponent } from "../g-category-filter-group.component/g-category-filter-group.component";
import { GNotificationBellComponent } from "../g-notification-bell.component/g-notification-bell.component";

@Component({
  imports: [GSearchInputComponent, GCategoryFilterGroupComponent, GNotificationBellComponent],
  selector: "g-top-nav-bar",
  styleUrl: "./g-top-nav-bar.component.css",
  templateUrl: "./g-top-nav-bar.component.html",
})
export class GTopNavBarComponent {}
