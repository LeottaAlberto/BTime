import { Component, signal, ChangeDetectionStrategy, viewChild, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GShowAlertComponent } from './features/g-show-alert.component/g-show-alert.component';

@Component({
  selector: "app-root",
  imports: [RouterOutlet, GShowAlertComponent],
  templateUrl: "./app.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("btime");
  public showAlert: Signal<GShowAlertComponent | undefined> = viewChild(GShowAlertComponent);
}
