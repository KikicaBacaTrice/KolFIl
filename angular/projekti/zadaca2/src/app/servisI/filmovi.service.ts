import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { FilmDetaljiI, FilmUnosI, ZanrI } from './filmI';

@Injectable({
  providedIn: 'root',
})
export class FilmoviService {
  private readonly api = inject(ApiService);

  getJavniFilmovi(limit?: number): Promise<ApiResponse<FilmDetaljiI[]>> {
    return this.api.request<FilmDetaljiI[]>('GET', '/gost/javniFilmovi', {
      params: limit ? { limit } : undefined,
    });
  }

  getJavniFilmoviFilter(params: {
    trazi?: string;
    filtrirajPoOcjeniDolje?: number | string;
    filtrirajPoOcjeniGore?: number | string;
    sortirajPoDatumuPremijere?: 'asc' | 'desc';
    sortirajPoBrojuGlasova?: 'asc' | 'desc';
  }): Promise<ApiResponse<FilmDetaljiI[]>> {
    return this.api.request<FilmDetaljiI[]>('GET', '/javniFilmoviFilter', {
      params,
    });
  }

  getFilm(id: string | number): Promise<ApiResponse<FilmDetaljiI>> {
    return this.api.request<FilmDetaljiI>(
      'GET',
      `/filmovi/${encodeURIComponent(String(id))}`
    );
  }

  searchFilm(naziv: string, datumPremijere: string): Promise<ApiResponse<FilmDetaljiI>> {
    return this.api.request<FilmDetaljiI>('GET', '/filmovi/pretraga', {
      params: { naziv, datumPremijere },
    });
  }

  createFilm(tijelo: FilmUnosI): Promise<ApiResponse<any>> {
    return this.api.request<any>('POST', '/filmovi', { body: tijelo });
  }

  updateFilm(id: number, tijelo: Partial<FilmUnosI>): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'PUT',
      `/filmovi/${encodeURIComponent(String(id))}`,
      { body: tijelo }
    );
  }

  deleteFilm(id: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'DELETE',
      `/filmovi/${encodeURIComponent(String(id))}`
    );
  }

  addFilmToCollection(
    filmId: number,
    kolekcijaId: number
  ): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'POST',
      `/filmovi/${encodeURIComponent(String(filmId))}/kolekcije`,
      { body: { kolekcijaId } }
    );
  }

  removeFilmFromCollection(
    filmId: number,
    kolekcijaId: number
  ): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'DELETE',
      `/filmovi/${encodeURIComponent(
        String(filmId)
      )}/kolekcije/${encodeURIComponent(String(kolekcijaId))}`
    );
  }

  getZanrovi(): Promise<ApiResponse<ZanrI[]>> {
    return this.api.request<ZanrI[]>('GET', '/zanrovi');
  }
}
