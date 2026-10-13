import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GLoginComponent } from './features/g-login.component/g-login.component';

@Component({
  selector: "app-root",
  imports: [RouterOutlet, GLoginComponent],
  templateUrl: "./app.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("btime");
}
