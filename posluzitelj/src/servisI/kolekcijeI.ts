export interface KolekcijaI {
	id: number;
	naziv: string;
	opis?: string | null;
	slikaKolekcija: string;
	kolekcijaJavna?: boolean;
	brojFilmova: number;
}

export interface FilmKolekcijaI {
	id: number;
	naziv: string;
	datumPremijere: string;
	opis?: string | null;
	posterSlika: string | null;
}

export interface KorisnikKolekcijaI {
	id: number;
	korime: string;
}

export interface KolekcijaDetaljiI extends KolekcijaI {
	filmovi: Array<FilmKolekcijaI>;
	korisnici: Array<KorisnikKolekcijaI>;
}
