import { Injectable, signal, WritableSignal } from "@angular/core";
import { GlobalErrorOption } from "../../interfaces/service/globalErrorOption.interface";

@Injectable({ providedIn: "root" })
export class GlobalService {
  public isVisible: WritableSignal<boolean> = signal(false);
  public title: WritableSignal<string> = signal("");
  public message: WritableSignal<string> = signal("");
  public statusCode: WritableSignal<number | null> = signal(null);
  public statusText: WritableSignal<string> = signal("");
  public url: WritableSignal<string> = signal("");
  public method: WritableSignal<string> = signal("");
  public details: WritableSignal<string[]> = signal([]);
  public timestamp: WritableSignal<string> = signal("");

  public show(opt: GlobalErrorOption): void {
    this.title.set(opt.title);
    this.message.set(opt.message);
    this.statusCode.set(opt.statusCode ?? null);
    this.statusText.set(opt.statusText ?? "");
    this.url.set(opt.url ?? "");
    this.method.set(opt.method ?? "");
    this.details.set(opt.details ?? []);
    this.timestamp.set(opt.timestamp ?? new Date().toLocaleTimeString());
    this.isVisible.set(true);
  }

  public close(): void {
    this.isVisible.set(false);
  }
}
