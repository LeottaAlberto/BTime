import { Component, signal, WritableSignal } from "@angular/core";

@Component({
  imports: [],
  selector: "g-show-message",
  styleUrl: "./g-show-message.component.css",
  templateUrl: "./g-show-message.component.html",
})
export class GShowMessageComponent {
  public isVisible: WritableSignal<boolean> = signal(false);
  public title: WritableSignal<string> = signal("Are you sure?");
  public message: WritableSignal<string> = signal("");
  public status: WritableSignal<boolean | null> = signal(null);

  private resolveFn?: (value: boolean) => void;

  public showMessage(m: string, title: string = "Are you sure?"): Promise<boolean> {
    if (this.resolveFn) {
      this.resolveFn(false);
    }

    this.title.set(title);
    this.message.set(m);
    this.status.set(null);
    this.isVisible.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  public onResponse(result: boolean): void {
    this.status.set(result);
    this.isVisible.set(false);
    if (this.resolveFn) {
      this.resolveFn(result);
      this.resolveFn = undefined;
    }
  }
}
