import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilmI, ZanrI } from '../../servisI/filmI';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kartica-film',
  imports: [NgIf, NgFor, RouterLink, CommonModule],
  templateUrl: './kartica-film.html',
  styleUrl: './kartica-film.scss',
})
export class KarticaFilm {
  @Input() film?: FilmI & { zanrovi?: Array<ZanrI>; tmdbId?: number | null };
  @Input() prikaziBrisanje = false;
  @Input() tekstBrisanja = 'Makni film iz kolekcije';
  @Input() onemoguciBrisanje = false;
  @Output() brisanje = new EventEmitter<FilmI>();
  private readonly tmdbOsnova = 'https://image.tmdb.org';
  private readonly fallBackPoster = '/slike/NemaPosteraFilma.png';

  protected naslov() {
    return this.film?.naziv ?? 'Nepoznat film';
  }

  protected opis() {
    return this.film?.opis ?? '';
  }

  protected metrika() {
    if (this.film?.prosjecnaOcjena != null) {
      return `${Number(this.film.prosjecnaOcjena).toFixed(2)}/10`;
    }
    if (this.film?.popularnost != null) {
      return `${Math.round(this.film.popularnost)}`;
    }
    return '';
  }

  protected zanroviNazivi() {
    if (!this.film?.zanrovi) {
      return [];
    }
    return this.film.zanrovi
      .map((zanr) => zanr?.naziv)
      .filter((naziv): naziv is string => Boolean(naziv));
  }

  protected pozadina() {
    const slika = this.film?.posterSlika ?? '';
    if (!slika || !this.jeTmdbSlika(slika)) {
      return `url("${this.fallBackPoster}")`;
    }
    return `url("${slika}")`;
  }

  protected detaljiLink() {
    if (this.film?.izvor === 'tmdb') {
      const tmdbId = this.film.tmdbId ?? this.film.id;
      return ['/detaljiFilma', 'tmdb', tmdbId];
    }
    if (this.film?.tmdbId) {
      return ['/detaljiFilma', 'tmdb', this.film.tmdbId];
    }
    if (this.film?.id) {
      return ['/detaljiFilma', this.film.id];
    }
    return ['/'];
  }

  protected klikBrisanja(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.film) {
      this.brisanje.emit(this.film);
    }
  }

  private jeTmdbSlika(slika: string) {
    return slika.startsWith(this.tmdbOsnova);
  }
}
