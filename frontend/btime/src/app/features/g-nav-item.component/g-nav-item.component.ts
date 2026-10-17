import { Component, InputSignal, WritableSignal, input, output, signal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-nav-item",
  styleUrl: "./g-nav-item.component.css",
  templateUrl: "./g-nav-item.component.html",
})
export class GNavItemComponent {
  public icon: InputSignal<string | null> = input<string | null>(null);
  public label: InputSignal<string | null> = input<string | null>(null);
  public isSelected = input<boolean>(false);

  public select = output<void>();

  public onClick() {
    this.select.emit();
  }
}
