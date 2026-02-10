import { Component, Input } from '@angular/core';
import { KolekcijaI } from '../../servisI/kolekcijeI';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kartica-sadrzaj',
  imports: [RouterLink],
  templateUrl: './kartica-sadrzaj.html',
  styleUrl: './kartica-sadrzaj.scss',
})
export class KarticaSadrzaj {
  @Input() kolekcija?: KolekcijaI;
  private readonly slikaOsnova = '.png';
  private readonly fallbackSlika = '/slike/NemaPosterKolekcije.png';

  protected brojFilmova() {
    return this.kolekcija?.brojFilmova ?? 0;
  }

  protected pozadina() {
    const slika = this.kolekcija?.slikaKolekcija ?? '';
    if (!slika || !this.jeTmdbSlika(slika)) {
      return `url('${this.fallbackSlika}')`;
    }
    return `url('slike/kolekcije/${slika}')`;
  }

  private jeTmdbSlika(slika: string) {
    return slika.endsWith(this.slikaOsnova);
  }
}
