import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KarticaSadrzaj } from '../../zajednicko/kartica-sadrzaj/kartica-sadrzaj';
import { KolekcijaI } from '../../servisI/kolekcijeI';
import { UnutarKolekcijaI } from '../../servisI/filmI';
import { FilmoviService } from '../../servisI/filmovi.service';
import { KolekcijeService } from '../../servisI/kolekcije.service';
import { TmdbService } from '../../servisI/tmdb.service';

@Component({
  selector: 'app-detalji-filma',
  imports: [NgIf, NgFor, KarticaSadrzaj],
  templateUrl: './detalji-filma.html',
  styleUrl: './detalji-filma.scss',
})
export class DetaljiFilma implements OnInit {
  private readonly filmoviService = inject(FilmoviService);
  private readonly kolekcijeService = inject(KolekcijeService);
  private readonly tmdbService = inject(TmdbService);
  protected readonly film = signal<any | null>(null);
  protected readonly poruka = signal('');
  protected readonly kolekcije = signal<KolekcijaI[]>([]);
  protected readonly statusDodavanja = signal('');
  protected readonly lokalniFilmId = signal<number | null>(null);
  protected readonly odabranaKolekcijaId = signal<number | null>(null);
  protected readonly spremanje = signal(false);
  private readonly tmdbOsnova = 'https://image.tmdb.org';
  private readonly slikaOsnova = '.png';
  private readonly fallbackSlikaPoster = '/slike/NemaPosteraFilma.png';
  private readonly fallbackSlikaBanner = '/slike/NemaBanneraFilma.png';
  private readonly fallbackSlikaKolekcije = '/slike/NemaPosterKolekcije.png';

  constructor(private readonly route: ActivatedRoute) {}

  async ngOnInit() {
    this.poruka.set('Učitavanje...');
    const idParam = this.route.snapshot.paramMap.get('id');
    const izvorParam = this.route.snapshot.data['izvor'];
    if (!idParam) {
      this.poruka.set('Film nije odabran.');
      return;
    }

    const tmdbId = izvorParam === 'tmdb' ? idParam : null;
    const lokalniId = izvorParam === 'tmdb' ? null : idParam;
    await this.ucitajFilm(lokalniId, tmdbId);
    await this.ucitajKolekcije();
  }

  protected nazivFilma(film: any) {
    return (
      film?.title || film?.original_title || film?.naziv || 'Nepoznat film'
    );
  }

  protected opisFilma(film: any) {
    return film?.overview || film?.opis || 'Opis nije dostupan.';
  }

  protected datumPremijere(film: any) {
    return this.formatDatum(
      film?.release_date || film?.datumPremijere || film?.datum_premijere || ''
    );
  }

  protected ocjenaFilma(film: any) {
    const vrijednost =
      film?.vote_average ?? film?.prosjecnaOcjena ?? film?.ocjena;
    if (vrijednost === undefined || vrijednost === null) {
      return null;
    }
    const broj = Number(vrijednost);
    return Number.isNaN(broj) ? null : broj.toFixed(2);
  }

  protected popularnostFilma(film: any) {
    const vrijednost = film?.popularity ?? film?.popularnost ?? null;
    if (vrijednost === undefined || vrijednost === null) {
      return null;
    }
    const broj = Number(vrijednost);
    return Number.isNaN(broj) ? null : Math.round(broj).toString();
  }

  protected zanroviNazivi(film: any) {
    if (Array.isArray(film?.genres)) {
      return film.genres
        .map((zanr: any) => zanr?.name || zanr?.naziv)
        .filter(Boolean);
    }
    if (Array.isArray(film?.zanrovi)) {
      return film.zanrovi
        .map((zanr: any) => zanr?.naziv || zanr?.name)
        .filter(Boolean);
    }
    return [] as string[];
  }

  protected posterUrl(film: any) {
    if (film?.poster_path) {
      return `${this.tmdbOsnova}/t/p/w500${film.poster_path}`;
    }
    return this.odaberiTmdbSliku(film?.posterSlika, this.fallbackSlikaPoster);
  }

  protected bannerSrc(film: any) {
    if (film?.backdrop_path) {
      return `${this.tmdbOsnova}/t/p/w780${film.backdrop_path}`;
    }
    return this.odaberiTmdbSliku(film?.bannerSlika, this.fallbackSlikaBanner);
  }

  protected kolekcijeFilma(film: any) {
    return Array.isArray(film?.kolekcije)
      ? (film.kolekcije as UnutarKolekcijaI[])
      : [];
  }

  protected kolekcijeKartice(film: any): KolekcijaI[] {
    return this.kolekcijeFilma(film).map((kolekcija) => ({
      id: kolekcija.id,
      naziv: kolekcija.naziv || `Kolekcija ${kolekcija.id}`,
      slikaKolekcija: kolekcija.slikaKolekcije ?? '',
      brojFilmova: 0,
    }));
  }

  protected glasoviFilma(film: any) {
    const vrijednost = film?.vote_count ?? film?.brojGlasova ?? null;
    if (vrijednost === undefined || vrijednost === null) {
      return null;
    }
    const broj = Number(vrijednost);
    return Number.isNaN(broj) ? null : Math.round(broj).toString();
  }

  protected filmJavanTekst(film: any) {
    if (film?.filmJavan === undefined || film?.filmJavan === null) {
      return 'Nije navedeno';
    }
    return film.filmJavan ? 'Da' : 'Ne';
  }

  protected autorFilma(film: any) {
    return film?.autor || 'Autor nije naveden';
  }

  protected videoUrl(film: any) {
    const video = film?.video;
    if (!video || video === 'Video nije navecen') {
      return null;
    }
    return video;
  }

  protected mozePromijenitiVidljivost() {
    return Boolean(this.lokalniFilmId());
  }

  protected oznakaVidljivosti(film: any) {
    return film?.filmJavan ? 'Postavi kao privatno' : 'Postavi kao javno';
  }

  protected async toggleVidljivost() {
    const film = this.film();
    const filmId = this.lokalniFilmId();
    if (!film || !filmId) {
      return;
    }
    const noviStatus = !film.filmJavan;
    try {
      await this.promijeniVidljivostFilma(filmId, noviStatus);
      this.film.set({ ...film, filmJavan: noviStatus });
    } catch {
      this.statusDodavanja.set('Greska pri spremanju vidljivosti filma.');
    }
  }

  protected pozadinaKolekcije(kolekcija: UnutarKolekcijaI) {
    const slika = kolekcija?.slikaKolekcije ?? '';
    return `url('${this.odaberiSlikuKolekcije(
      slika,
      this.fallbackSlikaKolekcije
    )}')`;
  }

  protected odaberiKolekciju(event: Event) {
    const select = event.target as HTMLSelectElement | null;
    const vrijednost = select?.value ? Number(select.value) : null;
    this.odabranaKolekcijaId.set(
      vrijednost != null && Number.isInteger(vrijednost) ? vrijednost : null
    );
  }

  protected async dodajUKolekciju() {
    const kolekcijaId = this.odabranaKolekcijaId();
    if (!kolekcijaId) {
      this.statusDodavanja.set('Odaberite kolekciju.');
      return;
    }
    const film = this.film();
    if (!film) {
      this.statusDodavanja.set('Film nije ucitan.');
      return;
    }

    this.spremanje.set(true);
    this.statusDodavanja.set('Spremanje...');
    try {
      let filmId = this.lokalniFilmId();
      if (!filmId) {
        filmId = await this.spremiFilmUBazu(film);
        this.lokalniFilmId.set(filmId);
      }
      await this.dodajFilmUBazuKolekcije(filmId, kolekcijaId);
      this.dodajKolekcijuULokalniFilm(kolekcijaId);
      this.statusDodavanja.set('Film je dodan u kolekciju.');
    } catch {
      this.statusDodavanja.set('Greska pri dodavanju filma u kolekciju.');
    } finally {
      this.spremanje.set(false);
    }
  }

  private async ucitajFilm(idParam: string | null, tmdbParam: string | null) {
    this.poruka.set('Ucitavanje...');
    try {
      if (tmdbParam) {
        const filmTmdb = await this.dohvatiTmdbFilm(tmdbParam);
        const naziv = filmTmdb?.title || filmTmdb?.original_title;
        const datum = filmTmdb?.release_date;
        if (naziv && datum) {
          const lokalni = await this.dohvatiLokalniFilmPoNazivuIDatumu(
            naziv,
            datum
          );
          if (lokalni) {
            this.lokalniFilmId.set(lokalni.id ?? null);
            if (Array.isArray(lokalni.kolekcije)) {
              filmTmdb.kolekcije = lokalni.kolekcije;
            }
          }
        }
        this.film.set(filmTmdb);
      } else if (idParam) {
        const lokalni = await this.dohvatiLokalniFilm(idParam);
        this.film.set(lokalni);
        this.lokalniFilmId.set(lokalni?.id ?? Number(idParam));
      }
      this.poruka.set('');
    } catch {
      this.poruka.set('Nije moguće dohvatiti detalje filma.');
    }
  }

  private async ucitajKolekcije() {
    try {
      const odgovor = await this.kolekcijeService.getSve();
      if (!odgovor.ok) {
        throw new Error('Greska');
      }
      const podaci = Array.isArray(odgovor.data) ? odgovor.data : [];
      const lista = Array.isArray(podaci) ? podaci : [];
      this.kolekcije.set(lista);
      if (lista.length) {
        this.odabranaKolekcijaId.set(lista[0].id);
      }
    } catch {
      this.kolekcije.set([]);
      this.statusDodavanja.set('Nije moguce dohvatiti kolekcije.');
    }
  }

  private async dohvatiTmdbFilm(id: string) {
    const odgovor = await this.tmdbService.getFilm(id);
    if (!odgovor.ok) {
      throw new Error('TMDB greska');
    }
    return odgovor.data;
  }

  private async dohvatiLokalniFilm(id: string) {
    const odgovor = await this.filmoviService.getFilm(id);
    if (!odgovor.ok) {
      throw new Error('Lokalni film greska');
    }
    return odgovor.data;
  }

  private async dohvatiLokalniFilmPoNazivuIDatumu(
    naziv: string,
    datumPremijere: string
  ) {
    const odgovor = await this.filmoviService.searchFilm(naziv, datumPremijere);
    if (!odgovor.ok) {
      return null;
    }
    return odgovor.data;
  }

  private async spremiFilmUBazu(film: any) {
    const tijelo = this.tijeloFilmaZaSpremanje(film);
    const odgovor = await this.filmoviService.createFilm(tijelo);
    if (!odgovor.ok) {
      throw new Error('Spremanje filma nije uspjelo');
    }
    const podaci = odgovor.data as any;
    return podaci?.id ?? podaci?.film?.id;
  }

  private tijeloFilmaZaSpremanje(film: any) {
    const datum =
      typeof film?.release_date === 'string' && film.release_date.length
        ? film.release_date
        : '1970-01-01';
    const zanroviIds = Array.isArray(film?.genre_ids)
      ? film.genre_ids
      : Array.isArray(film?.genres)
      ? film.genres
          .map((zanr: any) => zanr?.id)
          .filter((id: number) => Number.isInteger(id))
      : [];

    return {
      naziv: this.nazivFilma(film),
      opis: film?.overview || film?.opis || 'Opis nije dostupan',
      datumPremijere: datum,
      popularnost:
        film?.popularity !== undefined ? Number(film.popularity) : null,
      prosjecnaOcjena:
        film?.vote_average !== undefined ? Number(film.vote_average) : null,
      brojGlasova:
        film?.vote_count !== undefined ? Number(film.vote_count) : null,
      filmJavan: true,
      posterSlika: film?.poster_path
        ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
        : null,
      bannerSlika: film?.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${film.backdrop_path}`
        : null,
      video: null,
      zanroviIDs: zanroviIds,
    };
  }

  private async dodajFilmUBazuKolekcije(
    filmId: number | null,
    kolekcijaId: number
  ) {
    const odgovor = await this.filmoviService.addFilmToCollection(
      Number(filmId),
      kolekcijaId
    );
    if (!odgovor.ok) {
      throw new Error('Dodavanje nije uspjelo');
    }
    return odgovor.data;
  }

  private async promijeniVidljivostFilma(filmId: number, noviStatus: boolean) {
    const odgovor = await this.filmoviService.updateFilm(filmId, {
      filmJavan: noviStatus,
    });
    if (!odgovor.ok) {
      throw new Error('Spremanje nije uspjelo');
    }
    return odgovor.data;
  }

  private dodajKolekcijuULokalniFilm(kolekcijaId: number) {
    const film = this.film();
    if (!film) {
      return;
    }
    if (!Array.isArray(film.kolekcije)) {
      film.kolekcije = [];
    }
    const postoji = film.kolekcije.some(
      (k: UnutarKolekcijaI) => Number(k.id) === Number(kolekcijaId)
    );
    if (postoji) {
      return;
    }
    const kolekcija = this.kolekcije().find(
      (k) => Number(k.id) === Number(kolekcijaId)
    );
    film.kolekcije.push({
      id: kolekcijaId,
      naziv: kolekcija?.naziv || `Kolekcija ${kolekcijaId}`,
      slikaKolekcije: kolekcija?.slikaKolekcija ?? null,
    });
    this.film.set({ ...film });
  }

  private odaberiTmdbSliku(slika: string | null | undefined, fallback: string) {
    if (!slika || !slika.startsWith(this.tmdbOsnova)) {
      return fallback;
    }
    return slika;
  }

  private odaberiSlikuKolekcije(
    slika: string | null | undefined,
    fallback: string
  ) {
    if (!slika || !slika.endsWith(this.slikaOsnova)) {
      return fallback;
    }
    return slika;
  }

  private formatDatum(datum: string) {
    if (!datum) return '';
    if (typeof datum === 'string') {
      const dijelovi = datum.split('-');
      if (dijelovi.length === 3) {
        const [godina, mjesec, dan] = dijelovi;
        const dd = String(dan).padStart(2, '0');
        const mm = String(mjesec).padStart(2, '0');
        return `${dd}.${mm}.${godina}`;
      }
    }
    return datum;
  }
}
