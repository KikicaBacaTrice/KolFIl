import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servisI/auth.service';

@Component({
  selector: 'app-prijava',
  imports: [RouterLink, FormsModule],
  templateUrl: './prijava.html',
  styleUrl: './prijava.scss',
})
export class Prijava {
  private readonly auth = inject(AuthService);
  protected readonly poruka = signal('');
  protected korime = '';
  protected lozinka = '';

  constructor(private readonly router: Router) {}

  async prijaviKorisnika() {
    this.poruka.set('');

    if (!this.validirajPrijavu()) {
      return;
    }

    const korime = this.korime;
    const lozinka = this.lozinka;

    try {
      const odgovor = await this.auth.login(korime, lozinka);
      if (odgovor.ok) {
        window.location.href = '/';
        return;
      }

      if (odgovor.status === 404) {
        this.poruka.set('Korisnicko ime ne smije biti prazno.');
      } else {
        this.poruka.set(odgovor.error || 'Doslo je do greske.');
      }
    } catch {
      this.poruka.set('Prijava trenutno nije dostupna.');
    }
  }

  private validirajPrijavu() {
    const korime = this.korime.trim();
    const lozinka = this.lozinka;
    const regex = /^[A-Za-z0-9._-]{3,20}$/;

    if (!regex.test(korime)) {
      this.poruka.set(
        'Korisnicko ime mora imati od 3 do 20 znakova koji su slova, brojevi, . _ -'
      );
      return false;
    }

    if (!lozinka || lozinka.length < 1) {
      this.poruka.set('Lozinku je potrebno unijeti.');
      return false;
    }

    return true;
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
