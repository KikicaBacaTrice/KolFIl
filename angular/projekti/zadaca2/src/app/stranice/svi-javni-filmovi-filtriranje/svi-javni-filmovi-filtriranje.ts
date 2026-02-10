import { Component, inject, signal } from '@angular/core';
import { FilmDetaljiI } from '../../servisI/filmI';
import { KarticaFilm } from '../../zajednicko/kartica-film/kartica-film';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilmoviService } from '../../servisI/filmovi.service';

@Component({
  selector: 'app-svi-javni-filmovi-filtriranje',
  imports: [KarticaFilm, NgIf, NgFor, CommonModule, FormsModule],
  templateUrl: './svi-javni-filmovi-filtriranje.html',
  styleUrl: './svi-javni-filmovi-filtriranje.scss',
})
export class SviJavniFilmoviFiltriranje {
  private readonly filmoviService = inject(FilmoviService);
  protected readonly filmovi = signal<FilmDetaljiI[]>([]);
  protected readonly greska = signal<string | null>(null);
  protected readonly ucitavanje = signal(false);
  protected ocjenaDolje = '';
  protected ocjenaGore = '';
  protected sortirajPoDatumuPremijere = '';
  protected sortirajPoBrojuGlasova = '';
  protected primijenjenaOcjenaDolje = '';
  protected primijenjenaOcjenaGore = '';
  protected primijenjenDatumPremijere = '';
  protected primijenjenBrojGlasova = '';

  async onPrimijeni() {
    this.primijenjenaOcjenaDolje = this.ocjenaDolje;
    this.primijenjenaOcjenaGore = this.ocjenaGore;
    this.primijenjenDatumPremijere = this.sortirajPoDatumuPremijere;
    this.primijenjenBrojGlasova = this.sortirajPoBrojuGlasova;
    await this.ucitajFilmove();
  }

  async onReset() {
    this.ocjenaDolje = '';
    this.ocjenaGore = '';
    this.sortirajPoDatumuPremijere = '';
    this.sortirajPoBrojuGlasova = '';
    this.primijenjenaOcjenaDolje = '';
    this.primijenjenaOcjenaGore = '';
    this.primijenjenDatumPremijere = '';
    this.primijenjenBrojGlasova = '';
    this.filmovi.set([]);
    this.greska.set(null);
  }

  protected imaAktivnePostavke() {
    return (
      this.imaValjanuOcjenu(this.primijenjenaOcjenaDolje) ||
      this.imaValjanuOcjenu(this.primijenjenaOcjenaGore) ||
      this.primijenjenDatumPremijere === 'asc' ||
      this.primijenjenDatumPremijere === 'desc' ||
      this.primijenjenBrojGlasova === 'asc' ||
      this.primijenjenBrojGlasova === 'desc'
    );
  }

  private async ucitajFilmove() {
    if (!this.imaAktivnePostavke()) {
      this.filmovi.set([]);
      this.greska.set(null);
      return;
    }

    this.ucitavanje.set(true);
    this.greska.set(null);
    try {
      const ocjenaDolje = this.parsirajOcjenu(this.primijenjenaOcjenaDolje);
      const imaOcjenaDolje = this.imaValjanuOcjenu(
        this.primijenjenaOcjenaDolje
      );
      const ocjenaGore = this.parsirajOcjenu(this.primijenjenaOcjenaGore);
      const imaOcjenaGore = this.imaValjanuOcjenu(this.primijenjenaOcjenaGore);
      if (imaOcjenaDolje && imaOcjenaGore && ocjenaDolje > ocjenaGore) {
        this.filmovi.set([]);
        this.greska.set('Ocjena od mora biti manja ili jednaka ocjeni do.');
        this.ucitavanje.set(false);
        return;
      }
      const sortirajPoBrojuGlasova = this.normalizirajSmjer(
        this.primijenjenBrojGlasova
      );
      const sortirajPoDatumuPremijere = this.normalizirajSmjer(
        this.primijenjenDatumPremijere
      );
      const odgovor = await this.filmoviService.getJavniFilmoviFilter({
        filtrirajPoOcjeniDolje: imaOcjenaDolje ? ocjenaDolje : undefined,
        filtrirajPoOcjeniGore: imaOcjenaGore ? ocjenaGore : undefined,
        sortirajPoBrojuGlasova,
        sortirajPoDatumuPremijere,
      });
      if (!odgovor.ok) {
        throw new Error('Greška u dohvatu filmova');
      }
      const podaci = Array.isArray(odgovor.data) ? odgovor.data : [];
      const filmovi = Array.isArray(podaci)
        ? podaci.map((film) => ({ ...film, izvor: 'lokalni' as const }))
        : [];
      this.filmovi.set(filmovi);
      this.greska.set(filmovi.length ? null : 'Nema javnih filmova');
    } catch {
      this.filmovi.set([]);
      this.greska.set('Nema javnih filmova');
    } finally {
      this.ucitavanje.set(false);
    }
  }

  private parsirajOcjenu(ulaz: string | number | null | undefined): number {
    if (ulaz === null || ulaz === undefined || ulaz === '') {
      return Number.NaN;
    }
    if (typeof ulaz === 'number') {
      return ulaz;
    }
    const preoblikuj = ulaz.trim().replace(',', '.');
    return Number(preoblikuj);
  }

  private imaValjanuOcjenu(ulaz: string | number | null | undefined): boolean {
    if (ulaz === null || ulaz === undefined || ulaz === '') {
      return false;
    }
    if (typeof ulaz === 'number') {
      return !Number.isNaN(ulaz);
    }
    if (!ulaz.trim()) {
      return false;
    }
    const broj = this.parsirajOcjenu(ulaz);
    return !Number.isNaN(broj);
  }

  private normalizirajSmjer(
    ulaz: string | null | undefined
  ): 'asc' | 'desc' | undefined {
    if (ulaz === 'asc' || ulaz === 'desc') {
      return ulaz;
    }
    return undefined;
  }
}
