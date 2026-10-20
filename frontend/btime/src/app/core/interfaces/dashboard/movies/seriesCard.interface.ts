export interface SeriesCard {
  id: string;
  title: string;
  icon: string;
  description?: string;
  seasonsCount: number;
  releaseYear?: number;
  rating?: number;
  tags?: string[];
}

