import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servisI/auth.service';

@Component({
  selector: 'app-navigacija',
  imports: [NgIf, CommonModule, RouterLink],
  templateUrl: './navigacija.html',
  styleUrl: './navigacija.scss',
})
export class Navigacija implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly korime = signal<string | null>(null);
  protected readonly tipKorisnikaId = signal<number | null>(null);

  async ngOnInit() {
    await this.ucitajSesiju();
  }

  protected jePrijavljen() {
    return Boolean(this.korime());
  }

  protected jeAdminIliModerator() {
    const tip = this.tipKorisnikaId();
    return tip === 1 || tip === 3;
  }

  protected async odjava(event: Event) {
    event.preventDefault();
    try {
      await this.auth.logout();
    } finally {
      this.korime.set(null);
      this.tipKorisnikaId.set(null);
      window.location.href = '/';
    }
  }

  private async ucitajSesiju() {
    const sesija = await this.auth.getSession();
    this.korime.set(sesija?.korime ?? null);
    this.tipKorisnikaId.set(
      typeof sesija?.tipKorisnikaId === 'number' ? sesija.tipKorisnikaId : null
    );
  }
}
