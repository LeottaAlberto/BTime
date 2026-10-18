import { Component, inject } from "@angular/core";
import { AlertService } from "../../core/services/alertMessage/alert.service";
import { StatusType } from "../../core/enums/statusType.enum";

@Component({
  selector: "g-show-alert",
  imports: [],
  templateUrl: "./g-show-alert.component.html",
  styleUrl: "./g-show-alert.component.css",
})
export class GShowAlertComponent {
  public alert = inject(AlertService);
}
