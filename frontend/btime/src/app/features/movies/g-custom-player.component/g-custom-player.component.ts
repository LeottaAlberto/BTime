import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
  WritableSignal,
} from "@angular/core";
import { EpisodeDetail } from "../../../core/interfaces/dashboard/movies/seriesDetail.interface";
import { SaveProgressReq } from "../../../core/interfaces/dashboard/movies/saveProgressReq.interface";
import { MediaType } from "../../../core/enums/mediaType.enum";
import { MovieService } from "../../../core/services/dashboard/movies.service";

@Component({
  imports: [],
  selector: "g-custom-player",
  styleUrl: "./g-custom-player.component.css",
  templateUrl: "./g-custom-player.component.html",
})
export class GCustomPlayerComponent implements OnInit, OnDestroy {
  public videoRef = viewChild<ElementRef<HTMLVideoElement>>("videoPlayer");
  public playerContainer = viewChild<ElementRef<HTMLElement>>("playerContainer");
  public playBtn = viewChild<ElementRef<HTMLButtonElement>>("playBtn");
  public backBtn = viewChild<ElementRef<HTMLButtonElement>>("backBtn");

  private readonly skipSeconds = 15;
  private movS = inject(MovieService);

  public episode = input<EpisodeDetail | null>(null);
  public initialTime = input<number>(0);
  public isPlaying: WritableSignal<boolean> = signal(false);
  public isMuted: WritableSignal<boolean> = signal(false);
  public showControls: WritableSignal<boolean> = signal(false);
  public isFullscreen: WritableSignal<boolean> = signal(false);
  public volume: WritableSignal<number> = signal(1.0);
  public currentTime = signal<number>(0);
  public duration = signal<number>(0);
  public isDragging = signal<boolean>(false);

  private hideTimer: any;
  private saveTimer: any;

  constructor() {
    effect(() => {
      const init = this.initialTime();
      const video = this.videoRef()?.nativeElement;
      if (video && init > 0 && video.readyState >= 1) {
        if (Math.abs(video.currentTime - init) > 2) {
          video.currentTime = init;
          this.currentTime.set(init);
        }
      }
    });
  }

  public ngOnInit(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    this.saveTimer = setInterval(() => {
      if (this.isPlaying()) {
        this.saveProgress();
      }
    }, 10000);
  }

  public ngOnDestroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    clearTimeout(this.hideTimer);
    this.saveProgress();
  }

  public onBackClick = output<void>();

  public formattedTime = computed(() => {
    const current = this.formatSeconds(this.currentTime());
    const total = this.formatSeconds(this.duration());
    return `${current} / ${total}`;
  });

  public slidePoint = computed(() => {
    return this.progressPercent();
  });

  // ==========================================================
  // GESTIONE TELECOMANDO SMART TV (FIRE TV, ANDROID TV, TIZEN, WEBOS)
  // ==========================================================
  @HostListener("window:keydown", ["$event"])
  public onTvKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    const code = event.keyCode;

    const isSelect = key === "Enter" || key === "Select" || code === 13 || code === 23 || code === 66;
    const isPlayPause =
      key === "MediaPlayPause" ||
      key === "MediaPlay" ||
      key === "MediaPause" ||
      key === " " ||
      code === 179 ||
      code === 250 ||
      code === 19 ||
      code === 32;
    const isLeft = key === "ArrowLeft" || key === "Left" || code === 37 || code === 21;
    const isRight = key === "ArrowRight" || key === "Right" || code === 39 || code === 22;
    const isUp = key === "ArrowUp" || key === "Up" || code === 38 || code === 19;
    const isDown = key === "ArrowDown" || key === "Down" || code === 40 || code === 20;
    const isBack =
      key === "Escape" ||
      key === "GoBack" ||
      code === 27 ||
      code === 4 ||
      code === 10009 ||
      code === 461;
    const isFastForward = key === "MediaFastForward" || key === "MediaTrackNext" || code === 228;
    const isRewind = key === "MediaRewind" || key === "MediaTrackPrevious" || code === 227;

    // Se non è un tasto di navigazione o media, aggiorna solo l'attività utente
    if (
      !isSelect &&
      !isPlayPause &&
      !isLeft &&
      !isRight &&
      !isUp &&
      !isDown &&
      !isBack &&
      !isFastForward &&
      !isRewind
    ) {
      this.onUserActivity();
      return;
    }

    // 1. Tasto Back / Indietro del telecomando
    if (isBack) {
      event.preventDefault();
      event.stopPropagation();
      if (this.showControls()) {
        this.showControls.set(false);
      } else if (this.isFullscreen()) {
        this.toggleFullscreen();
      } else {
        this.onBackClick.emit();
      }
      return;
    }

    // 2. Tasto dedicato Play/Pausa
    if (isPlayPause) {
      event.preventDefault();
      event.stopPropagation();
      this.togglePlay();
      this.onUserActivity();
      return;
    }

    // 3. Tasti dedicati Rewind / FastForward
    if (isRewind) {
      event.preventDefault();
      event.stopPropagation();
      this.onSkip(false);
      return;
    }
    if (isFastForward) {
      event.preventDefault();
      event.stopPropagation();
      this.onSkip(true);
      return;
    }

    // 4. Se i controlli sono nascosti: risveglia l'interfaccia a schermo!
    if (!this.showControls()) {
      event.preventDefault();
      event.stopPropagation();
      this.onUserActivity();

      if (isLeft) {
        this.onSkip(false);
      } else if (isRight) {
        this.onSkip(true);
      } else if (isSelect) {
        this.togglePlay();
      }

      this.focusPlayButton();
      return;
    }

    // 5. Se i controlli sono già visibili:
    this.onUserActivity();

    // Navigazione rapida Up / Down tra barra superiore (Back) e inferiore (Play)
    if (isUp) {
      const active = document.activeElement as HTMLElement | null;
      if (active && active.closest(".pointer-events-auto") && active.tagName === "BUTTON") {
        // Se si trova già sui comandi inferiori, porta il focus sul tasto Back
        if (active !== this.backBtn()?.nativeElement) {
          event.preventDefault();
          this.backBtn()?.nativeElement?.focus();
          return;
        }
      }
    } else if (isDown) {
      const active = document.activeElement as HTMLElement | null;
      if (active === this.backBtn()?.nativeElement) {
        event.preventDefault();
        this.focusPlayButton();
        return;
      }
    }

    // Se preme Select / OK su un elemento non-pulsante, aziona il Play/Pausa
    if (isSelect) {
      const active = document.activeElement as HTMLElement | null;
      if (
        !active ||
        (active.tagName !== "BUTTON" &&
          active.tagName !== "INPUT" &&
          active.getAttribute("role") !== "button")
      ) {
        event.preventDefault();
        this.togglePlay();
      }
    }
  }

  @HostListener("document:fullscreenchange")
  @HostListener("document:webkitfullscreenchange")
  @HostListener("document:msfullscreenchange")
  public onFullscreenChange(): void {
    const isFs = Boolean(
      document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
    );
    this.isFullscreen.set(isFs);

    if (isFs) {
      // In fullscreen assicura che il focus rimanga catturato dall'interfaccia player
      setTimeout(() => {
        this.focusPlayButton();
      }, 100);
    }
  }

  public focusPlayButton(): void {
    setTimeout(() => {
      this.playBtn()?.nativeElement?.focus();
    }, 50);
  }

  public togglePlay(): void {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;

    if (video.paused) {
      video.play().catch((err) => console.warn("Errore video.play():", err));
    } else {
      video.pause();
    }
  }

  public toggleMute(): void {
    this.isMuted.set(!this.isMuted());
  }

  public onVideoPlay(): void {
    this.isPlaying.set(true);
    // Nascondi i comandi dopo un breve intervallo quando parte
    this.onUserActivity();
  }

  public onVideoPause(): void {
    this.isPlaying.set(false);
    this.showControls.set(true);
    clearTimeout(this.hideTimer);
    this.saveProgress();
    this.focusPlayButton();
  }

  public onLoadedMetadata(): void {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;

    this.duration.set(video.duration);

    if (this.initialTime() > 0 && this.initialTime() < video.duration) {
      video.currentTime = this.initialTime();
      this.currentTime.set(this.initialTime());
    }

    // Tenta l'avvio della riproduzione
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Autoplay bloccato dalla policy del browser:", err);
        // Se il browser blocca l'autoplay, mostra immediatamente i comandi con il tasto Play focalizzato
        this.showControls.set(true);
        this.focusPlayButton();
      });
    }
  }

  public onTimeUpdate(): void {
    const video = this.videoRef()?.nativeElement;
    if (video) {
      this.currentTime.set(video.currentTime);
    }
  }

  public onVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.volume.set(parseFloat(target.value));

    if (this.volume() === 0) {
      this.isMuted.set(true);
    } else {
      this.isMuted.set(false);
    }
  }

  public onVideoEnded(): void {
    this.isPlaying.set(false);
    this.currentTime.set(this.duration());
    this.showControls.set(true);
    this.saveProgress();
  }

  public onUserActivity(): void {
    this.showControls.set(true);
    clearTimeout(this.hideTimer);

    this.hideTimer = setTimeout(() => {
      // Non nascondere se l'utente sta trascinando la barra o il video è in pausa
      if (!this.isDragging() && this.isPlaying()) {
        this.showControls.set(false);
      }
    }, 4000);
  }

  public toggleFullscreen(): void {
    const elem = this.playerContainer()?.nativeElement as any;
    if (!elem) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

  public onSkip(isForward: boolean): void {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;

    const newTime = isForward
      ? video.currentTime + this.skipSeconds
      : video.currentTime - this.skipSeconds;

    video.currentTime = Math.max(0, Math.min(newTime, video.duration));
    this.onUserActivity();
  }

  public seekTo(event: MouseEvent): void {
    const video = this.videoRef()?.nativeElement;
    if (!video || !video.duration) return;

    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    this.currentTime.set(percentage * video.duration);
    video.currentTime = percentage * video.duration;
  }

  private formatSeconds(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mDisplay = m < 10 && h > 0 ? `0${m}` : m;
    const sDisplay = s < 10 ? `0${s}` : s;

    return h > 0 ? `${h}:${mDisplay}:${sDisplay}` : `${mDisplay}:${sDisplay}`;
  }

  private progressPercent(): number {
    return this.duration() > 0 ? (this.currentTime() / this.duration()) * 100 : 0;
  }

  private saveProgress(): void {
    if (!this.episode()?.id || this.duration() <= 0) return;

    const req: SaveProgressReq = {
      Id: this.episode()?.id ?? "",
      ProgressSecond: Math.floor(this.currentTime()),
      Duration: Math.floor(this.duration()),
      Type: MediaType.Episode,
    };

    this.movS.saveProgress(req).subscribe({
      error: (err) => console.error("Errore salvataggio progresso:", err),
    });
  }
}
