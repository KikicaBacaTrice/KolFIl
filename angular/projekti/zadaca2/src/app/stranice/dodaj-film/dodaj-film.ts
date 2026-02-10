import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FilmUnosI, ZanrI } from '../../servisI/filmI';
import { FormsModule } from '@angular/forms';
import { FilmoviService } from '../../servisI/filmovi.service';

@Component({
  selector: 'app-dodaj-film',
  imports: [RouterLink, NgIf, NgFor, FormsModule],
  templateUrl: './dodaj-film.html',
  styleUrl: './dodaj-film.scss',
})
export class DodajFilm implements OnInit {
  private readonly filmoviService = inject(FilmoviService);
  protected readonly poruka = signal('');
  protected readonly zanrovi = signal<ZanrI[]>([]);
  protected readonly zanroviPoruka = signal('Ucitavanje zanrova...');
  protected readonly spremanje = signal(false);
  protected naziv = '';
  protected datumPremijere = '';
  protected opis = '';
  protected popularnost = '';
  protected prosjecnaOcjena = '';
  protected brojGlasova = '';
  protected filmJavan = true;
  protected autor = '';
  protected video = '';
  protected odabraniZanrovi: Record<number, boolean> = {};

  async ngOnInit() {
    await this.ucitajZanrove();
  }

  protected async spremiFilm() {
    if (this.spremanje()) {
      return;
    }

    this.poruka.set('');
    const naziv = this.naziv.trim();
    const opis = this.opis.trim();
    const datumPremijere = this.datumPremijere;

    if (!naziv || !opis || !datumPremijere) {
      this.poruka.set('Naziv, opis i datum premijere su obavezni.');
      return;
    }

    const odabraniZanrovi = Object.entries(this.odabraniZanrovi)
      .filter(([, odabrano]) => odabrano)
      .map(([id]) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    const tijelo: FilmUnosI = {
      naziv,
      opis,
      datumPremijere,
      popularnost: this.procistiBroj(this.popularnost),
      prosjecnaOcjena: this.procistiBroj(this.prosjecnaOcjena),
      brojGlasova: this.procistiBroj(this.brojGlasova),
      filmJavan: this.filmJavan,
      autor: this.procistiTekst(this.autor),
      posterSlika: '',
      bannerSlika: '',
      video: this.procistiTekst(this.video),
    };

    if (odabraniZanrovi.length > 0) {
      tijelo.zanroviIds = odabraniZanrovi;
    }

    this.spremanje.set(true);
    try {
      const odgovor = await this.filmoviService.createFilm(tijelo);
      if (odgovor.ok) {
        this.poruka.set('Film je uspjesno dodan');
        this.resetForm();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const greskaTekst =
        odgovor.error ||
        (typeof odgovor.data === 'string' ? odgovor.data : '') ||
        'Dodavanje nije uspjelo.';
      this.poruka.set(`Greska (${odgovor.status}): ${greskaTekst}`);
    } catch {
      this.poruka.set('Greška pri spremanju filma.');
    } finally {
      this.spremanje.set(false);
    }
  }

  private async ucitajZanrove() {
    this.zanroviPoruka.set('Učitavanje zanrova...');
    try {
      const odgovor = await this.filmoviService.getZanrovi();
      if (!odgovor.ok) {
        throw new Error('Nema žanrova');
      }
      const zanrovi = Array.isArray(odgovor.data) ? odgovor.data : [];
      if (!Array.isArray(zanrovi) || zanrovi.length === 0) {
        this.zanrovi.set([]);
        this.zanroviPoruka.set('Žanrovi nisu dostupni.');
        return;
      }
      this.zanrovi.set(zanrovi);
      this.zanroviPoruka.set('');
    } catch {
      this.zanrovi.set([]);
      this.zanroviPoruka.set('Žanrovi nisu dostupni.');
    }
  }

  private procistiBroj(vrijednost: string) {
    if (vrijednost === undefined || vrijednost === null || vrijednost === '') {
      return null;
    }
    const broj = Number(vrijednost);
    return Number.isNaN(broj) ? null : broj;
  }

  private procistiTekst(vrijednost: string) {
    const trimmed = vrijednost.trim();
    return trimmed ? trimmed : null;
  }

  private resetForm() {
    this.naziv = '';
    this.datumPremijere = '';
    this.opis = '';
    this.popularnost = '';
    this.prosjecnaOcjena = '';
    this.brojGlasova = '';
    this.filmJavan = true;
    this.autor = '';
    this.video = '';
    this.odabraniZanrovi = {};
  }
}
