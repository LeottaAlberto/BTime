import { Component, input, InputSignal } from "@angular/core";
import { GResumeCardComponent } from "../g-resume-card.component/g-resume-card.component";
import { GPosterCardComponent } from "../g-poster-card.component/g-poster-card.component";

@Component({
  imports: [GResumeCardComponent, GPosterCardComponent],
  selector: "g-media-row",
  styleUrl: "./g-media-row.component.css",
  templateUrl: "./g-media-row.component.html",
})
export class GMediaRowComponent {
  public isVertical: InputSignal<boolean> = input<boolean>(false);
  public titleRow: InputSignal<string> = input<string>("");
  public items: InputSignal<any[]> = input<any[]>([]);
}
