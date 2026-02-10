import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { KarticaSadrzaj } from '../../../zajednicko/kartica-sadrzaj/kartica-sadrzaj';
import { KolekcijaI } from '../../../servisI/kolekcijeI';
import { KolekcijeService } from '../../../servisI/kolekcije.service';

type StanjeAnimacije = 'idle' | 'out' | 'in';

@Component({
  selector: 'app-javne-kolekcije',
  imports: [NgIf, NgFor, KarticaSadrzaj],
  templateUrl: './javne-kolekcije.html',
  styleUrl: './javne-kolekcije.scss',
})
export class JavneKolekcije implements OnInit {
  private readonly kolekcijeService = inject(KolekcijeService);
  protected readonly kolekcije = signal<KolekcijaI[]>([]);
  protected readonly greska = signal<string | null>(null);
  protected readonly indeks = signal(0);
  protected readonly animacija = signal<StanjeAnimacije>('idle');
  protected readonly animiraSe = signal(false);

  protected readonly imaKolekcija = computed(() => this.kolekcije().length > 0);
  protected readonly trenutnaKolekcija = computed(() => {
    const lista = this.kolekcije();
    if (!lista.length) {
      return undefined;
    }
    return lista[this.indeks() % lista.length];
  });

  async ngOnInit() {
    try {
      const odgovor = await this.kolekcijeService.getJavne();
      if (!odgovor.ok) {
        throw new Error('Greška u dohvatu javnih kolekcija');
      }
      const podaci = Array.isArray(odgovor.data) ? odgovor.data : [];
      const lista = Array.isArray(podaci) ? podaci : [];
      this.kolekcije.set(lista);
      if (lista.length) {
        this.indeks.set(0);
        this.pokreniAnimaciju('in');
        setTimeout(() => this.pokreniAnimaciju('idle'), 500);
      }
    } catch (greska) {
      this.greska.set('Nema javnih kolekcija');
    }
  }

  protected sljedeca() {
    this.pomakni('next');
  }

  protected prethodna() {
    this.pomakni('prev');
  }

  private pomakni(smjer: 'next' | 'prev') {
    const lista = this.kolekcije();
    if (this.animiraSe() || lista.length < 2) {
      return;
    }

    const trajanje = 500;
    this.animiraSe.set(true);
    this.pokreniAnimaciju('out');

    setTimeout(() => {
      const smjerKretanja = smjer === 'next' ? 1 : -1;
      const noviIndeks =
        (this.indeks() + smjerKretanja + lista.length) % lista.length;
      this.indeks.set(noviIndeks);
      this.pokreniAnimaciju('in');

      setTimeout(() => {
        this.pokreniAnimaciju('idle');
        this.animiraSe.set(false);
      }, trajanje);
    }, trajanje);
  }

  private pokreniAnimaciju(stanje: StanjeAnimacije) {
    this.animacija.set(stanje);
  }
}
