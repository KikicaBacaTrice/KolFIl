import { Injectable, InjectionToken } from '@angular/core';

export interface KonfiguracijaI {
  restServis: string;
  posteriPutanja: string;
}

export const APP_CONF = new InjectionToken<KonfiguracijaI>('APP_CONF');

@Injectable({
  providedIn: 'root',
})
export class KonfiguratorService {
  private config?: KonfiguracijaI;

  async load(): Promise<void> {
    const res = await fetch('/config.json');
    this.config = (await res.json()) as KonfiguracijaI;
  }

  get value(): KonfiguracijaI {
    if (!this.config) throw new Error('Konfiguracija nije ucitana!');
    return this.config;
  }
}
