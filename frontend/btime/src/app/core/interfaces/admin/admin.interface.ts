export interface TagItem {
  id: string;
  name: string;
}

export interface UploadCoverRes {
  imageId: string;
  url: string;
  fileName: string;
}

export interface UploadVideoRes {
  path: string;
  fullLocalPath: string;
  fileName: string;
  durationMinutes?: number | null;
}

export interface CreateMoviePayload {
  title: string;
  description?: string;
  duration?: number;
  coverImageId?: string;
  coverUrl?: string;
  videoPath: string;
  tagIds: string[];
  newTags: string[];
}

export interface CreateSeriesPayload {
  title: string;
  description?: string;
  releaseYear?: number;
  rating?: number;
  coverImageId?: string;
  coverUrl?: string;
  tagIds: string[];
  newTags: string[];
}

export interface CreateSeasonPayload {
  seriesId: string;
  seasonNumber: number;
  title?: string;
  description?: string;
  releaseYear?: number;
}

export interface CreateEpisodePayload {
  seasonId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  videoPath: string;
  coverImageId?: string;
  coverUrl?: string;
}

export interface AdminMovieItem {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  path: string;
  cover: string;
  createdAt: string;
  tagIds?: string[];
  tags: string[];
}

export interface SeriesEpisodeNode {
  id: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  path: string;
  icon?: string;
}

export interface SeriesSeasonNode {
  id: string;
  seasonNumber: number;
  title?: string;
  description?: string;
  releaseYear?: number;
  episodesCount: number;
  episodes: SeriesEpisodeNode[];
}

export interface SeriesTreeNode {
  id: string;
  title: string;
  description?: string;
  icon: string;
  releaseYear?: number;
  rating?: number;
  tagIds?: string[];
  tags?: string[];
  seasons: SeriesSeasonNode[];
}

export interface UpdateMoviePayload {
  title: string;
  description?: string;
  duration?: number;
  coverImageId?: string;
  coverUrl?: string;
  videoPath?: string;
  tagIds?: string[];
  newTags?: string[];
}

export interface UpdateSeriesPayload {
  title: string;
  description?: string;
  releaseYear?: number;
  rating?: number;
  coverImageId?: string;
  coverUrl?: string;
  tagIds?: string[];
  newTags?: string[];
}

export interface UpdateSeasonPayload {
  seasonNumber: number;
  title?: string;
  description?: string;
  releaseYear?: number;
}

export interface UpdateEpisodePayload {
  seasonId?: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  videoPath?: string;
  coverImageId?: string;
  coverUrl?: string;
}

