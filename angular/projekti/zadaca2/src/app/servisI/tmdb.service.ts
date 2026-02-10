import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { FilmoviTmdbI, FilmTmdbI, ZanrTmdbI } from './tmdbI';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  private readonly api = inject(ApiService);

  getGenres(): Promise<ApiResponse<ZanrTmdbI[]>> {
    return this.api.request<ZanrTmdbI[]>('GET', '/gost/tmdb/zanr');
  }

  getFilm(id: string | number): Promise<ApiResponse<FilmTmdbI>> {
    return this.api.request<FilmTmdbI>(
      'GET',
      `/tmdb/film/${encodeURIComponent(String(id))}`
    );
  }

  getRandom(params: { stranica?: number; trazi?: string }): Promise<ApiResponse<FilmoviTmdbI>> {
    return this.api.request<FilmoviTmdbI>('GET', '/tmdb/nasumceFilm', {
      params,
    });
  }

  getBestAnimated(): Promise<ApiResponse<{ results: FilmTmdbI[] }>> {
    return this.api.request<{ results: FilmTmdbI[] }>(
      'GET',
      '/tmdb/animirani/najboljeOcijenjeni'
    );
  }
}
