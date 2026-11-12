import { Component, computed, inject, input, InputSignal } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { Router } from "@angular/router";
import { MediaType } from "../../../core/enums/mediaType.enum";

@Component({
  imports: [],
  selector: "g-poster-card",
  styleUrl: "./g-poster-card.component.css",
  templateUrl: "./g-poster-card.component.html",
})
export class GPosterCardComponent {

  private router = inject(Router);

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

  public onClick(): void {
    if (!this.id()) {
      this.router.navigate(["/dashboard/movies/media-details"]);
      return;
    }

    // Se ha una stagione definita è una Serie TV -> apri dettagli stagioni/episodi
    if (this.season() !== undefined) {
      this.router.navigate(["/dashboard/movies/media-details", this.id()]);
    } else {
      // Altrimenti è un Film singolo -> apri direttamente il player
      this.router.navigate(["/dashboard/movies/watch", this.id()], {
        state: { mediaType: MediaType.Movie },
      });
    }
  }
}
