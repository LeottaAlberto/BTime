import { Component, inject } from "@angular/core";
import { AlertService } from "../../core/services/alertMessage/alert.service";
import { StatusType } from "../../core/enums/statusType.enum";

@Component({
  selector: "g-show-toast",
  imports: [],
  templateUrl: "./g-show-toast.component.html",
  styleUrl: "./g-show-toast.component.css",
})
export class GShowToastComponent {
  public alert = inject(AlertService);
}
