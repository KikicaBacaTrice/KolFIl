import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PreferenceI } from '../../servisI/korisniciI';
import { ZnackaForma } from '../../zajednicko/znacka-forma/znacka-forma';
import { FormsModule } from '@angular/forms';
import { KorisniciService } from '../../servisI/korisnici.service';
import { PreferenceService } from '../../servisI/preference.service';

@Component({
  selector: 'app-registracija',
  imports: [RouterLink, ZnackaForma, FormsModule],
  templateUrl: './registracija.html',
  styleUrl: './registracija.scss',
})
export class Registracija implements OnInit {
  private readonly korisniciService = inject(KorisniciService);
  private readonly preferenceService = inject(PreferenceService);
  protected readonly poruka = signal('');
  protected readonly preference = signal<PreferenceI[]>([]);
  protected readonly preferencePoruka = signal('Učitavanje preferenci...');
  protected ime = '';
  protected prezime = '';
  protected adresa = '';
  protected opis = '';
  protected korime = '';
  protected lozinka = '';
  protected email = '';
  protected odabranePreference: Record<number, boolean> = {};

  async ngOnInit() {
    await this.ucitajPreference();
  }

  async dodajKorisnika() {
    this.poruka.set('');

    if (!this.validirajRegistraciju()) {
      return;
    }

    const odabranePreference = Object.entries(this.odabranePreference)
      .filter(([, odabrano]) => odabrano)
      .map(([id]) => Number.parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));

    const tijelo = {
      ime: this.ime,
      prezime: this.prezime,
      adresa: this.adresa,
      opis: this.opis,
      lozinka: this.lozinka,
      email: this.email,
      korime: this.korime,
      aktivacijskiKod: -1,
      TOTPkljuc: '',
      preference: odabranePreference,
    };

    try {
      const odgovor = await this.korisniciService.registrirajKorisnika(tijelo);
      if (odgovor.ok) {
        const payload: any = odgovor.data ?? null;
        if (payload?.mailPoslan === false && payload?.aktivacijskiUrl) {
          this.poruka.set(
            `Korisnik dodan, ali mail nije poslan. Aktivirajte racun ovdje: <a href='${payload.aktivacijskiUrl}'>aktivacija</a>.`
          );
        } else {
          this.poruka.set('Korisnik dodan! Provjerite email za aktivaciju.');
        }
        this.resetForm();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const greskaTekst =
        odgovor.error ||
        (typeof odgovor.data === 'string' ? odgovor.data : '') ||
        '';
      this.poruka.set(`${odgovor.status}<br>${greskaTekst}`);
    } catch {
      this.poruka.set('Registracija trenutno nije dostupna.');
    }
  }

  private validirajRegistraciju() {
    const korimeRegex = /^[A-Za-z0-9._-]{3,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const korime = this.korime.trim();
    const email = this.email.trim();
    const lozinka = this.lozinka;

    if (!korimeRegex.test(korime)) {
      this.poruka.set(
        'Korisnicko ime mora imati od 3 do 20 znakova koji su slova, brojevi, . _ -'
      );
      return false;
    }

    if (!emailRegex.test(email)) {
      this.poruka.set('Email nije u ispravnom formatu.');
      return false;
    }

    if (!lozinka || lozinka.length < 1) {
      this.poruka.set('Lozinku je potrebno unijeti.');
      return false;
    }

    return true;
  }

  private async ucitajPreference() {
    try {
      const odgovor = await this.preferenceService.getPreference();
      const preference = Array.isArray(odgovor.data) ? odgovor.data : [];

      if (!preference.length) {
        this.preferencePoruka.set('Preference nisu dostupne.');
        this.preference.set([]);
        return;
      }
      this.preference.set(preference);
      this.preferencePoruka.set('');
    } catch {
      this.preference.set([]);
      this.preferencePoruka.set('Preference nije moguce ucitati.');
    }
  }

  private resetForm() {
    this.ime = '';
    this.prezime = '';
    this.adresa = '';
    this.opis = '';
    this.korime = '';
    this.lozinka = '';
    this.email = '';
    this.odabranePreference = {};
  }
}
