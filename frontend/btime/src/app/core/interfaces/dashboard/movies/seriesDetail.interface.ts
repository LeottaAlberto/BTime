export interface EpisodeDetail {
  id: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  path: string;
  icon?: string;
}

export interface SeasonDetail {
  id: string;
  seasonNumber: number;
  title?: string;
  episodesCount: number;
  episodes: EpisodeDetail[];
}

export interface SeriesDetail {
  id: string;
  title: string;
  icon: string;
  description?: string;
  seasonsCount: number;
  releaseYear?: number;
  rating?: number;
  tags: string[];
  seasons: SeasonDetail[];
}

