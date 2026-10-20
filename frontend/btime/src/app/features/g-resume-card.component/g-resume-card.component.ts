import { Component, input, InputSignal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-resume-card",
  styleUrl: "./g-resume-card.component.css",
  templateUrl: "./g-resume-card.component.html",
})
export class GResumeCardComponent {
  public cardTitle: InputSignal<string> = input<string>("");
  public season: InputSignal<number> = input<number>(1);
  public episode: InputSignal<number> = input<number>(1);
  public epName: InputSignal<string> = input<string>("");
  public minuteLeft: InputSignal<number> = input<number>(0);
  public totMinute: InputSignal<number> = input<number>(0);
  public icon: InputSignal<string> = input<string>("");
}
