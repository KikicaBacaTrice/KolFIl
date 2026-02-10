import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { KorisnikI } from '../../servisI/korisniciI';
import { KolekcijaI } from '../../servisI/kolekcijeI';
import { AuthService } from '../../servisI/auth.service';
import { KolekcijeService } from '../../servisI/kolekcije.service';
import { KorisniciService } from '../../servisI/korisnici.service';

const ADMIN_ID = 1;
const KORISNIK_ID = 2;
const MODERATOR_ID = 3;
const DOZVOLJENE_ULOGE = [
  { id: MODERATOR_ID, naziv: 'Moderator' },
  { id: KORISNIK_ID, naziv: 'Korisnik' },
];

@Component({
  selector: 'app-upravljanje-korisnicima',
  imports: [NgFor, NgIf, CommonModule],
  templateUrl: './upravljanje-korisnicima.html',
  styleUrl: './upravljanje-korisnicima.scss',
})
export class UpravljanjeKorisnicima implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly kolekcijeService = inject(KolekcijeService);
  private readonly korisniciService = inject(KorisniciService);
  protected readonly korisnici = signal<KorisnikI[]>([]);
  protected readonly kolekcije = signal<KolekcijaI[]>([]);
  protected readonly poruka = signal('');
  protected readonly porukaKlasa = signal<'uspjeh' | 'greska' | ''>('');
  protected readonly tipKorisnikaId = signal<number | null>(null);
  protected readonly dozvoljeneUloge = DOZVOLJENE_ULOGE;
  private readonly ulogaAzurira = signal<Set<string>>(new Set());
  private readonly blokadaAzurira = signal<Set<string>>(new Set());
  private readonly brisanjeAzurira = signal<Set<string>>(new Set());
  private readonly dodavanjeAzurira = signal<Set<number>>(new Set());

  async ngOnInit() {
    await this.ucitajSesiju();
    await this.ucitajKolekcije();
    await this.ucitajKorisnike();
  }

  protected jeAdmin() {
    return this.tipKorisnikaId() === ADMIN_ID;
  }

  protected prikaziImePrezime(korisnik: KorisnikI) {
    const ime = korisnik.ime || '';
    const prezime = korisnik.prezime || '';
    const spojeno = `${ime} ${prezime}`.trim();
    return spojeno || '-';
  }

  protected oznaciBlokiran(korisnik: KorisnikI) {
    return this.jeAdmin() && korisnik.racunBlokiran;
  }

  protected jeUlogaAzuriranje(korime: string) {
    return this.ulogaAzurira().has(korime);
  }

  protected jeBlokadaAzuriranje(korime: string) {
    return this.blokadaAzurira().has(korime);
  }

  protected jeBrisanjeAzuriranje(korime: string) {
    return this.brisanjeAzurira().has(korime);
  }

  protected jeDodavanjeAzuriranje(korisnikId?: number) {
    if (!Number.isInteger(korisnikId)) {
      return false;
    }
    return this.dodavanjeAzurira().has(korisnikId as number);
  }

  protected async promijeniUlogu(korisnik: KorisnikI, tipId: number) {
    if (!korisnik?.korime) {
      return;
    }
    this.postaviPoruku('');
    this.oznaciAkciju(this.ulogaAzurira, korisnik.korime, true);
    try {
      const odgovor = await this.korisniciService.postaviTip(
        korisnik.korime,
        tipId
      );
      if (!odgovor.ok) {
        throw new Error(odgovor.error || 'Nije moguce azurirati ulogu.');
      }
      await this.ucitajKorisnike();
      this.postaviPoruku('Uloga je azurirana.', 'uspjeh');
    } catch {
      this.postaviPoruku('Promjena uloge nije uspjela.', 'greska');
    } finally {
      this.oznaciAkciju(this.ulogaAzurira, korisnik.korime, false);
    }
  }

  protected async promijeniBlokadu(korisnik: KorisnikI) {
    if (!korisnik?.korime) {
      return;
    }
    const novaVrijednost = !korisnik.racunBlokiran;
    this.postaviPoruku('');
    this.oznaciAkciju(this.blokadaAzurira, korisnik.korime, true);
    try {
      const odgovor = await this.korisniciService.postaviBlokadu(
        korisnik.korime,
        novaVrijednost
      );
      if (!odgovor.ok) {
        throw new Error(odgovor.error || 'Nije moguce promijeniti blokadu.');
      }
      await this.ucitajKorisnike();
      this.postaviPoruku('Status blokade je azuriran.', 'uspjeh');
    } catch {
      this.postaviPoruku('Promjena blokiranja nije uspjela.', 'greska');
    } finally {
      this.oznaciAkciju(this.blokadaAzurira, korisnik.korime, false);
    }
  }

  protected potvrdiBrisanje(korisnik: KorisnikI) {
    if (!korisnik?.korime) {
      return;
    }
    const potvrda = confirm(
      `Obrisati korisnika ${korisnik.korime}? Ova akcija se ne moze ponistiti.`
    );
    if (!potvrda) {
      return;
    }
    void this.obrisiKorisnika(korisnik.korime);
  }

  protected async dodajUKolekciju(korisnik: KorisnikI, kolekcijaIdRaw: string) {
    const korisnikId = korisnik?.id;
    const kolekcijaId = Number(kolekcijaIdRaw);
    if (!Number.isInteger(korisnikId) || !Number.isInteger(kolekcijaId)) {
      return;
    }
    this.postaviPoruku('');
    this.oznaciAkciju(this.dodavanjeAzurira, korisnikId as number, true);
    try {
      await this.dodajKorisnikaUKolekciju(korisnikId as number, kolekcijaId);
      this.postaviPoruku(
        `Korisnik ${korisnik.korime} dodan u kolekciju ${kolekcijaId}.`,
        'uspjeh'
      );
      await this.ucitajKorisnike();
    } catch {
      this.postaviPoruku(
        'Dodavanje korisnika u kolekciju nije uspjelo.',
        'greska'
      );
    } finally {
      this.oznaciAkciju(this.dodavanjeAzurira, korisnikId as number, false);
    }
  }

  private async ucitajKolekcije() {
    try {
      const odgovor = await this.kolekcijeService.getSve();
      if (!odgovor.ok) {
        throw new Error('Nije moguce dohvatiti podatke o kolekcijama');
      }
      const podaci = Array.isArray(odgovor.data) ? odgovor.data : [];
      const lista = Array.isArray(podaci) ? podaci : [];
      this.kolekcije.set(lista);
    } catch {
      throw new Error('Greska pri dohvatanu kolekcija');
    }
  }

  private async ucitajKorisnike() {
    try {
      const odgovor = await this.korisniciService.getKorisnici();
      if (!odgovor.ok) {
        throw new Error('Nije moguce dohvatiti podatke o korisnicima');
      }
      const podaci = Array.isArray(odgovor.data) ? odgovor.data : [];
      const lista = Array.isArray(podaci) ? podaci : [];
      this.korisnici.set(lista);
    } catch {
      throw new Error('Greska pri dohvatanu korisnika');
    }
  }

  private async obrisiKorisnika(korime: string) {
    this.postaviPoruku('');
    this.oznaciAkciju(this.brisanjeAzurira, korime, true);
    try {
      const odgovor = await this.korisniciService.obrisiKorisnika(korime);
      if (!odgovor.ok) {
        throw new Error(odgovor.error || 'Brisanje nije uspjelo.');
      }
      this.postaviPoruku(`Korisnik ${korime} je obrisan.`, 'uspjeh');
      await this.ucitajKorisnike();
    } catch {
      this.postaviPoruku('Brisanje korisnika nije uspjelo.', 'greska');
    } finally {
      this.oznaciAkciju(this.brisanjeAzurira, korime, false);
    }
  }

  private async dodajKorisnikaUKolekciju(
    korisnikId: number,
    kolekcijaId: number
  ) {
    const odgovor = await this.kolekcijeService.addUser(kolekcijaId, korisnikId);
    if (!odgovor.ok) {
      throw new Error(
        odgovor.error || 'Greska pri dodavanju korisnika u kolekciju'
      );
    }
    return odgovor.data;
  }

  private postaviPoruku(tekst: string, klasa: 'uspjeh' | 'greska' | '' = '') {
    this.poruka.set(tekst || '');
    this.porukaKlasa.set(klasa);
  }

  private async ucitajSesiju() {
    const sesija = await this.authService.getSession();
    this.tipKorisnikaId.set(
      typeof sesija?.tipKorisnikaId === 'number' ? sesija.tipKorisnikaId : null
    );
  }

  private oznaciAkciju<T>(
    spremnik: WritableSignal<Set<T>>,
    kljuc: T,
    aktivno: boolean
  ) {
    const kopija = new Set(spremnik());
    if (aktivno) {
      kopija.add(kljuc);
    } else {
      kopija.delete(kljuc);
    }
    spremnik.set(kopija);
  }

  protected pretvoriUNumber(vrijednost: string) {
    return Number(vrijednost);
  }
}
