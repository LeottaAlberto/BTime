import { Component, input, InputSignal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-poster-card",
  styleUrl: "./g-poster-card.component.css",
  templateUrl: "./g-poster-card.component.html",
})
export class GPosterCardComponent {
  public season: InputSignal<number> = input<number>(0);
  public icon: InputSignal<string> = input<string>("");
}
