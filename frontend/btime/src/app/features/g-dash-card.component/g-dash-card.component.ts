import { Component, inject, input, InputSignal, signal, WritableSignal } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  imports: [],
  selector: "g-dash-card",
  styleUrl: "./g-dash-card.component.css",
  templateUrl: "./g-dash-card.component.html",
})
export class GDashCardComponent {
  private router = inject(Router);

  public route = input<string>("");
  public title: InputSignal<string> = input<string>("");
  public img: InputSignal<string> = input<string>("");
  public description: InputSignal<string> = input<string>("");

  public onClick(): void {
    if (this.route())
      this.router.navigate([this.route()]);
  }
}
