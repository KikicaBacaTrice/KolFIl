import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KolekcijeService } from '../../servisI/kolekcije.service';

@Component({
  selector: 'app-dodaj-kolekciju',
  imports: [RouterLink, FormsModule],
  templateUrl: './dodaj-kolekciju.html',
  styleUrl: './dodaj-kolekciju.scss',
})
export class DodajKolekciju {
  private readonly kolekcijeService = inject(KolekcijeService);
  protected readonly poruka = signal('');
  protected readonly spremanje = signal(false);
  protected naziv = '';
  protected opis = '';
  protected kolekcijaJavna = true;

  protected async spremiKolekciju() {
    if (this.spremanje()) {
      return;
    }

    this.poruka.set('');
    const naziv = this.naziv.trim();

    if (!naziv) {
      this.poruka.set('Naziv kolekcije je obavezan.');
      return;
    }

    const tijelo = {
      naziv,
      opis: this.procistiTekst(this.opis),
      slikaKolekcije: '',
      kolekcijaJavna: this.kolekcijaJavna,
    };

    this.spremanje.set(true);
    try {
      const odgovor = await this.kolekcijeService.createKolekcija(tijelo);
      if (odgovor.ok) {
        this.poruka.set('Kolekcija je uspjesno dodana.');
        this.resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const greskaTekst =
        odgovor.error ||
        (typeof odgovor.data === 'string' ? odgovor.data : '') ||
        'Dodavanje nije uspjelo.';
      this.poruka.set(`Greska (${odgovor.status}): ${greskaTekst}`);
    } catch {
      this.poruka.set('Greška pri spremanju kolekcije.');
    } finally {
      this.spremanje.set(false);
    }
  }

  private procistiTekst(vrijednost: string) {
    const trimmed = vrijednost.trim();
    return trimmed ? trimmed : null;
  }

  private resetForm() {
    this.naziv = '';
    this.opis = '';
    this.kolekcijaJavna = true;
  }
}
