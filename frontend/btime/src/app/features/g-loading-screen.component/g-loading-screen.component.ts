import { Component, inject } from "@angular/core";
import { LoadingService } from "../../core/services/loading.service";

@Component({
  imports: [],
  selector: "g-loading-screen",
  styleUrl: "./g-loading-screen.component.css",
  templateUrl: "./g-loading-screen.component.html",
})
export class GLoadingScreenComponent {
  public loadService = inject(LoadingService);
}
