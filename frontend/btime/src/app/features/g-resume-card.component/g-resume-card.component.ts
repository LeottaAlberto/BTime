import { Component, computed, input, InputSignal } from "@angular/core";
import { environment } from "../../../environments/environment.development";

@Component({
  imports: [],
  selector: "g-resume-card",
  styleUrl: "./g-resume-card.component.css",
  templateUrl: "./g-resume-card.component.html",
})
export class GResumeCardComponent {
  public cardTitle: InputSignal<string> = input<string>("");
  public season: InputSignal<number | undefined> = input<number | undefined>(undefined);
  public episode: InputSignal<number | undefined> = input<number | undefined>(undefined);
  public epName: InputSignal<string | undefined> = input<string | undefined>("");
  public minuteLeft: InputSignal<number> = input<number>(0);
  public totMinute: InputSignal<number> = input<number>(0);
  public progress: InputSignal<number> = input<number>(0);
  public icon: InputSignal<string> = input<string>("");

  public resolvedIcon = computed(() => {
    const raw = this.icon();
    if (!raw) return "/hero-banner-fallback.jpg";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;
  });
}
