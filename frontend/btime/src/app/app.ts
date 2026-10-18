import { Component, signal, ChangeDetectionStrategy, viewChild, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GShowToastComponent } from './features/g-show-toast.component/g-show-toast.component';

@Component({
  selector: "app-root",
  imports: [RouterOutlet, GShowToastComponent],
  templateUrl: "./app.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("btime");
  public showToast: Signal<GShowToastComponent | undefined> = viewChild(GShowToastComponent);
}
