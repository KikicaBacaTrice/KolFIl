import { FilmoviTmdbI, ZanrTmdbI } from "../servisI/tmdbI.js";
import { Request, Response } from "express";
import { TMDBklijent } from "./klijentTMDB.js";
import { RWASession } from "../servisI/korisniciI.js";
import { FilmDAO } from "./filmDAO.js";
export class RestTMDB {
	private tmdbKlijent: TMDBklijent;
	private fdao: FilmDAO;

	constructor(api_kljuc: string) {
		this.tmdbKlijent = new TMDBklijent(api_kljuc);
		this.fdao = new FilmDAO();

		this.tmdbKlijent.dohvatiFilm(500).then((podaci: any) => {
			if (podaci.status_code == 7) {
				console.log("Servis TMDB ne vraća podatke. Provjerite API ključ!");
			} else {
				console.log("Servis TMDB vraća podatke!");
			}
		});
	}

	getZanr(zahtjev: Request, odgovor: Response) {
		this.tmdbKlijent
			.dohvatiZanrove()
			.then((zanrovi: Array<ZanrTmdbI>) => {
				odgovor.type("application/json");
				odgovor.json(zanrovi);
			})
			.catch(() => {
				odgovor.status(500);
				odgovor.json({ greska: "greska na serveru" });
			});
	}

	async postZanrUBazu(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		try {
			const zanrovi = await this.tmdbKlijent.dohvatiZanrove();
			const broj = await this.fdao.spremiZanrove(zanrovi);
			odgovor.json({ uspjeh: true, dodano: broj });
		} catch (greska: any) {
			odgovor.status(500);
			odgovor.json({
				greska: "greska na serveru",
			});
		}
	}

	getFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const idParam = zahtjev.params["id"];
		const id = Number(idParam);
		if (!Number.isInteger(id)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		this.tmdbKlijent
			.dohvatiFilm(id)
			.then((film: any) => {
				odgovor.type("application/json");
				odgovor.json(film);
			})
			.catch((greska) => {
				odgovor.status(500);
				odgovor.json({ greska: "greska na serveru" });
			});
	}

	getFilmovi(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}

		let stranica = zahtjev.query["stranica"];
		let trazi = zahtjev.query["trazi"];

		if (
			stranica == null ||
			trazi == null ||
			typeof stranica != "string" ||
			typeof trazi != "string"
		) {
			odgovor.status(400);
			odgovor.send({ greska: "neispravni podaci" });
			return;
		}

		this.tmdbKlijent
			.pretraziFilmovePoNazivu(trazi, parseInt(stranica))
			.then((filmovi: FilmoviTmdbI) => {
				odgovor.send(filmovi);
			})
			.catch(() => {
				odgovor.status(500);
				odgovor.json({ greska: "greska na serveru" });
			});
	}

	dohvatiNasumceFilm(zahtjev: Request, odgovor: Response) {
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		let odabranaStranica = zahtjev.query["stranica"];
		let trazi = zahtjev.query["trazi"];
		let stranica =
			typeof odabranaStranica === "string"
				? parseInt(odabranaStranica)
				: undefined;
		if (Number.isNaN(stranica)) {
			stranica = undefined;
		}
		let tekstTrazi = typeof trazi === "string" ? trazi.trim() : undefined;
		let selekcijaUpit =
			tekstTrazi && tekstTrazi.length > 0
				? this.tmdbKlijent.pretraziFilmovePoNazivu(tekstTrazi, stranica || 1)
				: this.tmdbKlijent.dohvatiNasumicneAnimirane(stranica);

		selekcijaUpit
			.then((filmovi: FilmoviTmdbI) => {
				odgovor.type("application/json");
				odgovor.json(filmovi);
			})
			.catch(() => {
				odgovor.status(500);
				odgovor.json({ greska: "greska na serveru" });
			});
	}

	getTopAnimirani(zahtjev: Request, odgovor: Response) {
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		this.tmdbKlijent
			.dohvatiTopAnimirane(10)
			.then((filmovi: FilmoviTmdbI) => {
				odgovor.type("application/json");
				odgovor.json(filmovi);
			})
			.catch(() => {
				odgovor.status(500);
				odgovor.json({ greska: "greska na serveru" });
			});
	}

	getNajboljeOcijenjeniAnimirani(zahtjev: Request, odgovor: Response) {
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		this.tmdbKlijent
			.dohvatiNajboljeOcijenjeneAnimirne(10)
			.then((filmovi: FilmoviTmdbI) => {
				odgovor.type("application/json");
				odgovor.json(filmovi);
			})
			.catch((greska) => {
				odgovor.status(500);
				odgovor.json({ greska: "greska na serveru" });
			});
	}

	private provjeriPrijavu(zahtjev: Request, odgovor: Response): boolean {
		const sesija = zahtjev.session as RWASession | undefined;
		if (!sesija?.korime) {
			odgovor.status(403);
			odgovor.json({ greska: "zabranjen pristup" });
			return false;
		}
		return true;
	}
}
