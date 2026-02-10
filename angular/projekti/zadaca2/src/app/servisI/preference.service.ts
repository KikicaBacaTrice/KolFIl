import { Injectable, inject } from '@angular/core';
import { ApiService, ApiResponse } from './api.service';
import { PreferenceI } from './korisniciI';

@Injectable({
  providedIn: 'root',
})
export class PreferenceService {
  private readonly api = inject(ApiService);

  getPreference(): Promise<ApiResponse<PreferenceI[]>> {
    return this.api.request<PreferenceI[]>('GET', '/gost/preference');
  }
}
