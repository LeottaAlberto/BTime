import { Component, signal, ChangeDetectionStrategy, viewChild, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GShowToastComponent } from './features/g-show-toast.component/g-show-toast.component';
import { GGlobalErrorComponent } from './features/g-global-error.component/g-global-error.component';
import { GLoadingScreenComponent } from './features/g-loading-screen.component/g-loading-screen.component';

@Component({
  selector: "app-root",
  imports: [RouterOutlet, GShowToastComponent, GGlobalErrorComponent, GLoadingScreenComponent],
  templateUrl: "./app.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.css",
})
export class App {
  protected readonly title = signal("btime");
}
