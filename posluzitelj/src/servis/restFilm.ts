import { Request, Response } from "express";
import { FilmDAO } from "./filmDAO.js";
import { FilmUnosI } from "../servisI/filmI.js";
import { RWASession } from "../servisI/korisniciI.js";

export class RestFilm {
	private fdao: FilmDAO;

	constructor() {
		this.fdao = new FilmDAO();
	}

	async getJavniFilmovi(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		const max =
			typeof zahtjev.query["limit"] === "string"
				? parseInt(zahtjev.query["limit"])
				: 10;
		try {
			const filmovi = await this.fdao.dajJavneFilmove(
				Number.isInteger(max) && max > 0 ? max : 10
			);
			const filmoviSaZanrovima = await Promise.all(
				filmovi.map(async (film) => ({
					...film,
					zanrovi: await this.fdao.dajZanroveZaFilma(film.id),
				}))
			);
			odgovor.json(filmoviSaZanrovima);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async getSveJavneFilmove(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		try {
			const filter: { samoJavni?: boolean; trazi?: string } = {
				samoJavni: true,
				trazi: "",
			};
			const filmovi = await this.fdao.dajFilmove(filter);
			odgovor.json(filmovi);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async getFilmove(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const samoJavni = this.parsirajBoolQuery(
			zahtjev.query["samoJavni"] ?? zahtjev.query["javni"]
		);
		const trazi =
			typeof zahtjev.query["trazi"] === "string"
				? zahtjev.query["trazi"]
				: undefined;
		const filter: { samoJavni?: boolean; trazi?: string } = {};
		if (samoJavni !== undefined) {
			filter.samoJavni = samoJavni;
		}
		if (trazi !== undefined) {
			filter.trazi = trazi;
		}
		try {
			const filmovi = await this.fdao.dajFilmove(filter);
			odgovor.json(filmovi);
		} catch (greska) {
			odgovor.status(500).json({ greska: "greska na serveru" });
		}
	}

	async getJavneFilmoveFilter(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const trazi =
			typeof zahtjev.query["trazi"] === "string"
				? zahtjev.query["trazi"]
				: undefined;
		const filterOcjenaDolje = this.parsirajDecimalQuery(
			zahtjev.query["filtrirajPoOcjeniDolje"]
		);
		const filterOcjenaGore = this.parsirajDecimalQuery(
			zahtjev.query["filtrirajPoOcjeniGore"]
		);
		const sortirajGlasove =
			typeof zahtjev.query["sortirajPoBrojuGlasova"] === "string"
				? zahtjev.query["sortirajPoBrojuGlasova"].toLowerCase()
				: undefined;
		const sortirajDatumPremijere =
			typeof zahtjev.query["sortirajPoDatumuPremijere"] === "string"
				? zahtjev.query["sortirajPoDatumuPremijere"].toLowerCase()
				: undefined;
		const filter: {
			trazi?: string;
			filtrirajPoOcjeniDolje?: number;
			filtrirajPoOcjeniGore?: number;
			sortirajPoDatumuPremijere?: "asc" | "desc";
			sortirajPoBrojuGlasova?: "asc" | "desc";
		} = {};
		if (trazi !== undefined) {
			filter.trazi = trazi;
		}
		if (filterOcjenaDolje !== undefined) {
			filter.filtrirajPoOcjeniDolje = filterOcjenaDolje;
		}
		if (filterOcjenaGore !== undefined) {
			filter.filtrirajPoOcjeniGore = filterOcjenaGore;
		}
		if (sortirajGlasove === "asc" || sortirajGlasove === "desc") {
			filter.sortirajPoBrojuGlasova = sortirajGlasove;
		}
		if (sortirajDatumPremijere === "asc" || sortirajDatumPremijere === "desc") {
			filter.sortirajPoDatumuPremijere = sortirajDatumPremijere;
		}

		try {
			const filmovi = await this.fdao.dajJavneFilmoveFilter(filter);
			odgovor.status(200);
			odgovor.json(filmovi);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async getFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const id = Number(zahtjev.params["id"]);
		if (!Number.isInteger(id)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const film = await this.fdao.dajFilm(id);
			if (!film) {
				odgovor.status(404);
				odgovor.json({ greska: "nepostojeci resusrs" });
				return;
			}
			odgovor.json(film);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async getFilmPoNazivuIDatumu(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const naziv =
			typeof zahtjev.query["naziv"] === "string"
				? zahtjev.query["naziv"]
				: undefined;
		const datum =
			typeof zahtjev.query["datumPremijere"] === "string"
				? zahtjev.query["datumPremijere"]
				: typeof zahtjev.query["datum"] === "string"
				? zahtjev.query["datum"]
				: undefined;
		if (!naziv || !datum) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const film = await this.fdao.dajFilmPoNazivuIDatumu(naziv, datum);
			if (!film) {
				odgovor.status(404).json({ greska: "nepostojeci resurs" });
				return;
			}
			odgovor.json(film);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async postFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const podaci = this.dohvatiPodatkeFilma(zahtjev.body);
		if (!podaci.naziv || !podaci.opis || !podaci.datumPremijere) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const id = await this.fdao.kreirajFilm(podaci as FilmUnosI);
			const film = await this.fdao.dajFilm(id);
			odgovor.status(201);
			odgovor.json(film ?? { id });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async putFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const id = Number(zahtjev.params["id"]);
		if (!Number.isInteger(id)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		const podaci = this.dohvatiPodatkeFilma(zahtjev.body);
		try {
			const azurirano = await this.fdao.azurirajFilm(id, podaci);
			if (!azurirano) {
				odgovor.status(404);
				odgovor.json({ greska: "nepostojeci resurs" });
				return;
			}
			odgovor.json({ uspjeh: true });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
			return;
		}
	}

	async deleteFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const id = Number(zahtjev.params["id"]);
		if (!Number.isInteger(id)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const obrisano = await this.fdao.obrisiFilm(id);
			if (!obrisano) {
				odgovor.status(404);
				odgovor.json({ greska: "nepostojeci resurs" });
				return;
			}
			odgovor.json({ uspjeh: true });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async postFilmKolekcija(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const filmId = Number(zahtjev.params["id"]);
		const kolekcijaId = Number(zahtjev.body?.kolekcijaId);
		if (!Number.isInteger(filmId) || !Number.isInteger(kolekcijaId)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const dodano = await this.fdao.dodajFilmUKolekciju(filmId, kolekcijaId);
			odgovor.status(dodano ? 201 : 200);
			odgovor.json({
				uspjeh: true,
				poruka: dodano
					? "Film je dodan u kolekciju"
					: "Film je već član kolekcije",
			});
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({
				greska: "greska na serveru",
			});
		}
	}

	async deleteFilmKolekcija(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		const filmId = Number(zahtjev.params["id"]);
		const kolekcijaId = Number(
			zahtjev.params["kolekcijaId"] ?? zahtjev.body?.kolekcijaId
		);
		if (!Number.isInteger(filmId) || !Number.isInteger(kolekcijaId)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const obrisano = await this.fdao.makniFilmIzKolekcija(
				filmId,
				kolekcijaId
			);
			if (!obrisano) {
				odgovor.status(404);
				odgovor.json({
					greska: "nepostojeci resurs",
				});
				return;
			}
			odgovor.json({ uspjeh: true });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({
				greska: "greska na serveru",
			});
		}
	}

	async getZanorovi(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavljenogKorisnika(zahtjev, odgovor)) {
			return;
		}
		try {
			const zanrovi = await this.fdao.dajSveZanrove();
			odgovor.json(zanrovi);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({
				greska: "greska na serveru",
			});
		}
	}

	private dohvatiPodatkeFilma(body: any): Partial<FilmUnosI> {
		const podaci: Partial<FilmUnosI> = {};
		if (typeof body.naziv === "string") podaci.naziv = body.naziv;
		if (typeof body.opis === "string") podaci.opis = body.opis;
		if (typeof body.datumPremijere === "string")
			podaci.datumPremijere = body.datumPremijere;
		if (body.popularnost !== undefined) {
			podaci.popularnost = this.parsirajBroj(body.popularnost);
		}
		if (body.prosjecnaOcjena !== undefined) {
			podaci.prosjecnaOcjena = this.parsirajBroj(body.prosjecnaOcjena);
		}
		if (body.brojGlasova !== undefined) {
			podaci.brojGlasova = this.parsirajBroj(body.brojGlasova);
		}
		if (body.filmJavan !== undefined) {
			podaci.filmJavan = this.parsirajBool(body.filmJavan);
		}
		if (typeof body.posterSlika === "string")
			podaci.posterSlika = body.posterSlika;
		if (typeof body.bannerSlika === "string")
			podaci.bannerSlika = body.bannerSlika;
		if (typeof body.video === "string") podaci.video = body.video;

		const zanrovi = this.procistiZanrove(
			body?.zanroviIds ?? body?.zanroviIDs ?? body?.zanrovi
		);
		if (zanrovi !== undefined) {
			podaci.zanroviIds = zanrovi;
		}
		return podaci;
	}

	private procistiZanrove(zanorviUlaz: any): Array<number> | undefined {
		if (zanorviUlaz === undefined) {
			return undefined;
		}
		if (!Array.isArray(zanorviUlaz)) {
			return undefined;
		}
		const rezultat = zanorviUlaz
			.map((id) => Number(id))
			.filter((id) => Number.isInteger(id) && id > 0);
		return Array.from(new Set(rezultat));
	}

	private parsirajBroj(vrijednost: any, cijeli: boolean = false) {
		const broj = cijeli ? parseInt(vrijednost) : Number(vrijednost);
		return Number.isNaN(broj) ? null : broj;
	}

	private parsirajBool(vrijednost: any) {
		if (typeof vrijednost === "boolean") {
			return vrijednost;
		}
		if (typeof vrijednost === "number") {
			return vrijednost !== 0;
		}
		if (typeof vrijednost === "string") {
			return ["1", "true", "da", "yes"].includes(vrijednost.toLowerCase());
		}
		return false;
	}

	private parsirajBoolQuery(vrijednost: any): boolean | undefined {
		if (vrijednost === undefined) {
			return undefined;
		}
		return this.parsirajBool(vrijednost);
	}

	private parsirajDecimalQuery(vrijednost: any): number | undefined {
		if (typeof vrijednost !== "string") {
			return undefined;
		}
		const normalizirano = vrijednost.trim().replace(",", ".");
		if (!normalizirano) {
			return undefined;
		}
		const broj = Number(normalizirano);
		return Number.isNaN(broj) ? undefined : broj;
	}

	private provjeriPrijavljenogKorisnika(
		zahtjev: Request,
		odgovor: Response
	): boolean {
		const sesija = zahtjev.session as RWASession | undefined;
		if (!sesija?.korime) {
			odgovor.status(403);
			odgovor.json({ greska: "zabranjen pristup" });
			return false;
		}
		return true;
	}
}
