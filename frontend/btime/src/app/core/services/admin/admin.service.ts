import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { environment } from "../../../../environments/environment.development";
import {
  AdminMovieItem,
  CreateEpisodePayload,
  CreateMoviePayload,
  CreateSeasonPayload,
  CreateSeriesPayload,
  SeriesTreeNode,
  TagItem,
  UploadCoverRes,
  UploadVideoRes,
} from "../../interfaces/admin/admin.interface";

@Injectable({ providedIn: "root" })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/movies`;

  public tags: WritableSignal<TagItem[]> = signal([]);
  public movies: WritableSignal<AdminMovieItem[]> = signal([]);
  public seriesTree: WritableSignal<SeriesTreeNode[]> = signal([]);

  public loadTags(): Observable<TagItem[]> {
    return this.http.get<TagItem[]>(`${this.baseUrl}/tags`).pipe(
      tap((data) => this.tags.set(data ?? [])),
    );
  }

  public createTag(name: string): Observable<{ message: string; id: string; name: string }> {
    return this.http.post<{ message: string; id: string; name: string }>(`${this.baseUrl}/create-tag`, { name }).pipe(
      tap((res) => {
        if (!this.tags().some((t) => t.id === res.id)) {
          this.tags.update((list) => [...list, { id: res.id, name: res.name }]);
        }
      }),
    );
  }

  public uploadCover(file: File): Observable<UploadCoverRes> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return this.http.post<UploadCoverRes>(`${this.baseUrl}/upload-cover`, formData);
  }

  public uploadVideo(file: File): Observable<HttpEvent<UploadVideoRes>> {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const req = new HttpRequest("POST", `${this.baseUrl}/upload-video`, formData, {
      reportProgress: true,
    });

    return this.http.request<UploadVideoRes>(req);
  }

  public createMovie(payload: CreateMoviePayload): Observable<{ message: string; movieId: string }> {
    return this.http.post<{ message: string; movieId: string }>(`${this.baseUrl}/create-movie`, payload);
  }

  public loadMoviesList(): Observable<AdminMovieItem[]> {
    return this.http.get<AdminMovieItem[]>(`${this.baseUrl}/list`).pipe(
      tap((data) => this.movies.set(data ?? [])),
    );
  }

  public deleteMovie(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/movie/${id}`).pipe(
      tap(() => this.movies.update((list) => list.filter((m) => m.id !== id))),
    );
  }

  public createSeries(payload: CreateSeriesPayload): Observable<{ message: string; seriesId: string }> {
    return this.http.post<{ message: string; seriesId: string }>(`${this.baseUrl}/create-series`, payload);
  }

  public createSeason(payload: CreateSeasonPayload): Observable<{ message: string; seasonId: string }> {
    return this.http.post<{ message: string; seasonId: string }>(`${this.baseUrl}/create-season`, payload);
  }

  public createEpisode(payload: CreateEpisodePayload): Observable<{ message: string; episodeId: string }> {
    return this.http.post<{ message: string; episodeId: string }>(`${this.baseUrl}/create-episode`, payload);
  }

  public loadSeriesTree(): Observable<SeriesTreeNode[]> {
    return this.http.get<SeriesTreeNode[]>(`${this.baseUrl}/series-tree`).pipe(
      tap((data) => this.seriesTree.set(data ?? [])),
    );
  }

  public deleteSeries(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/series/${id}`).pipe(
      tap(() => this.seriesTree.update((list) => list.filter((s) => s.id !== id))),
    );
  }

  public deleteEpisode(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/episode/${id}`).pipe(
      tap(() => {
        this.seriesTree.update((tree) =>
          tree.map((series) => ({
            ...series,
            seasons: series.seasons.map((season) => ({
              ...season,
              episodes: season.episodes.filter((e) => e.id !== id),
              episodesCount: season.episodes.filter((e) => e.id !== id).length,
            })),
          })),
        );
      }),
    );
  }
}

