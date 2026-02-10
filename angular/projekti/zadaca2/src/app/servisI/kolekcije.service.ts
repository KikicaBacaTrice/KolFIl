import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { KolekcijaDetaljiI, KolekcijaI } from './kolekcijeI';

@Injectable({
  providedIn: 'root',
})
export class KolekcijeService {
  private readonly api = inject(ApiService);

  getJavne(): Promise<ApiResponse<KolekcijaI[]>> {
    return this.api.request<KolekcijaI[]>('GET', '/gost/javneKolekcije');
  }

  getSve(): Promise<ApiResponse<KolekcijaI[]>> {
    return this.api.request<KolekcijaI[]>('GET', '/kolekcije');
  }

  getKolekcija(id: string | number): Promise<ApiResponse<KolekcijaDetaljiI>> {
    return this.api.request<KolekcijaDetaljiI>(
      'GET',
      `/kolekcije/${encodeURIComponent(String(id))}`
    );
  }

  createKolekcija(tijelo: {
    naziv: string;
    opis?: string | null;
    slikaKolekcije?: string;
    kolekcijaJavna?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.api.request<any>('POST', '/kolekcije', { body: tijelo });
  }

  updateKolekcija(
    id: number,
    tijelo: { naziv?: string; opis?: string | null; slikaKolekcije?: string; kolekcijaJavna?: boolean }
  ): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'PUT',
      `/kolekcije/${encodeURIComponent(String(id))}`,
      { body: tijelo }
    );
  }

  deleteKolekcija(id: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'DELETE',
      `/kolekcije/${encodeURIComponent(String(id))}`
    );
  }

  addFilm(id: number, filmId: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'POST',
      `/kolekcije/${encodeURIComponent(String(id))}/filmovi`,
      { body: { filmId } }
    );
  }

  removeFilm(id: number, filmId: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'DELETE',
      `/kolekcije/${encodeURIComponent(
        String(id)
      )}/filmovi/${encodeURIComponent(String(filmId))}`
    );
  }

  addUser(id: number, korisnikId: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'POST',
      `/kolekcije/${encodeURIComponent(String(id))}/korisnici`,
      { body: { korisnikId } }
    );
  }

  removeUser(id: number, korisnikId: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'DELETE',
      `/kolekcije/${encodeURIComponent(String(id))}/${encodeURIComponent(
        String(korisnikId)
      )}`
    );
  }
}
