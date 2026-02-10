import { Request, Response } from "express";
import { KolekcijeDAO } from "./kolekcijeDAO.js";
import { RWASession } from "../servisI/korisniciI.js";

interface TijeloKolekcije {
	naziv?: string;
	opis?: string | null;
	slikaKolekcije?: string;
	kolekcijaJavna?: boolean;
}

export class RestKolekcije {
	private kdao: KolekcijeDAO;

	constructor() {
		this.kdao = new KolekcijeDAO();
	}

	async getSve(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		try {
			const kolekcije = await this.kdao.dajSve();
			odgovor.json(kolekcije);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async getJavneKolekcije(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		try {
			const kolekcije = await this.kdao.dajJavne();
			odgovor.json(kolekcije);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async getKolekcija(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		const id = Number(zahtjev.params["id"]);
		if (!Number.isInteger(id)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		if (!(await this.provjeriPristupKolekciji(zahtjev, odgovor, id))) {
			return;
		}
		try {
			const kolekcija = await this.kdao.dajKolekciju(id);
			if (!kolekcija) {
				odgovor.status(404);
				odgovor.json({ greska: "nepostojeci resurs" });
				return;
			}
			odgovor.json(kolekcija);
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
			return;
		}
	}

	async postKolekcije(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const podaci = (zahtjev.body ?? {}) as TijeloKolekcije;
		try {
			const id = await this.kdao.kreirajKolekciju(podaci as any);
			if (!id) {
				throw new Error("Kolekcija nije kreirana");
			}
			const kolekcija = await this.kdao.dajKolekciju(id);
			odgovor.status(201);
			odgovor.json(kolekcija ?? { id });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async putKolekcija(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const idKolekcije = Number(zahtjev.params["id"]);
		const podaci = (zahtjev.body ?? {}) as TijeloKolekcije;
		try {
			const azurirano = await this.kdao.azurirajKolekciju(
				idKolekcije,
				podaci as any
			);
			if (!azurirano) {
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

	async deleteKolekcija(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const idKolekcije = Number(zahtjev.params["id"]);
		try {
			const obrisano = await this.kdao.obrisiKolekciju(idKolekcije);
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

	async postKolekcijaFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const idKolekcije = Number(zahtjev.params["id"]);
		const filmId = Number(zahtjev.body?.filmId);
		if (!Number.isInteger(idKolekcije) || !Number.isInteger(filmId)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const dodano = await this.kdao.dodajFilmUKolekciju(idKolekcije, filmId);
			odgovor.status(200);
			odgovor.json({ uspjeh: true, poruka: dodano });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({
				greska: "greska na serveru",
			});
		}
	}

	async deleteKolekcijaFilm(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const idKolekcije = Number(zahtjev.params["id"]);
		const filmId = Number(zahtjev.params["filmId"]);
		if (!Number.isInteger(idKolekcije) || !Number.isInteger(filmId)) {
			odgovor.status(400).json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const obrisano = await this.kdao.makniFilmIzKolekcije(
				idKolekcije,
				filmId
			);
			if (!obrisano) {
				odgovor.status(404);
				odgovor.json({ greska: "nepostojeci resurs" });
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

	async postKolekcijaKorisnik(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriModeratorIliAdmin(zahtjev, odgovor)) {
			return;
		}
		const kolekcijaId = Number(zahtjev.params["id"]);
		const korisnikId = Number(zahtjev.body?.korisnikId);
		if (!Number.isInteger(kolekcijaId) || !Number.isInteger(korisnikId)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const dodano = await this.kdao.dodajKorisnikaUKolekciju(
				kolekcijaId,
				korisnikId
			);
			odgovor.status(200);
			odgovor.json({ uspjeh: true, poruka: dodano });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	async deleteKolekcijaKorisnik(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriModeratorIliAdmin(zahtjev, odgovor)) {
			return;
		}
		const kolekcijaId = Number(zahtjev.params["id"]);
		const korisnikId = Number(zahtjev.params["korisnikId"]);
		if (!Number.isInteger(kolekcijaId) || !Number.isInteger(korisnikId)) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const obrisano = await this.kdao.makniKorisnikaIzKolekcije(
				kolekcijaId,
				korisnikId
			);
			if (!obrisano) {
				odgovor.status(404);
				odgovor.json({ greska: "nepostojeci resurs" });
				return;
			}
			odgovor.status(200);
			odgovor.json({ uspjeh: true });
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	private provjeriModeratorIliAdmin(zahtjev: Request, odgovor: Response) {
		const sesija = zahtjev.session as RWASession | undefined;
		if (sesija?.tipKorisnikaId === 1 || sesija?.tipKorisnikaId === 3) {
			return true;
		}
		odgovor.status(403).json({ greska: "zabranjen pristup" });
		return false;
	}

	private async provjeriPristupKolekciji(
		zahtjev: Request,
		odgovor: Response,
		kolekcijaId: number
	): Promise<boolean> {
		const sesija = zahtjev.session as RWASession | undefined;
		if (!sesija?.korime) {
			odgovor.status(403);
			odgovor.json({
				greska: "zabranjen pristup",
			});
			return false;
		}
		if (sesija.tipKorisnikaId === 1 || sesija.tipKorisnikaId === 3) {
			return true;
		}
		const korisnikUKolekciji = await this.kdao.jeKorisnikUKolekciji(
			kolekcijaId,
			sesija.korime
		);
		if (!korisnikUKolekciji) {
			odgovor.status(403);
			odgovor.json({ greska: "zabranjen pristup" });
			return false;
		}
		return true;
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
