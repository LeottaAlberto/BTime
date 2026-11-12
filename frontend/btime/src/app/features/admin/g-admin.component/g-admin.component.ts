import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpEventType } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../../core/auth/auth.service";
import { AdminService } from "../../../core/services/admin/admin.service";
import { AlertService } from "../../../core/services/alertMessage/alert.service";
import { StatusType } from "../../../core/enums/statusType.enum";
import { environment } from "../../../../environments/environment";
import {
  AdminMovieItem,
  SeriesEpisodeNode,
  SeriesSeasonNode,
  SeriesTreeNode,
  TagItem,
} from "../../../core/interfaces/admin/admin.interface";

@Component({
  imports: [CommonModule, FormsModule],
  selector: "g-admin",
  styleUrl: "./g-admin.component.css",
  templateUrl: "./g-admin.component.html",
})
export class GAdminComponent implements OnInit {
  public auth = inject(AuthService);
  public adminService = inject(AdminService);
  private alertService = inject(AlertService);

  // Tabs
  public activeTab = signal<"movies" | "series" | "catalog">("movies");
  public seriesSubTab = signal<"tree" | "new-series" | "new-season" | "new-episode">("new-series");

  // Loading & Upload Progress
  public isSubmitting = signal<boolean>(false);
  public uploadProgress = signal<number | null>(null);

  // ---------------------------------------------------------------------------
  // FILM / MOVIES STATE
  // ---------------------------------------------------------------------------
  public movieTitle = signal<string>("");
  public movieDesc = signal<string>("");
  public movieDuration = signal<number | null>(null);

  public movieCoverMode = signal<"upload" | "url">("upload");
  public movieCoverFile: File | null = null;
  public movieCoverPreview = signal<string | null>(null);
  public movieCoverUrl = signal<string>("");

  public movieVideoMode = signal<"upload" | "path">("upload");
  public movieVideoFile: File | null = null;
  public movieVideoFileName = signal<string>("");
  public movieVideoPath = signal<string>("");

  public movieSelectedTagIds = signal<string[]>([]);
  public movieNewTagInput = signal<string>("");
  public movieNewTagsList = signal<string[]>([]);

  // ---------------------------------------------------------------------------
  // SERIE TV STATE
  // ---------------------------------------------------------------------------
  public seriesTitle = signal<string>("");
  public seriesDesc = signal<string>("");
  public seriesYear = signal<number | null>(new Date().getFullYear());
  public seriesRating = signal<number | null>(8.0);

  public seriesCoverMode = signal<"upload" | "url">("upload");
  public seriesCoverFile: File | null = null;
  public seriesCoverPreview = signal<string | null>(null);
  public seriesCoverUrl = signal<string>("");

  public seriesSelectedTagIds = signal<string[]>([]);
  public seriesNewTagInput = signal<string>("");
  public seriesNewTagsList = signal<string[]>([]);

  // ---------------------------------------------------------------------------
  // STAGIONE STATE
  // ---------------------------------------------------------------------------
  public seasonSeriesId = signal<string>("");
  public seasonNumber = signal<number>(1);
  public seasonTitle = signal<string>("");
  public seasonDesc = signal<string>("");
  public seasonYear = signal<number | null>(new Date().getFullYear());

  // ---------------------------------------------------------------------------
  // EPISODIO STATE
  // ---------------------------------------------------------------------------
  public epSeriesId = signal<string>("");
  public epSeasonId = signal<string>("");
  public epNumber = signal<number>(1);
  public epTitle = signal<string>("");
  public epDesc = signal<string>("");
  public epDuration = signal<number | null>(null);

  public epCoverMode = signal<"upload" | "url">("upload");
  public epCoverFile: File | null = null;
  public epCoverPreview = signal<string | null>(null);
  public epCoverUrl = signal<string>("");

  public epVideoMode = signal<"upload" | "path">("upload");
  public epVideoFile: File | null = null;
  public epVideoFileName = signal<string>("");
  public epVideoPath = signal<string>("");

  // ---------------------------------------------------------------------------
  // CATALOGO & TAG STANDALONE STATE
  // ---------------------------------------------------------------------------
  public newStandaloneTagName = signal<string>("");

  // ---------------------------------------------------------------------------
  // EDIT MODAL STATE (Film, Serie, Stagioni, Episodi, Tag)
  // ---------------------------------------------------------------------------
  public editingMode = signal<"movie" | "series" | "season" | "episode" | "tag" | null>(null);
  public editingId = signal<string>("");
  public editTitle = signal<string>("");
  public editDesc = signal<string>("");
  public editNumber = signal<number>(1);
  public editSeasonId = signal<string>("");
  public editAvailableSeasons = signal<SeriesSeasonNode[]>([]);
  public editYear = signal<number | null>(null);
  public editRating = signal<number | null>(null);
  public editDuration = signal<number | null>(null);

  public editCoverMode = signal<"keep" | "upload" | "url">("keep");
  public editCoverFile: File | null = null;
  public editCoverPreview = signal<string | null>(null);
  public editCoverUrl = signal<string>("");

  public editVideoMode = signal<"keep" | "upload" | "path">("keep");
  public editVideoFile: File | null = null;
  public editVideoFileName = signal<string>("");
  public editVideoPath = signal<string>("");

  public editSelectedTagIds = signal<string[]>([]);
  public editNewTagInput = signal<string>("");
  public editNewTagsList = signal<string[]>([]);

  // ---------------------------------------------------------------------------
  // COMPUTED PROPERTIES
  // ---------------------------------------------------------------------------
  public availableSeasonsForSelectedSeries = computed(() => {
    const sId = this.epSeriesId();
    if (!sId) return [];
    const series = this.adminService.seriesTree().find((item) => item.id === sId);
    return series?.seasons ?? [];
  });

  public ngOnInit(): void {
    this.adminService.loadTags().subscribe();
    this.adminService.loadMoviesList().subscribe();
    this.adminService.loadSeriesTree().subscribe();
  }

  public setTab(tab: "movies" | "series" | "catalog"): void {
    this.activeTab.set(tab);
    if (tab === "movies") {
      this.adminService.loadMoviesList().subscribe();
    } else if (tab === "series") {
      this.adminService.loadSeriesTree().subscribe();
    }
  }

  public setSeriesSubTab(subTab: "tree" | "new-series" | "new-season" | "new-episode"): void {
    this.seriesSubTab.set(subTab);
  }

  // ---------------------------------------------------------------------------
  // TAG SELECTION HELPERS
  // ---------------------------------------------------------------------------
  public toggleMovieTag(tagId: string): void {
    this.movieSelectedTagIds.update((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  public addMovieCustomTag(): void {
    const name = this.movieNewTagInput().trim();
    if (!name) return;
    if (!this.movieNewTagsList().includes(name)) {
      this.movieNewTagsList.update((list) => [...list, name]);
    }
    this.movieNewTagInput.set("");
  }

  public removeMovieCustomTag(name: string): void {
    this.movieNewTagsList.update((list) => list.filter((t) => t !== name));
  }

  public toggleSeriesTag(tagId: string): void {
    this.seriesSelectedTagIds.update((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  public addSeriesCustomTag(): void {
    const name = this.seriesNewTagInput().trim();
    if (!name) return;
    if (!this.seriesNewTagsList().includes(name)) {
      this.seriesNewTagsList.update((list) => [...list, name]);
    }
    this.seriesNewTagInput.set("");
  }

  public removeSeriesCustomTag(name: string): void {
    this.seriesNewTagsList.update((list) => list.filter((t) => t !== name));
  }

  // ---------------------------------------------------------------------------
  // FILE INPUT HANDLERS
  // ---------------------------------------------------------------------------
  public onMovieCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.movieCoverFile = file;
      const reader = new FileReader();
      reader.onload = () => this.movieCoverPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  public onMovieVideoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.movieVideoFile = file;
      this.movieVideoFileName.set(file.name);
      this.movieDuration.set(null);
      this.extractVideoDurationMinutes(file).then((mins) => {
        if (mins !== null) this.movieDuration.set(mins);
      });
    }
  }

  public onSeriesCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.seriesCoverFile = file;
      const reader = new FileReader();
      reader.onload = () => this.seriesCoverPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  public onEpCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.epCoverFile = file;
      const reader = new FileReader();
      reader.onload = () => this.epCoverPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  public onEpVideoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.epVideoFile = file;
      this.epVideoFileName.set(file.name);
      this.epDuration.set(null);
      this.extractVideoDurationMinutes(file).then((mins) => {
        if (mins !== null) this.epDuration.set(mins);
      });
    }
  }

  private extractVideoDurationMinutes(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        video.remove();
      };

      video.onloadedmetadata = () => {
        const mins =
          video.duration && isFinite(video.duration) && video.duration > 0
            ? Math.max(1, Math.round(video.duration / 60))
            : null;
        cleanup();
        resolve(mins);
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      video.src = objectUrl;
    });
  }

  // Helper per upload video con progress bar
  private uploadVideoWithProgress(file: File): Promise<{ path: string; durationMinutes?: number | null }> {
    return new Promise((resolve, reject) => {
      this.adminService.uploadVideo(file).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            this.uploadProgress.set(progress);
          } else if (event.type === HttpEventType.Response) {
            this.uploadProgress.set(100);
            const body = event.body as any;
            resolve({ path: body.path, durationMinutes: body.durationMinutes ?? null });
          }
        },
        error: (err) => reject(err),
      });
    });
  }

  // ---------------------------------------------------------------------------
  // SUBMIT FILM
  // ---------------------------------------------------------------------------
  public async submitMovie(): Promise<void> {
    if (!this.movieTitle().trim()) {
      this.alertService.show({
        title: "Campo mancante",
        message: "Il titolo del film è obbligatorio.",
        status: StatusType.Bad,
      });
      return;
    }

    if (this.movieVideoMode() === "upload" && !this.movieVideoFile) {
      this.alertService.show({
        title: "Video mancante",
        message: "Seleziona un file video da caricare.",
        status: StatusType.Bad,
      });
      return;
    }

    if (this.movieVideoMode() === "path" && !this.movieVideoPath().trim()) {
      this.alertService.show({
        title: "Percorso mancante",
        message: "Inserisci il percorso del video presente su disco o server.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isSubmitting.set(true);
    this.uploadProgress.set(null);

    try {
      let coverImageId: string | undefined = undefined;
      let coverUrl: string | undefined = undefined;

      // 1. Upload Cover se impostato su upload file
      if (this.movieCoverMode() === "upload" && this.movieCoverFile) {
        const coverRes = await firstValueFrom(this.adminService.uploadCover(this.movieCoverFile));
        coverImageId = coverRes.imageId;
      } else if (this.movieCoverMode() === "url" && this.movieCoverUrl().trim()) {
        coverUrl = this.movieCoverUrl().trim();
      }

      // 2. Upload Video se impostato su file
      let videoPath = "";
      let detectedDuration = this.movieDuration();
      if (this.movieVideoMode() === "upload" && this.movieVideoFile) {
        const upRes = await this.uploadVideoWithProgress(this.movieVideoFile);
        videoPath = upRes.path;
        detectedDuration ??= upRes.durationMinutes ?? null;
      } else {
        videoPath = this.movieVideoPath().trim();
      }

      // 3. Salva Film
      await firstValueFrom(
        this.adminService.createMovie({
          title: this.movieTitle().trim(),
          description: this.movieDesc().trim() || undefined,
          duration: detectedDuration ?? undefined,
          coverImageId,
          coverUrl,
          videoPath,
          tagIds: this.movieSelectedTagIds(),
          newTags: this.movieNewTagsList(),
        }),
      );

      this.alertService.show({
        title: "Film Salvato",
        message: `Il film "${this.movieTitle()}" è stato aggiunto con successo al catalogo!`,
        status: StatusType.Good,
      });

      this.resetMovieForm();
      this.adminService.loadMoviesList().subscribe();
      this.adminService.loadTags().subscribe();
    } catch (err: any) {
      console.error("Errore salvataggio film:", err);
      this.alertService.show({
        title: "Errore",
        message: err.error?.message || "Si è verificato un errore durante il salvataggio del film.",
        status: StatusType.Bad,
      });
    } finally {
      this.isSubmitting.set(false);
      this.uploadProgress.set(null);
    }
  }

  public resetMovieForm(): void {
    this.movieTitle.set("");
    this.movieDesc.set("");
    this.movieDuration.set(null);
    this.movieCoverMode.set("upload");
    this.movieCoverFile = null;
    this.movieCoverPreview.set(null);
    this.movieCoverUrl.set("");
    this.movieVideoMode.set("upload");
    this.movieVideoFile = null;
    this.movieVideoFileName.set("");
    this.movieVideoPath.set("");
    this.movieSelectedTagIds.set([]);
    this.movieNewTagsList.set([]);
  }

  public deleteMovie(movie: AdminMovieItem): void {
    if (confirm(`Sei sicuro di voler eliminare il film "${movie.title}"?`)) {
      this.adminService.deleteMovie(movie.id).subscribe({
        next: () => {
          this.alertService.show({
            title: "Film eliminato",
            message: `"${movie.title}" è stato rimosso dal catalogo.`,
            status: StatusType.Good,
          });
        },
        error: (err) => {
          this.alertService.show({
            title: "Errore",
            message: err.error?.message || "Impossibile eliminare il film.",
            status: StatusType.Bad,
          });
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // SUBMIT SERIE TV
  // ---------------------------------------------------------------------------
  public async submitSeries(): Promise<void> {
    if (!this.seriesTitle().trim()) {
      this.alertService.show({
        title: "Titolo mancante",
        message: "Il titolo della serie è obbligatorio.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      let coverImageId: string | undefined = undefined;
      let coverUrl: string | undefined = undefined;

      if (this.seriesCoverMode() === "upload" && this.seriesCoverFile) {
        const coverRes = await firstValueFrom(this.adminService.uploadCover(this.seriesCoverFile));
        coverImageId = coverRes.imageId;
      } else if (this.seriesCoverMode() === "url" && this.seriesCoverUrl().trim()) {
        coverUrl = this.seriesCoverUrl().trim();
      }

      const res = await firstValueFrom(
        this.adminService.createSeries({
          title: this.seriesTitle().trim(),
          description: this.seriesDesc().trim() || undefined,
          releaseYear: this.seriesYear() ?? undefined,
          rating: this.seriesRating() ?? undefined,
          coverImageId,
          coverUrl,
          tagIds: this.seriesSelectedTagIds(),
          newTags: this.seriesNewTagsList(),
        }),
      );

      this.alertService.show({
        title: "Serie Creata",
        message: `La serie "${this.seriesTitle()}" è stata creata con successo! Ora puoi aggiungere le stagioni.`,
        status: StatusType.Good,
      });

      const newSeriesId = res.seriesId;
      this.resetSeriesForm();
      this.adminService.loadSeriesTree().subscribe();
      this.adminService.loadTags().subscribe();

      // Porta subito l'admin alla scheda per creare una stagione di questa serie
      this.seasonSeriesId.set(newSeriesId);
      this.seriesSubTab.set("new-season");
    } catch (err: any) {
      this.alertService.show({
        title: "Errore",
        message: err.error?.message || "Errore nella creazione della serie.",
        status: StatusType.Bad,
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public resetSeriesForm(): void {
    this.seriesTitle.set("");
    this.seriesDesc.set("");
    this.seriesYear.set(new Date().getFullYear());
    this.seriesRating.set(8.0);
    this.seriesCoverMode.set("upload");
    this.seriesCoverFile = null;
    this.seriesCoverPreview.set(null);
    this.seriesCoverUrl.set("");
    this.seriesSelectedTagIds.set([]);
    this.seriesNewTagsList.set([]);
  }

  // ---------------------------------------------------------------------------
  // SUBMIT STAGIONE
  // ---------------------------------------------------------------------------
  public async submitSeason(): Promise<void> {
    if (!this.seasonSeriesId()) {
      this.alertService.show({
        title: "Serie mancante",
        message: "Seleziona la serie TV a cui associare la stagione.",
        status: StatusType.Bad,
      });
      return;
    }

    if (!this.seasonNumber() || this.seasonNumber() <= 0) {
      this.alertService.show({
        title: "Numero non valido",
        message: "Il numero della stagione deve essere maggiore di zero.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      const res = await firstValueFrom(
        this.adminService.createSeason({
          seriesId: this.seasonSeriesId(),
          seasonNumber: this.seasonNumber(),
          title: this.seasonTitle().trim() || `Stagione ${this.seasonNumber()}`,
          description: this.seasonDesc().trim() || undefined,
          releaseYear: this.seasonYear() ?? undefined,
        }),
      );

      this.alertService.show({
        title: "Stagione Aggiunta",
        message: `Stagione ${this.seasonNumber()} creata con successo! Ora puoi caricare gli episodi.`,
        status: StatusType.Good,
      });

      const seasonId = res.seasonId;
      const sId = this.seasonSeriesId();
      this.resetSeasonForm();
      this.adminService.loadSeriesTree().subscribe();

      // Porta subito al caricamento episodi per questa stagione
      this.epSeriesId.set(sId);
      this.epSeasonId.set(seasonId);
      this.seriesSubTab.set("new-episode");
    } catch (err: any) {
      this.alertService.show({
        title: "Errore",
        message: err.error?.message || "Errore nella creazione della stagione.",
        status: StatusType.Bad,
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public resetSeasonForm(): void {
    this.seasonNumber.set(1);
    this.seasonTitle.set("");
    this.seasonDesc.set("");
    this.seasonYear.set(new Date().getFullYear());
  }

  // ---------------------------------------------------------------------------
  // SUBMIT EPISODIO
  // ---------------------------------------------------------------------------
  public async submitEpisode(): Promise<void> {
    if (!this.epSeasonId()) {
      this.alertService.show({
        title: "Stagione non selezionata",
        message: "Seleziona serie e stagione per l'episodio.",
        status: StatusType.Bad,
      });
      return;
    }

    if (!this.epTitle().trim()) {
      this.alertService.show({
        title: "Titolo mancante",
        message: "Il titolo dell'episodio è obbligatorio.",
        status: StatusType.Bad,
      });
      return;
    }

    if (this.epVideoMode() === "upload" && !this.epVideoFile) {
      this.alertService.show({
        title: "Video mancante",
        message: "Seleziona il file video dell'episodio.",
        status: StatusType.Bad,
      });
      return;
    }

    if (this.epVideoMode() === "path" && !this.epVideoPath().trim()) {
      this.alertService.show({
        title: "Percorso mancante",
        message: "Inserisci il percorso del video sul server o disco.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isSubmitting.set(true);
    this.uploadProgress.set(null);

    try {
      let coverImageId: string | undefined = undefined;
      let coverUrl: string | undefined = undefined;

      if (this.epCoverMode() === "upload" && this.epCoverFile) {
        const coverRes = await firstValueFrom(this.adminService.uploadCover(this.epCoverFile));
        coverImageId = coverRes.imageId;
      } else if (this.epCoverMode() === "url" && this.epCoverUrl().trim()) {
        coverUrl = this.epCoverUrl().trim();
      }

      let videoPath = "";
      let detectedDuration = this.epDuration();
      if (this.epVideoMode() === "upload" && this.epVideoFile) {
        const upRes = await this.uploadVideoWithProgress(this.epVideoFile);
        videoPath = upRes.path;
        detectedDuration ??= upRes.durationMinutes ?? null;
      } else {
        videoPath = this.epVideoPath().trim();
      }

      await firstValueFrom(
        this.adminService.createEpisode({
          seasonId: this.epSeasonId(),
          episodeNumber: this.epNumber(),
          title: this.epTitle().trim(),
          description: this.epDesc().trim() || undefined,
          duration: detectedDuration ?? undefined,
          videoPath,
          coverImageId,
          coverUrl,
        }),
      );

      this.alertService.show({
        title: "Episodio Pubblicato",
        message: `Episodio ${this.epNumber()} "${this.epTitle()}" pubblicato con successo!`,
        status: StatusType.Good,
      });

      this.resetEpisodeForm();
      this.adminService.loadSeriesTree().subscribe();
      this.seriesSubTab.set("tree");
    } catch (err: any) {
      this.alertService.show({
        title: "Errore",
        message: err.error?.message || "Errore durante il caricamento dell'episodio.",
        status: StatusType.Bad,
      });
    } finally {
      this.isSubmitting.set(false);
      this.uploadProgress.set(null);
    }
  }

  public resetEpisodeForm(): void {
    this.epNumber.update((n) => n + 1);
    this.epTitle.set("");
    this.epDesc.set("");
    this.epDuration.set(null);
    this.epCoverMode.set("upload");
    this.epCoverFile = null;
    this.epCoverPreview.set(null);
    this.epCoverUrl.set("");
    this.epVideoMode.set("upload");
    this.epVideoFile = null;
    this.epVideoFileName.set("");
    this.epVideoPath.set("");
  }

  // Scorciatoia rapida dalla Tree View per aggiungere una stagione
  public quickAddSeasonToSeries(seriesId: string): void {
    this.seasonSeriesId.set(seriesId);
    const series = this.adminService.seriesTree().find((s) => s.id === seriesId);
    const nextSeasonNum = (series?.seasons.length ?? 0) + 1;
    this.seasonNumber.set(nextSeasonNum);
    this.seasonTitle.set(`Stagione ${nextSeasonNum}`);
    this.seriesSubTab.set("new-season");
  }

  // Scorciatoia rapida dalla Tree View per aggiungere un episodio
  public quickAddEpisodeToSeason(seriesId: string, seasonId: string, season: SeriesSeasonNode): void {
    this.epSeriesId.set(seriesId);
    this.epSeasonId.set(seasonId);
    this.epNumber.set((season.episodes.length ?? 0) + 1);
    this.seriesSubTab.set("new-episode");
  }

  public deleteSeries(series: SeriesTreeNode): void {
    if (confirm(`Sei sicuro di voler eliminare la serie "${series.title}" e tutte le sue stagioni?`)) {
      this.adminService.deleteSeries(series.id).subscribe({
        next: () => {
          this.alertService.show({
            title: "Serie Eliminata",
            message: `"${series.title}" è stata rimossa.`,
            status: StatusType.Good,
          });
        },
      });
    }
  }

  public deleteEpisode(ep: SeriesEpisodeNode): void {
    if (confirm(`Sei sicuro di voler eliminare l'episodio "${ep.title}"?`)) {
      this.adminService.deleteEpisode(ep.id).subscribe({
        next: () => {
          this.alertService.show({
            title: "Episodio Eliminato",
            message: `"${ep.title}" è stato rimosso.`,
            status: StatusType.Good,
          });
        },
      });
    }
  }

  public getMediaUrl(path: string | null | undefined): string {
    if (!path) return "/hero-banner-fallback.jpg";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${path}`;
    }
    return path;
  }

  // ---------------------------------------------------------------------------
  // EDIT MODAL HANDLERS (Film, Serie, Stagione, Episodio)
  // ---------------------------------------------------------------------------
  private resetEditCommon(): void {
    this.editCoverMode.set("keep");
    this.editCoverFile = null;
    this.editCoverPreview.set(null);
    this.editCoverUrl.set("");
    this.editVideoMode.set("keep");
    this.editVideoFile = null;
    this.editVideoFileName.set("");
    this.editVideoPath.set("");
    this.editSelectedTagIds.set([]);
    this.editNewTagInput.set("");
    this.editNewTagsList.set([]);
  }

  public openEditMovie(movie: AdminMovieItem): void {
    this.resetEditCommon();
    this.editingMode.set("movie");
    this.editingId.set(movie.id);
    this.editTitle.set(movie.title);
    this.editDesc.set(movie.description ?? "");
    this.editDuration.set(movie.duration ?? null);
    this.editVideoPath.set(movie.path ?? "");
    this.editSelectedTagIds.set([...(movie.tagIds ?? [])]);
  }

  public openEditSeries(series: SeriesTreeNode): void {
    this.resetEditCommon();
    this.editingMode.set("series");
    this.editingId.set(series.id);
    this.editTitle.set(series.title);
    this.editDesc.set(series.description ?? "");
    this.editYear.set(series.releaseYear ?? null);
    this.editRating.set(series.rating ?? null);
    this.editSelectedTagIds.set([...(series.tagIds ?? [])]);
  }

  public openEditSeason(season: SeriesSeasonNode): void {
    this.resetEditCommon();
    this.editingMode.set("season");
    this.editingId.set(season.id);
    this.editNumber.set(season.seasonNumber);
    this.editTitle.set(season.title ?? `Stagione ${season.seasonNumber}`);
    this.editDesc.set(season.description ?? "");
    this.editYear.set(season.releaseYear ?? null);
  }

  public openEditEpisode(ep: SeriesEpisodeNode, series?: SeriesTreeNode, seasonId?: string): void {
    this.resetEditCommon();
    this.editingMode.set("episode");
    this.editingId.set(ep.id);
    this.editNumber.set(ep.episodeNumber);
    this.editTitle.set(ep.title);
    this.editDesc.set(ep.description ?? "");
    this.editDuration.set(ep.duration ?? null);
    this.editVideoPath.set(ep.path ?? "");
    this.editAvailableSeasons.set(series?.seasons ?? []);
    this.editSeasonId.set(seasonId ?? "");
  }

  public openEditTag(tag: TagItem): void {
    this.resetEditCommon();
    this.editingMode.set("tag");
    this.editingId.set(tag.id);
    this.editTitle.set(tag.name);
  }

  public deleteTag(tag: TagItem): void {
    if (confirm(`Sei sicuro di voler eliminare il tag "${tag.name}"?`)) {
      this.adminService.deleteTag(tag.id).subscribe({
        next: () => {
          this.alertService.show({
            title: "Tag Eliminato",
            message: `Il tag "${tag.name}" è stato rimosso.`,
            status: StatusType.Good,
          });
          this.adminService.loadMoviesList().subscribe();
          this.adminService.loadSeriesTree().subscribe();
        },
        error: (err) => {
          this.alertService.show({
            title: "Errore",
            message: err.error?.message || "Impossibile eliminare il tag.",
            status: StatusType.Bad,
          });
        },
      });
    }
  }

  public closeEditModal(): void {
    this.editingMode.set(null);
    this.editingId.set("");
  }

  public toggleEditTag(tagId: string): void {
    this.editSelectedTagIds.update((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  public addEditCustomTag(): void {
    const name = this.editNewTagInput().trim();
    if (!name) return;
    if (!this.editNewTagsList().includes(name)) {
      this.editNewTagsList.update((list) => [...list, name]);
    }
    this.editNewTagInput.set("");
  }

  public removeEditCustomTag(name: string): void {
    this.editNewTagsList.update((list) => list.filter((t) => t !== name));
  }

  public onEditCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.editCoverFile = file;
      const reader = new FileReader();
      reader.onload = () => this.editCoverPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  public onEditVideoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.editVideoFile = file;
      this.editVideoFileName.set(file.name);
      this.extractVideoDurationMinutes(file).then((mins) => {
        if (mins !== null) this.editDuration.set(mins);
      });
    }
  }

  public async submitEdit(): Promise<void> {
    const mode = this.editingMode();
    const id = this.editingId();
    if (!mode || !id) return;

    if (mode !== "season" && !this.editTitle().trim()) {
      this.alertService.show({
        title: "Titolo mancante",
        message: "Il titolo è obbligatorio.",
        status: StatusType.Bad,
      });
      return;
    }

    this.isSubmitting.set(true);
    this.uploadProgress.set(null);

    try {
      let coverImageId: string | undefined;
      let coverUrl: string | undefined;

      if (this.editCoverMode() === "upload" && this.editCoverFile) {
        const coverRes = await firstValueFrom(this.adminService.uploadCover(this.editCoverFile));
        coverImageId = coverRes.imageId;
      } else if (this.editCoverMode() === "url" && this.editCoverUrl().trim()) {
        coverUrl = this.editCoverUrl().trim();
      }

      let videoPath: string | undefined;
      let detectedDuration = this.editDuration();
      if (this.editVideoMode() === "upload" && this.editVideoFile) {
        const upRes = await this.uploadVideoWithProgress(this.editVideoFile);
        videoPath = upRes.path;
        detectedDuration ??= upRes.durationMinutes ?? null;
      } else if (this.editVideoMode() === "path" && this.editVideoPath().trim()) {
        videoPath = this.editVideoPath().trim();
      }

      if (mode === "movie") {
        await firstValueFrom(
          this.adminService.updateMovie(id, {
            title: this.editTitle().trim(),
            description: this.editDesc().trim() || undefined,
            duration: detectedDuration ?? undefined,
            coverImageId,
            coverUrl,
            videoPath,
            tagIds: this.editSelectedTagIds(),
            newTags: this.editNewTagsList(),
          }),
        );
        this.adminService.loadMoviesList().subscribe();
        this.adminService.loadTags().subscribe();
      } else if (mode === "series") {
        await firstValueFrom(
          this.adminService.updateSeries(id, {
            title: this.editTitle().trim(),
            description: this.editDesc().trim() || undefined,
            releaseYear: this.editYear() ?? undefined,
            rating: this.editRating() ?? undefined,
            coverImageId,
            coverUrl,
            tagIds: this.editSelectedTagIds(),
            newTags: this.editNewTagsList(),
          }),
        );
        this.adminService.loadSeriesTree().subscribe();
        this.adminService.loadTags().subscribe();
      } else if (mode === "season") {
        await firstValueFrom(
          this.adminService.updateSeason(id, {
            seasonNumber: this.editNumber(),
            title: this.editTitle().trim() || `Stagione ${this.editNumber()}`,
            description: this.editDesc().trim() || undefined,
            releaseYear: this.editYear() ?? undefined,
          }),
        );
        this.adminService.loadSeriesTree().subscribe();
      } else if (mode === "episode") {
        await firstValueFrom(
          this.adminService.updateEpisode(id, {
            seasonId: this.editSeasonId() || undefined,
            episodeNumber: this.editNumber(),
            title: this.editTitle().trim(),
            description: this.editDesc().trim() || undefined,
            duration: detectedDuration ?? undefined,
            videoPath,
            coverImageId,
            coverUrl,
          }),
        );
        await firstValueFrom(this.adminService.loadSeriesTree());
      } else if (mode === "tag") {
        await firstValueFrom(this.adminService.updateTag(id, this.editTitle().trim()));
        this.adminService.loadMoviesList().subscribe();
        this.adminService.loadSeriesTree().subscribe();
      }

      this.alertService.show({
        title: "Modifiche Salvate",
        message: "Elemento aggiornato con successo!",
        status: StatusType.Good,
      });
      this.closeEditModal();
    } catch (err: any) {
      this.alertService.show({
        title: "Errore",
        message: err.error?.message || "Errore durante l'aggiornamento.",
        status: StatusType.Bad,
      });
    } finally {
      this.isSubmitting.set(false);
      this.uploadProgress.set(null);
    }
  }

  // ---------------------------------------------------------------------------
  // CATALOGO & TAG STANDALONE
  // ---------------------------------------------------------------------------
  public submitStandaloneTag(): void {
    const name = this.newStandaloneTagName().trim();
    if (!name) return;

    this.adminService.createTag(name).subscribe({
      next: () => {
        this.alertService.show({
          title: "Tag Creato",
          message: `Il tag "${name}" è stato aggiunto con successo.`,
          status: StatusType.Good,
        });
        this.newStandaloneTagName.set("");
      },
      error: (err) => {
        this.alertService.show({
          title: "Errore",
          message: err.error?.message || "Errore nella creazione del tag.",
          status: StatusType.Bad,
        });
      },
    });
  }
}
