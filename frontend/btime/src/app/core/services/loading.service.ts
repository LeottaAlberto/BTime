import { Injectable, signal, WritableSignal } from "@angular/core";
import { firstValueFrom, isObservable, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class LoadingService {
  public isVisible: WritableSignal<boolean> = signal(false);

  public show(): void {
    this.isVisible.set(true);
  }
  public hide(): void {
    this.isVisible.set(false);
  }

  public async showLoading<T>(action: () => Promise<T> | Observable<T> | void): Promise<T | void> {
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
