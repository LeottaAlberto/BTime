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

  public isCompleted = input<boolean>(false);
  public progress = input<number>(0);
  public stoppedAtSeconds = input<number | undefined>(undefined);

  // Calcola se l'episodio è visto tutto (completato o >= 90%)
  public isWatched = computed(() => {
    return (
      this.isCompleted() ||
      Boolean((this.episode() as any)?.isCompleted) ||
      this.progressPercent() >= 90
    );
  });

  // Calcola la percentuale di avanzamento
  public progressPercent = computed(() => {
    const p = this.progress() || (this.episode() as any)?.progress || 0;
    return Math.min(100, Math.max(0, p));
  });

  // È visto parzialmente se ha iniziato (progresso > 0) ma non l'ha ancora finito (< 90%)
  public isPartiallyWatched = computed(() => {
    return !this.isWatched() && this.progressPercent() > 0;
  });

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
