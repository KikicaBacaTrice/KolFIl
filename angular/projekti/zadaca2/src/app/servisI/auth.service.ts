import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';

export type SesijaI = {
  korime?: string | null;
  tipKorisnikaId?: number | null;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);

  async getSession(): Promise<SesijaI | null> {
    const odgovor = await this.api.request<SesijaI>('GET', '/sesija');
    return odgovor.ok ? odgovor.data : null;
  }

  async login(korime: string, lozinka: string): Promise<ApiResponse<any>> {
    return this.api.request<any>(
      'POST',
      `/gost/korisnici/${encodeURIComponent(korime)}/prijava`,
      { body: { lozinka } }
    );
  }

  async logout(): Promise<boolean> {
    const odgovor = await this.api.request<any>('POST', '/odjava');
    return odgovor.ok;
  }
}
