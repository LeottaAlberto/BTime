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
  tags: string[];
}

export interface SeriesEpisodeNode {
  id: string;
  episodeNumber: number;
  title: string;
  duration?: number;
  path: string;
}

export interface SeriesSeasonNode {
  id: string;
  seasonNumber: number;
  title?: string;
  episodesCount: number;
  episodes: SeriesEpisodeNode[];
}

export interface SeriesTreeNode {
  id: string;
  title: string;
  icon: string;
  releaseYear?: number;
  rating?: number;
  seasons: SeriesSeasonNode[];
}

