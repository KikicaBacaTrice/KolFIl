import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KarticaFilm } from '../../zajednicko/kartica-film/kartica-film';
import { FilmKolekcijaI, KolekcijaDetaljiI } from '../../servisI/kolekcijeI';
import { FilmI } from '../../servisI/filmI';
import { KolekcijeService } from '../../servisI/kolekcije.service';

@Component({
  selector: 'app-detalji-kolekcije',
  imports: [NgIf, NgFor, KarticaFilm],
  templateUrl: './detalji-kolekcije.html',
  styleUrl: './detalji-kolekcije.scss',
})
export class DetaljiKolekcije implements OnInit {
  private readonly kolekcijeService = inject(KolekcijeService);
  protected readonly kolekcija = signal<KolekcijaDetaljiI | null>(null);
  protected readonly poruka = signal('');
  protected readonly uklanjanje = signal<number | null>(null);
  private readonly slikaOsnova = '.png';
  private readonly fallbackSlikaKolekcije = '/slike/NemaPosterKolekcije.png';

  constructor(private readonly route: ActivatedRoute) {}

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.poruka.set('Nije odabrana kolekcija.');
      return;
    }

    this.poruka.set('Učitavanje...');
    try {
      const odgovor = await this.kolekcijeService.getKolekcija(idParam);
      if (!odgovor.ok) {
        throw new Error('Greška');
      }
      const podaci = odgovor.data as KolekcijaDetaljiI;
      this.kolekcija.set(podaci);
      this.poruka.set('');
    } catch {
      this.poruka.set('Nemate pravo pristupa ovoj kolekciji.');
    }
  }

  protected filmovi() {
    return this.kolekcija()?.filmovi ?? [];
  }

  protected mapirajFilmKarticu(film: FilmKolekcijaI): FilmI {
    return {
      id: film.id,
      naziv: film.naziv || 'Nepoznat film',
      opis: film.opis || '',
      datumPremijere: film.datumPremijere || '',
      popularnost: null,
      prosjecnaOcjena: null,
      brojGlasova: null,
      filmJavan: true,
      autor: null,
      posterSlika: film.posterSlika ?? null,
      bannerSlika: null,
      video: null,
      izvor: 'lokalni',
    };
  }

  protected slikaKolekcije(kolekcija: any) {
    const slika =
      kolekcija?.slikaKolekcije ||
      kolekcija?.slikaKolekcija ||
      kolekcija?.slika_kolekcije ||
      '';
    return this.odaberiSlikuKolekcije(slika, this.fallbackSlikaKolekcije);
  }

  protected pozadinaKolekcije(kolekcija: any) {
    const slika = this.slikaKolekcije(kolekcija);
    if (!slika) {
      return 'linear-gradient(140deg, #181c2f 0%, #0c0f1f 80%)';
    }
    return `url('${slika}')`;
  }

  protected kolekcijaJavna(kolekcija: any) {
    return Boolean(kolekcija?.kolekcijaJavna ?? kolekcija?.kolekcija_javna);
  }

  protected async makniFilm(film: FilmKolekcijaI, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const kolekcijaId = this.kolekcija()?.id;
    if (!kolekcijaId || !film?.id) {
      return;
    }
    this.uklanjanje.set(film.id);
    try {
      const odgovor = await this.kolekcijeService.removeFilm(
        Number(kolekcijaId),
        Number(film.id)
      );
      if (!odgovor.ok) {
        throw new Error('Brisanje nije uspjelo');
      }
      const lista = this.filmovi().filter((f) => f.id !== film.id);
      const trenutna = this.kolekcija();
      if (trenutna) {
        this.kolekcija.set({ ...trenutna, filmovi: lista });
      }
    } catch {
      this.poruka.set('Trenutno film nije moguće maknuti iz kolekcije.');
    } finally {
      this.uklanjanje.set(null);
    }
  }

  protected async makniFilmIzKartice(film: FilmI) {
    if (!film?.id) {
      return;
    }
    await this.makniFilm({
      id: film.id,
      naziv: film.naziv,
      datumPremijere: film.datumPremijere,
      opis: film.opis,
      posterSlika: film.posterSlika,
    });
  }

  private odaberiSlikuKolekcije(
    slika: string | null | undefined,
    fallback: string
  ) {
    if (!slika || !slika.endsWith(this.slikaOsnova)) {
      return fallback;
    }
    return `/slike/kolekcije/${slika}`;
  }
}
