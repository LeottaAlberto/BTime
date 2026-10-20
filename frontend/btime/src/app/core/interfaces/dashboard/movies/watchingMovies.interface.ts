export interface WatchingMovies {

  id: string;
  title: string;
  icon: string;
  minuteLeft: number;
  totMinute: number;

  /** Percentuale di avanzamento da 0 a 100 (per la barra di progresso viola) */
  progress: number;

  /** Secondo esatto in cui è stata interrotta la riproduzione */
  stoppedAtSeconds?: number;
  lastWatchedAt?: string;
  season?: number;
  episode?: number;
  epName?: string;
  mediaType?: 'movie' | 'episode' | 'series';
}

