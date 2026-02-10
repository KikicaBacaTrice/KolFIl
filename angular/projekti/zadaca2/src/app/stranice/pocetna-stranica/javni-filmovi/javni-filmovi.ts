import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KarticaFilm } from '../../../zajednicko/kartica-film/kartica-film';
import { FilmDetaljiI } from '../../../servisI/filmI';
import { FilmoviService } from '../../../servisI/filmovi.service';

@Component({
  selector: 'app-javni-filmovi',
  imports: [NgFor, KarticaFilm, RouterLink, NgIf, CommonModule],
  templateUrl: './javni-filmovi.html',
  styleUrl: './javni-filmovi.scss',
})
export class JavniFilmovi implements OnInit {
  private readonly filmoviService = inject(FilmoviService);
  protected readonly filmovi = signal<FilmDetaljiI[]>([]);
  protected readonly greska = signal<string | null>(null);
  protected readonly prikazi = signal<boolean>(false);
  @Input() jeLiPrijavljen = false;

  protected prikaziBtn() {
    return this.jeLiPrijavljen ?? false;
  }

  async ngOnInit() {
    try {
      const odgovor = await this.filmoviService.getJavniFilmovi();
      if (!odgovor.ok) {
        throw new Error('Greška u dohvatu javnih filmova');
      }
      const podaci = Array.isArray(odgovor.data) ? odgovor.data : [];
      const filmovi = Array.isArray(podaci)
        ? podaci.map((film) => ({ ...film, izvor: 'lokalni' as const }))
        : [];
      this.filmovi.set(filmovi);
    } catch (greska) {
      this.greska.set('Nema javnih filmova');
    }
  }
}
