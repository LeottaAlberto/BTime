import { Injectable, signal, WritableSignal } from "@angular/core";
import { firstValueFrom, isObservable, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class LoadingService {
  private activeRequests: WritableSignal<number> = signal(0);
  public isVisible: WritableSignal<boolean> = signal(false);

  public show(): void {
    this.activeRequests.update((count) => count + 1);
    this.isVisible.set(true);
  }

  public hide(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
    if (this.activeRequests() === 0) {
      this.isVisible.set(false);
    }
  }

  public async showLoading<T>(action: () => Promise<T> | Observable<T> | void): Promise<T | any> {
    this.show();
    try {
      const result = action();

      if (isObservable(result))
        return await firstValueFrom(result);

      return await result;
    } finally {
      this.hide();
    }
  }
}
