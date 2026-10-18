import { Component, input, InputSignal, signal, WritableSignal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-dash-card",
  styleUrl: "./g-dash-card.component.css",
  templateUrl: "./g-dash-card.component.html",
})
export class GDashCardComponent {
  public title: InputSignal<string> = input<string>("");
  public img: InputSignal<string> = input<string>("");
  public description: InputSignal<string> = input<string>("");
}
