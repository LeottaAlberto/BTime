import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { HeroBannerRes } from "../../interfaces/dashboard/movies/heroBanner.interface";
import { environment } from "../../../../environments/environment";
import { WatchingMovies } from "../../interfaces/dashboard/movies/watchingMovies.interface";
import { MovieCard } from "../../interfaces/dashboard/movies/movieCard.interface";
import { SeriesCard } from "../../interfaces/dashboard/movies/seriesCard.interface";

@Injectable({ providedIn: "root" })
export class MovieService {
  private http = inject(HttpClient);
  public movieBanner: WritableSignal<HeroBannerRes | null> = signal(null);
  public watMovs: WritableSignal<WatchingMovies[] | null> = signal([]);
  public films: WritableSignal<MovieCard[] | null> = signal([]);
  public series: WritableSignal<SeriesCard[] | null> = signal([]);

  public loadMovieBanner(): Observable<HeroBannerRes> {
    return this.http.get<HeroBannerRes>(`${environment.apiUrl}/dashboard/movies/hero-banner`).pipe(
      tap({
        next: (res) => {
          this.movieBanner.set(res);
          console.log(this.movieBanner()?.icon);
        },
        error: () => {
          this.movieBanner.set(null);
        },
      }),
    );
  }

  public getContinueWatchingMovies(): Observable<WatchingMovies[]> {
    return this.http.get<WatchingMovies[]>(`${environment.apiUrl}/dashboard/movies/watching-movies`).pipe(
      tap({
        next: (res) => {
          this.watMovs.set(res);
        },
        error: () => {
          this.watMovs.set([]);
        },
      }),
    );
  }

  public getFilms(): Observable<MovieCard[]> {
    return this.http.get<MovieCard[]>(`${environment.apiUrl}/dashboard/movies/films`).pipe(
      tap({
        next: (res) => {
          this.films.set(res);
        },
        error: () => {
          this.films.set([]);
        },
      }),
    );
  }

  public getTvSeries(): Observable<SeriesCard[]> {
    return this.http.get<SeriesCard[]>(`${environment.apiUrl}/dashboard/movies/series`).pipe(
      tap({
        next: (res) => {
          this.series.set(res);
        },
        error: () => {
          this.series.set([]);
        },
      }),
    );
  }
}
