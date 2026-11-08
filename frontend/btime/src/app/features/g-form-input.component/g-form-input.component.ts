import { Component, input, model, Signal, signal, WritableSignal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-form-input",
  styleUrl: "./g-form-input.component.css",
  templateUrl: "./g-form-input.component.html",
})
export class GFormInputComponent {
  public inputValue = model<string | null>(null);
  public label = input<string | null>(null);
  public icon = input<string | null>(null);
  public cName = input<string | null>(null);

  public isRequired = input<boolean>(false);
  public isPassword = input<boolean>(false);
  public isSpecial = input<boolean>(false);
  public showPassword = signal<boolean>(false);

  public togglePasswordVisibility(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.showPassword.update((prev) => !prev);
  }
}
