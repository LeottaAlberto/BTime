import { Injectable, signal, WritableSignal } from "@angular/core";
import { AlertOptions } from "../../interfaces/service/alertOption.interface";
import { StatusType } from "../../enums/statusType.enum";

@Injectable({ providedIn: "root" })
export class AlertService {
  private readonly STANDARD_DURATION = 4000;

  private readonly MAP_TO_BG: Record<number, string> = {
    10: "oklch(44.4% 0.177 26.899)",
    20: "oklch(36.7% 0.016 35.7)",
    30: "oklch(64.8% 0.2 131.684)",
  };

  public isVisible: WritableSignal<boolean> = signal(false);
  public title: WritableSignal<string> = signal("");
  public message: WritableSignal<string> = signal("");
  public duration: WritableSignal<number> = signal(this.STANDARD_DURATION);
  public statusColor: WritableSignal<string> = signal("");

  private timeoutId?: any;

  public show(opt: AlertOptions): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);

    const duration = opt.duration ?? this.STANDARD_DURATION;
    const status = opt.status ?? StatusType.Normal;

    this.duration.set(duration);
    this.statusColor.set(this.MAP_TO_BG[status]);
    this.title.set(opt.title);
    this.message.set(opt.message);
    this.isVisible.set(true);

    this.timeoutId = setTimeout(() => {
      this.close();
    }, duration);
  }

  public close(): void {
    this.isVisible.set(false);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
