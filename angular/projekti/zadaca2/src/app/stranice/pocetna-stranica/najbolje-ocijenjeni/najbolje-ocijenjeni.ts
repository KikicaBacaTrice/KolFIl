import { Component, inject, OnInit, signal } from '@angular/core';

import { NgFor, NgIf } from '@angular/common';
import { KarticaFilm } from '../../../zajednicko/kartica-film/kartica-film';
import { FilmI, ZanrI } from '../../../servisI/filmI';
import { FilmTmdbI, ZanrTmdbI } from '../../../servisI/tmdbI';
import { TmdbService } from '../../../servisI/tmdb.service';

type FilmKarticaI = FilmI & {
  zanrovi: Array<ZanrI>;
  tmdbId?: number | null;
  izvor: 'tmdb';
};

@Component({
  selector: 'app-najbolje-ocijenjeni',
  imports: [KarticaFilm, NgIf, NgFor],
  templateUrl: './najbolje-ocijenjeni.html',
  styleUrl: './najbolje-ocijenjeni.scss',
})
export class NajboljeOcjenjeni implements OnInit {
  private readonly tmdbService = inject(TmdbService);
  protected readonly filmovi = signal<FilmKarticaI[]>([]);
  protected readonly greska = signal<string | null>(null);
  private mapaZanrova: Record<number, string> = {};

  async ngOnInit() {
    await this.ucitajPodatke();
  }

  private async ucitajPodatke() {
    try {
      this.mapaZanrova = await this.ucitajZanrove();
      const odgovor = await this.tmdbService.getBestAnimated();
      if (!odgovor.ok) {
        throw new Error('Greska u dohvatu filmova.');
      }
      const podaci = Array.isArray(odgovor.data?.results) ? odgovor.data.results : [];
      const filmovi = Array.isArray(podaci)
        ? podaci.map((film) => this.mapirajFilm(film))
        : [];
      this.filmovi.set(filmovi);
      this.greska.set(filmovi.length ? null : 'Nema filmova.');
    } catch {
      this.filmovi.set([]);
      this.greska.set('Greška u dohvatu filmova.');
    }
  }

  private async ucitajZanrove() {
    try {
      const odgovor = await this.tmdbService.getGenres();
      if (!odgovor.ok) {
        return {};
      }
      const zanrovi = Array.isArray(odgovor.data) ? odgovor.data : [];
      const mapa: Record<number, string> = {};
      for (const zanr of zanrovi) {
        if (zanr) {
          mapa[zanr.id] = zanr.name;
        }
      }
      return mapa;
    } catch {
      return {};
    }
  }

  private mapirajFilm(film: FilmTmdbI): FilmKarticaI {
    const poster = film.poster_path
      ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
      : null;
    return {
      id: film.id,
      tmdbId: film.id,
      izvor: 'tmdb',
      naziv: film.title || film.original_title || 'Nepoznat film',
      opis: film.overview || '',
      datumPremijere: film.release_date || '',
      popularnost: film.popularity ?? null,
      prosjecnaOcjena: film.vote_average ?? null,
      brojGlasova: film.vote_count ?? null,
      filmJavan: true,
      autor: null,
      posterSlika: poster,
      bannerSlika: null,
      video: null,
      zanrovi: this.mapirajZanrove(film),
    };
  }

  private mapirajZanrove(film: FilmTmdbI) {
    const zanrovi: Array<ZanrI> = [];
    if (Array.isArray(film.genres) && film.genres.length) {
      for (const zanr of film.genres) {
        if (!zanr) {
          continue;
        }
        const naziv = zanr.name || this.mapaZanrova[zanr.id];
        if (naziv) {
          zanrovi.push({ id: zanr.id, naziv, opis: null });
        }
      }
      return zanrovi;
    }
    if (Array.isArray(film.genre_ids)) {
      for (const id of film.genre_ids) {
        const naziv = this.mapaZanrova[id];
        if (naziv) {
          zanrovi.push({ id, naziv, opis: null });
        }
      }
    }
    return zanrovi;
  }
}
