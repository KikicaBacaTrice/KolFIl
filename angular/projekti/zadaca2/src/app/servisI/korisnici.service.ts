import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { KorisnikI } from './korisniciI';

@Injectable({
  providedIn: 'root',
})
export class KorisniciService {
  private readonly api = inject(ApiService);

  getKorisnici(): Promise<ApiResponse<KorisnikI[]>> {
    return this.api.request<KorisnikI[]>('GET', '/korisnici');
  }

  getKorisnik(korime: string): Promise<ApiResponse<KorisnikI>> {
    return this.api.request<KorisnikI>(
      'GET',
      `/korisnici/${encodeURIComponent(korime)}`
    );
  }

  registrirajKorisnika(tijelo: any): Promise<ApiResponse<any>> {
    return this.api.request<any>('POST', '/gost/korisnici', { body: tijelo });
  }

  obrisiKorisnika(korime: string): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'DELETE',
      `/korisnici/${encodeURIComponent(korime)}`
    );
  }

  postaviTip(korime: string, tipKorisnikaId: number): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'PUT',
      `/korisnici/${encodeURIComponent(korime)}/tip`,
      { body: { tipKorisnikaId } }
    );
  }

  postaviBlokadu(
    korime: string,
    racunBlokiran: boolean
  ): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'PUT',
      `/korisnici/${encodeURIComponent(korime)}/blokada`,
      { body: { racunBlokiran } }
    );
  }
}
