import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONF } from './konfigurator.service';

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly conf = inject(APP_CONF);

  async request<T>(
    method: string,
    path: string,
    options?: {
      body?: any;
      params?: Record<string, any>;
      responseType?: 'json' | 'text';
    }
  ): Promise<ApiResponse<T>> {
    const url = `${this.conf.restServis}${path}`;
    const params = this.buildParams(options?.params);
    const responseType = options?.responseType ?? 'json';

    try {
      const response = await firstValueFrom(
        this.http.request<T>(method, url, {
          body: options?.body,
          params,
          observe: 'response',
          withCredentials: true,
          responseType: responseType as any,
        })
      );
      return {
        ok: true,
        status: response.status,
        data: (response.body ?? null) as T | null,
        error: null,
      };
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        const errorBody = err.error ?? null;
        return {
          ok: false,
          status: err.status ?? 0,
          data: errorBody as any,
          error: this.extractErrorMessage(errorBody),
        };
      }
      return { ok: false, status: 0, data: null, error: null };
    }
  }

  private buildParams(params?: Record<string, any>): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }

  private extractErrorMessage(body: any): string | null {
    if (typeof body === 'string') {
      return body;
    }
    if (body && typeof body === 'object') {
      return body.greska || body.poruka || body.error || null;
    }
    return null;
  }
}
