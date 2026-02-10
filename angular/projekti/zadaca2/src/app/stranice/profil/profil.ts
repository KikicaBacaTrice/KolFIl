import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { KarticaSadrzaj } from '../../zajednicko/kartica-sadrzaj/kartica-sadrzaj';
import { KorisnikI, PreferenceI } from '../../servisI/korisniciI';
import { KolekcijaI } from '../../servisI/kolekcijeI';
import { AuthService } from '../../servisI/auth.service';
import { KorisniciService } from '../../servisI/korisnici.service';

@Component({
  selector: 'app-profil',
  imports: [KarticaSadrzaj, NgIf, NgFor],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class Profil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly korisniciService = inject(KorisniciService);
  protected readonly korisnik = signal<KorisnikI | null>(null);
  protected readonly poruka = signal('');
  private readonly slikaOsnova = '.png';
  private readonly fallbackSlikaKolekcije = '/slike/NemaPosterKolekcije.png';

  constructor(private readonly router: Router) {}

  async ngOnInit() {
    const korime = await this.ucitajSesijuKorime();
    if (!korime) {
      await this.router.navigate(['/prijava']);
      return;
    }
    await this.ucitajProfil(korime);
  }

  protected korisnikKorime() {
    return this.korisnik()?.korime || '-';
  }

  protected korisnikImePrezime() {
    const ime = this.korisnik()?.ime || '';
    const prezime = this.korisnik()?.prezime || '';
    const spojeno = `${ime} ${prezime}`.trim();
    return spojeno || '-';
  }

  protected korisnikEmail() {
    return this.korisnik()?.email || '-';
  }

  protected korisnikAdresa() {
    return this.korisnik()?.adresa || '-';
  }

  protected korisnikOpis() {
    return this.korisnik()?.opis || '-';
  }

  protected preference(): PreferenceI[] {
    const lista = this.korisnik()?.preference;
    return Array.isArray(lista) ? lista : [];
  }

  protected kolekcije(): KolekcijaI[] {
    const lista = this.korisnik()?.kolekcije;
    if (!Array.isArray(lista)) {
      return [];
    }
    return lista.map((kolekcija) => ({
      id: kolekcija.id,
      naziv: kolekcija.naziv,
      opis: kolekcija.opis ?? null,
      slikaKolekcija: kolekcija.slikaKolekcije ?? '',
      brojFilmova: kolekcija.brojFilmova ?? 0,
    }));
  }

  private async ucitajProfil(korime: string) {
    this.poruka.set('');
    try {
      const odgovor = await this.korisniciService.getKorisnik(korime);
      if (!odgovor.ok) {
        throw new Error('Profil nije moguce prikazati.');
      }
      const korisnik = odgovor.data as KorisnikI;
      this.korisnik.set(korisnik);
    } catch {
      this.poruka.set('Profil nije moguce prikazati.');
    }
  }

  private async ucitajSesijuKorime() {
    const sesija = await this.authService.getSession();
    return sesija?.korime || null;
  }

  private restOsnova() {
    const port = this.citajRestPortIzKolacica();
    return port
      ? `http://${window.location.hostname}:${port}`
      : window.location.origin;
  }

  private citajRestPortIzKolacica() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('portRest=')) {
        return trimmed.substring('portRest='.length);
      }
    }
    return null;
  }
}
