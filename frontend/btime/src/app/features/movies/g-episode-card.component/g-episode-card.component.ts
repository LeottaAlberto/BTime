import { Component, computed, input, output } from "@angular/core";
import { EpisodeDetail } from "../../../core/interfaces/dashboard/movies/seriesDetail.interface";
import { environment } from "../../../../environments/environment";

@Component({
  imports: [],
  selector: "g-episode-card",
  styleUrl: "./g-episode-card.component.css",
  templateUrl: "./g-episode-card.component.html",
})
export class GEpisodeCardComponent {
  public episode = input.required<EpisodeDetail>();
  public fallbackIcon = input<string>("/hero-banner-fallback.jpg");

  public play = output<EpisodeDetail>();

  public resolvedIcon = computed(() => {
    const raw = this.episode().icon || this.fallbackIcon();
    if (!raw) return "/hero-banner-fallback.jpg";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;
  });

  public onPlay(): void {
    this.play.emit(this.episode());
  }
}
