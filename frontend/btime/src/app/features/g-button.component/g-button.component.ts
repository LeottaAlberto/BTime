import { Component, input, output } from "@angular/core";

@Component({
  imports: [],
  selector: "g-button",
  styleUrl: "./g-button.component.css",
  templateUrl: "./g-button.component.html",
})
export class GButtonComponent {
  public label = input<string>("Button");
  public type = input<"button" | "submit" | "reset">("button");
  public variant = input<"primary" | "secondary" | "outline">("primary");
  public icon = input<string | null>(null);
  public disabled = input<boolean>(false);
  public loading = input<boolean>(false);
  public fullWidth = input<boolean>(true);
  public customClass = input<string>("");

  public btnClick = output<MouseEvent>();

  public handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.btnClick.emit(event);
  }
}
