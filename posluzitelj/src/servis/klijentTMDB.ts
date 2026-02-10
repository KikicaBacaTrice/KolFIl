import { FilmoviTmdbI, ZanrTmdbI } from "../servisI/tmdbI.js";

export class TMDBklijent {
	private bazicniURL = "https://api.themoviedb.org/3";
	private apiKljuc: string;
	private animiraniZanrId = 16;
	private dopusteniJezik = "en";

	constructor(apiKljuc: string) {
		this.apiKljuc = apiKljuc;
	}

	public async dohvatiZanrove() {
		let resurs = "/genre/movie/list";
		let odgovor = await this.obaviZahtjev(resurs);
		return JSON.parse(odgovor).genres as Array<ZanrTmdbI>;
	}

	public async dohvatiFilm(id: number) {
		let resurs = "/movie/" + id;
		let odgovor = await this.obaviZahtjev(resurs);
		return JSON.parse(odgovor) as FilmoviTmdbI;
	}

	public async pretraziFilmovePoNazivu(trazi: string, stranica: number) {
		let resurs = "/search/movie";
		let parametri = {
			sort_by: "popularity.desc",
			include_adult: false,
			page: stranica,
			query: trazi,
		};

		let odgovor = await this.obaviZahtjev(resurs, parametri);
		let rez = JSON.parse(odgovor) as FilmoviTmdbI;
		let filtrirani = (rez.results || []).filter((film) => {
			const filmPodaci = film;
			const zanrovi = Array.isArray(filmPodaci?.genre_ids)
				? filmPodaci.genre_ids
				: Array.isArray(filmPodaci?.genres)
				? filmPodaci.genres.map((z) => z.id)
				: [];
			const jeAnimirani = zanrovi.includes(this.animiraniZanrId);
			return jeAnimirani;
		});
		rez.results = filtrirani;
		rez.total_results = filtrirani.length;
		rez.total_pages =
			filtrirani.length > 0
				? Math.max(1, Math.ceil(filtrirani.length / 20))
				: 0;
		rez.page = filtrirani.length > 0 ? 1 : 0;
		return rez;
	}

	public async dohvatiTopAnimirane(limit: number = 10) {
		let parametri = {
			sort_by: "popularity.desc",
			include_adult: false,
			page: 1,
			with_genres: this.animiraniZanrId,
			with_original_language: this.dopusteniJezik,
		};
		let odgovor = await this.obaviZahtjev("/discover/movie", parametri);
		let rez = JSON.parse(odgovor) as FilmoviTmdbI;
		rez.results = rez.results.slice(0, limit);
		rez.total_pages = 1;
		rez.total_results = rez.results.length;
		return rez;
	}

	public async dohvatiNajboljeOcijenjeneAnimirne(limit: number = 10) {
		let parametri = {
			sort_by: "vote_average.desc",
			include_adult: false,
			page: 1,
			with_genres: this.animiraniZanrId,
			with_original_language: this.dopusteniJezik,
			"vote_count.gte": 1000,
		};
		let odgovor = await this.obaviZahtjev("/discover/movie", parametri);
		let rez = JSON.parse(odgovor) as FilmoviTmdbI;
		rez.results = rez.results.slice(0, limit);
		rez.total_pages = 1;
		rez.total_results = rez.results.length;
		return rez;
	}

	public async dohvatiNasumicneAnimirane(stranica?: number) {
		let odabranaStranica =
			stranica && stranica > 0 ? stranica : this.dajNasumceStranicu(100);
		let parametri = {
			sort_by: "popularity.desc",
			include_adult: false,
			page: odabranaStranica,
			with_genres: this.animiraniZanrId,
			with_original_language: this.dopusteniJezik,
		};
		let odgovor = await this.obaviZahtjev("/discover/movie", parametri);
		let rez = JSON.parse(odgovor) as FilmoviTmdbI;
		rez.results = this.promijesaj(rez.results);
		return rez;
	}

	private promijesaj<T>(lista: Array<T>): Array<T> {
		let kopija = [...lista];
		for (let i = kopija.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			let lijevi = kopija[i];
			let desni = kopija[j];
			if (lijevi === undefined || desni === undefined) {
				continue;
			}
			kopija[i] = desni;
			kopija[j] = lijevi;
		}
		return kopija;
	}

	private dajNasumceStranicu(maxStranica: number) {
		return Math.floor(Math.random() * maxStranica) + 1;
	}

	private async obaviZahtjev(
		resurs: string,
		parametri: { [kljuc: string]: string | number | boolean } = {}
	) {
		let zahtjev = this.bazicniURL + resurs + "?api_key=" + this.apiKljuc;
		for (let p in parametri) {
			zahtjev += "&" + p + "=" + parametri[p];
		}
		console.log(zahtjev);
		let odgovor = await fetch(zahtjev);
		let rezultat = await odgovor.text();
		return rezultat;
	}
}
