import { Component, inject, OnInit, signal } from '@angular/core';
import { JavneKolekcije } from '../javne-kolekcije/javne-kolekcije';
import { JavniFilmovi } from '../javni-filmovi/javni-filmovi';
import { NajboljeOcjenjeni } from '../najbolje-ocijenjeni/najbolje-ocijenjeni';
import { CommonModule, NgIf } from '@angular/common';
import { IstraziFilmove } from '../istrazi-filmove/istrazi-filmove';
import { AuthService } from '../../../servisI/auth.service';

@Component({
  selector: 'app-pocetna',
  imports: [
    JavneKolekcije,
    JavniFilmovi,
    NajboljeOcjenjeni,
    NgIf,
    CommonModule,
    IstraziFilmove,
  ],
  templateUrl: './pocetna.html',
  styleUrl: './pocetna.scss',
})
export class Pocetna implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly prijavljen = signal(false);

  async ngOnInit() {
    await this.ucitajSesiju();
  }

  protected jePrijavljen() {
    return this.prijavljen();
  }

  private async ucitajSesiju() {
    const sesija = await this.auth.getSession();
    this.prijavljen.set(Boolean(sesija?.korime));
  }
}
