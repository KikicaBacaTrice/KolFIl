import { Session } from "express-session";

export interface KorisnikI {
	id?: number;
	ime: string;
	prezime: string;
	adresa: string;
	opis: string;
	korime: string;
	lozinka: string | null;
	email: string;
	racunBlokiran: boolean;
	tipKorisnikaId: number;
	tipKorisnikaNaziv: string;
	aktivan?: boolean | null;
	aktivacijskiKod?: string | null;
	preference?: Array<PreferenceI>;
	kolekcije?: Array<KorisnickaKolekcijaI>;
}

export interface PreferenceI {
	id: number;
	naziv: string;
	opis: string;
}

export interface KorisnickaKolekcijaI {
	id: number;
	naziv: string;
	opis?: string | null;
	slikaKolekcije?: string | null;
	brojFilmova: number;
}

export interface RWASession extends Session {
	korisnik: string | null;
	korime: string;
	tipKorisnikaId: number | null;
}
