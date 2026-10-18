export interface GlobalErrorOption {
  title: string;
  message: string;
  statusCode?: number | null;
  statusText?: string;
  url?: string;
  method?: string;
  details?: string[];
  timestamp?: string;
}
