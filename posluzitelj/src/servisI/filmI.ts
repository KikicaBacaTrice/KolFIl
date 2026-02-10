export interface FilmI {
	id: number;
	naziv: string;
	opis: string;
	datumPremijere: string;
	popularnost: number | null;
	prosjecnaOcjena: number | null;
	brojGlasova: number | null;
	filmJavan: boolean;
	autor: string | null;
	posterSlika: string | null;
	bannerSlika: string | null;
	video: string | null;
}

export interface FilmDetaljiI extends FilmI {
	zanrovi: Array<ZanrI>;
	kolekcije: Array<UnutarKolekcijaI>;
}

export interface FilmUnosI {
	naziv: string;
	opis: string;
	datumPremijere: string;
	popularnost?: number | null;
	prosjecnaOcjena?: number | null;
	brojGlasova?: number | null;
	filmJavan?: boolean;
	autor?: string | null;
	posterSlika?: string | null;
	bannerSlika?: string | null;
	video?: string | null;
	zanroviIds?: Array<number>;
}

export interface ZanrI {
	id: number;
	naziv: string;
	opis: string | null;
}

export interface UnutarKolekcijaI {
	id: number;
	naziv: string;
	slikaKolekcije: string | null;
}
