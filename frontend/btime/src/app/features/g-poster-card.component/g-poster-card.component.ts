import { Component, computed, input, InputSignal } from "@angular/core";
import { environment } from "../../../environments/environment.development";

@Component({
  imports: [],
  selector: "g-poster-card",
  styleUrl: "./g-poster-card.component.css",
  templateUrl: "./g-poster-card.component.html",
})
export class GPosterCardComponent {
  public id: InputSignal<string> = input<string>("");
  public title: InputSignal<string> = input<string>("");
  public icon: InputSignal<string> = input<string>("");
  public season: InputSignal<number | undefined> = input<number | undefined>(undefined);
  public year: InputSignal<number | undefined> = input<number | undefined>(undefined);
  public duration: InputSignal<number | undefined> = input<number | undefined>(undefined);
  public rating: InputSignal<number | undefined> = input<number | undefined>(undefined);

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
