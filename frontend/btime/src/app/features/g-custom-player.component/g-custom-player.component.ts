import { Component, computed, ElementRef, input, output, signal, ViewChild, WritableSignal } from "@angular/core";
import { EpisodeDetail } from "../../core/interfaces/dashboard/movies/seriesDetail.interface";

@Component({
  imports: [],
  selector: "g-custom-player",
  styleUrl: "./g-custom-player.component.css",
  templateUrl: "./g-custom-player.component.html",
})
export class GCustomPlayerComponent {
  @ViewChild("videoPlayer") videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild("playerContainer") playerContainer!: ElementRef<HTMLElement>;

  private readonly skipSeconds = 15;

  public episode = input<EpisodeDetail | null>(null);
  public isPlaying: WritableSignal<boolean> = signal(false);
  public isMuted: WritableSignal<boolean> = signal(false);
  public showControls: WritableSignal<boolean> = signal(false);
  public volume: WritableSignal<number> = signal(0.5);
  public currentTime = signal<number>(0);
  public duration = signal<number>(0);
  public isDragging = signal<boolean>(false);

  private hideTimer: any;

  onBackClick = output<void>();

  formattedTime = computed(() => {
    const current = this.formatSeconds(this.currentTime());
    const total = this.formatSeconds(this.duration());
    return `${current} / ${total}`;
  });

  slidePoint = computed(() => {
    return this.progressPercent();
  });

  public togglePlay() {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    if (video.paused) video.play();
    else video.pause();
  }

  public toggleMute() {
    this.isMuted.set(!this.isMuted());
  }

  public onVideoPlay() {
    this.isPlaying.set(true);
    this.showControls.set(false);
  }

  public onVideoPause() {
    this.isPlaying.set(false);
    this.showControls.set(true);
  }

  // Metodo chiamato dall'evento (loadedmetadata)
  public onLoadedMetadata() {
    if (this.videoRef?.nativeElement) {
      // Quando i metadati public sono caricati, la durata effettiva del file è disponibile
      this.duration.set(this.videoRef.nativeElement.duration);
    }
  }

  // Metodo chiamato dall'evento (timeupdate)
  public onTimeUpdate() {
    if (this.videoRef?.nativeElement) {
      this.currentTime.set(this.videoRef.nativeElement.currentTime);
    }
  }

  public onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.volume.set(parseFloat(target.value));

    if (this.volume() === 0) {
      this.isMuted.set(true);
    } else {
      this.isMuted.set(false);
    }
  }

  public onUserActivity() {
    this.showControls.set(true);

    clearTimeout(this.hideTimer);

    this.hideTimer = setTimeout(() => {
      this.showControls.set(false);
    }, 2000);
  }

  public toggleFullscreen() {
    const elem = this.playerContainer.nativeElement as any;

    // Enter Fullscreen
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen)
        /* Safari / Smart TV vecchie */
        elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) /* Edge/IE */ elem.msRequestFullscreen();
    }
    // Exit Fullscreen
    else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  }

  public onSkip(isForward: boolean) {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    const newTime = isForward
      ? video.currentTime + this.skipSeconds
      : video.currentTime - this.skipSeconds;

    video.currentTime = Math.max(0, Math.min(newTime, video.duration));
  }

  public seekTo(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const video = this.videoRef.nativeElement;
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
}
