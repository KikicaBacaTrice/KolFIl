import { CanActivateFn, Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Pocetna } from './stranice/pocetna-stranica/pocetna/pocetna';
import { Prijava } from './stranice/prijava/prijava';
import { Registracija } from './stranice/registracija/registracija';
import { Dokumentacija } from './stranice/dokumentacija/dokumentacija';
import { DodajFilm } from './stranice/dodaj-film/dodaj-film';
import { DodajKolekciju } from './stranice/dodaj-kolekciju/dodaj-kolekciju';
import { DetaljiFilma } from './stranice/detalji-filma/detalji-filma';
import { DetaljiKolekcije } from './stranice/detalji-kolekcije/detalji-kolekcije';
import { UpravljanjeKorisnicima } from './stranice/upravljanje-korisnicima/upravljanje-korisnicima';
import { Profil } from './stranice/profil/profil';
import { SviJavniFilmovi } from './stranice/svi-javni-filmovi/svi-javni-filmovi';
import { SviJavniFilmoviFiltriranje } from './stranice/svi-javni-filmovi-filtriranje/svi-javni-filmovi-filtriranje';
import { AuthService } from './servisI/auth.service';

type SesijaI = {
  korime?: string | null;
  tipKorisnikaId?: number | null;
};

const ucitajSesiju = async (): Promise<SesijaI | null> => {
  const auth = inject(AuthService);
  return await auth.getSession();
};

const zahtijevaPrijavu: CanActivateFn = async () => {
  const router = inject(Router);
  const sesija = await ucitajSesiju();
  if (!sesija?.korime) {
    return router.createUrlTree(['/']);
  }
  return true;
};

const zahtijevaAdminaIliModeratora: CanActivateFn = async () => {
  const router = inject(Router);
  const sesija = await ucitajSesiju();
  const tip = sesija?.tipKorisnikaId;
  if (!sesija?.korime) {
    return router.createUrlTree(['/']);
  }
  if (tip !== 1 && tip !== 3) {
    return router.createUrlTree(['/']);
  }
  return true;
};

export const routes: Routes = [
  { path: '', component: Pocetna, pathMatch: 'full' },
  { path: 'prijava', component: Prijava },
  { path: 'registracija', component: Registracija },
  { path: 'dokumentacija', component: Dokumentacija },
  {
    path: 'detaljiFilma/:id',
    component: DetaljiFilma,
    canActivate: [zahtijevaPrijavu],
  },
  {
    path: 'detaljiFilma/tmdb/:id',
    component: DetaljiFilma,
    data: { izvor: 'tmdb' },
    canActivate: [zahtijevaPrijavu],
  },
  {
    path: 'detaljiKolekcije/:id',
    component: DetaljiKolekcije,
    canActivate: [zahtijevaPrijavu],
  },
  {
    path: 'upravljanjeKorisnicima',
    component: UpravljanjeKorisnicima,
    canActivate: [zahtijevaAdminaIliModeratora],
  },
  { path: 'dodajFilm', component: DodajFilm, canActivate: [zahtijevaPrijavu] },
  {
    path: 'dodajKolekciju',
    component: DodajKolekciju,
    canActivate: [zahtijevaAdminaIliModeratora],
  },
  {
    path: 'sviJavniFilmovi',
    component: SviJavniFilmovi,
    canActivate: [zahtijevaPrijavu],
  },
  {
    path: 'sviJavniFilmoviFiltriranje',
    component: SviJavniFilmoviFiltriranje,
    canActivate: [zahtijevaPrijavu],
  },
  {
    path: 'profil',
    component: Profil,
    canActivate: [zahtijevaPrijavu],
  },
];
