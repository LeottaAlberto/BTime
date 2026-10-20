export interface MovieCard {
  id: string;
  title: string;
  icon: string;
  description?: string;
  duration?: number;
  releaseYear?: number;
  viewCount?: number;
  tags?: string[];
}

