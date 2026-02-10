import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { KarticaFilm } from '../../zajednicko/kartica-film/kartica-film';
import { FilmDetaljiI } from '../../servisI/filmI';
import { FormsModule } from '@angular/forms';
import { FilmoviService } from '../../servisI/filmovi.service';

@Component({
  selector: 'app-svi-javni-filmovi',
  imports: [KarticaFilm, NgFor, NgIf, FormsModule],
  templateUrl: './svi-javni-filmovi.html',
  styleUrl: './svi-javni-filmovi.scss',
})
export class SviJavniFilmovi implements OnInit {
  private readonly filmoviService = inject(FilmoviService);
  protected readonly filmovi = signal<FilmDetaljiI[]>([]);
  protected readonly greska = signal<string | null>(null);
  protected readonly ucitavanje = signal(false);
  protected trazi = '';

  async ngOnInit() {
    await this.ucitajFilmove();
  }

  async onPrimijeni() {
    await this.ucitajFilmove();
  }

  async onReset() {
    this.trazi = '';
    await this.ucitajFilmove();
  }

  private async ucitajFilmove() {
    this.ucitavanje.set(true);
    this.greska.set(null);

    try {
      const trazi = this.trazi.trim();
      const odgovor = await this.filmoviService.getJavniFilmoviFilter({
        trazi: trazi || undefined,
      });
      if (!odgovor.ok) {
        throw new Error('Greška u dohvatu javnih filmova');
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
}
