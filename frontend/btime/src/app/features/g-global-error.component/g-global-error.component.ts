import { Component, inject } from "@angular/core";
import { GlobalService as GlobalErrorService } from "../../core/services/globalError/global.service";

@Component({
  imports: [],
  selector: "g-global-error",
  styleUrl: "./g-global-error.component.css",
  templateUrl: "./g-global-error.component.html",
})
export class GGlobalErrorComponent {
  public error = inject(GlobalErrorService);
}
