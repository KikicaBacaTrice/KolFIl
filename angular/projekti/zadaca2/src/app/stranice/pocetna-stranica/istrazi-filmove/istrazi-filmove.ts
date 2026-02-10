import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FilmI, ZanrI } from '../../../servisI/filmI';
import { KarticaFilm } from '../../../zajednicko/kartica-film/kartica-film';
import { FilmoviTmdbI, FilmTmdbI, ZanrTmdbI } from '../../../servisI/tmdbI';
import { TmdbService } from '../../../servisI/tmdb.service';

type FilmKarticaI = FilmI & {
  zanrovi: Array<ZanrI>;
  tmdbId?: number | null;
  izvor: 'tmdb';
};

@Component({
  selector: 'app-istrazi-filmove',
  imports: [KarticaFilm, NgFor, NgIf],
  templateUrl: './istrazi-filmove.html',
  styleUrl: './istrazi-filmove.scss',
})
export class IstraziFilmove implements OnInit {
  private readonly tmdbService = inject(TmdbService);
  protected readonly filmovi = signal<FilmKarticaI[]>([]);
  protected readonly greska = signal<string | null>(null);
  protected readonly stranica = signal(1);
  protected readonly ukupnoStranica = signal(0);
  protected readonly trazi = signal('');
  private mapaZanrova: Record<number, string> = {};

  async ngOnInit() {
    this.mapaZanrova = await this.ucitajZanrove();
    await this.ucitajStranicu(1);
  }

  async ucitajStranicu(novaStranica: number) {
    try {
      const trazi = this.trazi().trim();
      const odgovor = await this.tmdbService.getRandom({
        stranica: novaStranica,
        trazi,
      });
      if (!odgovor.ok) {
        throw new Error('Grešku pri dohvaćanju filmova');
      }
      const podaci = odgovor.data as FilmoviTmdbI;
      const rezultati = Array.isArray(podaci?.results) ? podaci.results : [];
      const filmovi = rezultati.map((film) => this.mapirajFilm(film));
      this.filmovi.set(filmovi);
      this.stranica.set(podaci?.page ?? novaStranica);
      this.ukupnoStranica.set(podaci?.total_pages ?? 0);
      this.greska.set(filmovi.length ? null : 'Nema filmova');
    } catch {
      this.filmovi.set([]);
      this.ukupnoStranica.set(0);
      this.greska.set('Dogodila se greška pri dohvaćanuj filmova');
    }
  }

  onFilterInput(event: Event) {
    const vrijednost = (event.target as HTMLInputElement | null)?.value ?? '';
    this.trazi.set(vrijednost);
    this.ucitajStranicu(1);
  }

  private async ucitajZanrove() {
    try {
      const odgovor = await this.tmdbService.getGenres();
      if (!odgovor.ok) {
        return {};
      }
      const zanrovi = Array.isArray(odgovor.data) ? odgovor.data : [];
      const mapa: Record<number, string> = {};
      for (let zanr of zanrovi) {
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
