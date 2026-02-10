import { KorisnikI, RWASession } from "../servisI/korisniciI.js";
import { KorisnikDAO } from "./korisnikDAO.js";
import { Request, Response } from "express";

import * as kodovi from "../zajednicko/kodovi.js";
import { posaljiMail } from "../zajednicko/mail.js";

const TIP_ADMIN = 1;

export class RestKorisnik {
	private kdao;
	private neuspjesnaPrijava: Map<string, number>;

	constructor() {
		this.kdao = new KorisnikDAO();
		this.neuspjesnaPrijava = new Map();
	}

	getKorisnici(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		const provjera = this.provjeriAdminIliModerator(zahtjev, odgovor);
		if (!provjera.dozvoljeno) {
			return;
		}
		this.kdao
			.dajSve()
			.then((korisnici: Array<KorisnikI>) => {
				let rezultat;
				if (provjera.jeAdmin) {
					rezultat = korisnici.map((k) => ({
						...k,
						lozinka: null,
					}));
				} else {
					rezultat = korisnici.map((k) => ({
						id: k.id,
						korime: k.korime,
						kolekcije: k.kolekcije ?? [],
					}));
				}
				odgovor.send(JSON.stringify(rezultat));
			})
			.catch(() => odgovor.status(500).json({ greska: "greska na serveru" }));
	}

	// async postKorisnici(zahtjev: Request, odgovor: Response) {
	// 	odgovor.type("application/json");
	// 	try {
	// 		let podaci = zahtjev.body;
	// 		const preferenceIds = Array.isArray(podaci.preference)
	// 			? podaci.preference
	// 					.map((id: number) => id)
	// 					.filter((id: number) => Number.isInteger(id))
	// 			: [];

	// 		if (zahtjev.body.korime == undefined || zahtjev.body.korime == "") {
	// 			odgovor.status(400);
	// 			odgovor.json({ greska: "neispravni podaci" });
	// 			return;
	// 		}

	// 		let korisnik = await this.kdao.daj(zahtjev.body.korime);
	// 		if (korisnik != null) {
	// 			odgovor.status(409);
	// 			odgovor.json({ greska: "neispravni podaci" });
	// 			return;
	// 		}

	// 		podaci.lozinka = kodovi.kreirajSHA256(zahtjev.body.lozinka, "moja sol");
	// 		const aktivacijskiKod = String(kodovi.dajNasumceBroj(10000, 99999));
	// 		podaci.aktivacijskiKod = aktivacijskiKod;
	// 		podaci.aktivan = false;
	// 		try {
	// 			const host = zahtjev.get("host") || "localhost";
	// 			const aktivacijskiUrl = `${
	// 				zahtjev.protocol
	// 			}://${host}/aktivacijaRacuna?korime=${encodeURIComponent(
	// 				podaci.korime
	// 			)}&kod=${encodeURIComponent(aktivacijskiKod)}`;

	// 			const mailPoruka =
	// 				`Aktivacijski kod: ${aktivacijskiKod}\n` +
	// 				`Aktivacijski link: ${aktivacijskiUrl}`;

	// 			await posaljiMail(
	// 				"nkihas23@foi.hr",
	// 				podaci.email,
	// 				"Aktivacija racuna",
	// 				mailPoruka
	// 			);
	// 			let poruka = await this.kdao.dodaj(podaci, preferenceIds);
	// 			odgovor.send(JSON.stringify(poruka));
	// 		} catch (greska: any) {
	// 			const odgovorGreska = String(greska?.message || "");
	// 			if (odgovorGreska.includes("UNIQUE constraint")) {
	// 				odgovor.status(409);
	// 				odgovor.json({ greska: "neispravni podaci" });
	// 			} else {
	// 				odgovor.status(500);
	// 				odgovor.json({ greska: "greska na serveru." });
	// 			}
	// 		}
	// 	} catch (greska) {
	// 		odgovor.status(500);
	// 		odgovor.json({ greska: "greska na serveru." });
	// 	}
	// }

	async postKorisnici(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		try {
			let podaci = zahtjev.body;
			const preferenceIds = Array.isArray(podaci.preference)
				? podaci.preference
						.map((id: number) => id)
						.filter((id: number) => Number.isInteger(id))
				: [];

			if (zahtjev.body.korime == undefined || zahtjev.body.korime == "") {
				odgovor.status(400);
				odgovor.json({ greska: "neispravni podaci" });
				return;
			}

			let korisnik = await this.kdao.daj(zahtjev.body.korime);
			if (korisnik != null) {
				odgovor.status(409);
				odgovor.json({ greska: "neispravni podaci" });
				return;
			}

			podaci.lozinka = kodovi.kreirajSHA256(zahtjev.body.lozinka, "moja sol");
			const aktivacijskiKod = String(kodovi.dajNasumceBroj(10000, 99999));
			podaci.aktivacijskiKod = aktivacijskiKod;
			podaci.aktivan = false;
			try {
				const host = zahtjev.get("host") || "localhost";
				const aktivacijskiUrl = `${
					zahtjev.protocol
				}://${host}/aktivacijaRacuna?korime=${encodeURIComponent(
					podaci.korime
				)}&kod=${encodeURIComponent(aktivacijskiKod)}`;

				let poruka = await this.kdao.dodaj(podaci, preferenceIds);
				let mailPoslan = false;
				try {
					const mailPoruka =
						`Aktivacijski kod: ${aktivacijskiKod}\n` +
						`Aktivacijski link: ${aktivacijskiUrl}`;
					await posaljiMail(
						"nkihas23@student.foi.hr",
						podaci.email,
						"Aktivacija racuna",
						mailPoruka
					);
					mailPoslan = true;
				} catch (greska) {
					console.error("Greska pri slanju aktivacijskog maila:", greska);
				}
				odgovor.send(
					JSON.stringify({
						...poruka,
						mailPoslan,
						aktivacijskiUrl,
					})
				);
			} catch (greska: any) {
				const odgovorGreska = String(greska?.message || "");
				if (odgovorGreska.includes("UNIQUE constraint")) {
					odgovor.status(409);
					odgovor.json({ greska: "neispravni podaci" });
				} else {
					odgovor.status(500);
					odgovor.json({ greska: "greska na serveru." });
				}
			}
		} catch (greska) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru." });
		}
	}

	async getKorisnik(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		let korime = this.paramAsString(zahtjev.params["korime"]);
		if (korime == undefined) {
			odgovor.status(404);
			odgovor.json({ greska: "nepostojeći resurs" });
			return;
		}
		let korisnik = await this.kdao.daj(korime);
		if (korisnik == null) {
			odgovor.status(404);
			odgovor.send(JSON.stringify({ greska: "nepostojeći resurs" }));
			return;
		}
		korisnik.lozinka = null;
		odgovor.send(JSON.stringify(korisnik));
	}

	getKorisnikPrijava(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		let korime = this.paramAsString(zahtjev.params["korime"]);
		if (korime == undefined) {
			odgovor.status(400);
			odgovor.send(JSON.stringify({ greska: "neispravni podaci" }));
			return;
		}
		this.kdao.daj(korime).then((korisnik: KorisnikI | null) => {
			console.log(korisnik);
			console.log(zahtjev.body);
			let lozinka = kodovi.kreirajSHA256(zahtjev.body.lozinka, "moja sol");
			if (korisnik == null) {
				odgovor.status(403);
				odgovor.send(JSON.stringify({ greska: "neispravni podaci" }));
				return;
			}
			if (!korisnik.aktivan) {
				odgovor.status(403);
				odgovor.send(JSON.stringify({ greska: "Račun nije aktivan" }));
				return;
			}
			if (korisnik.racunBlokiran) {
				odgovor.status(403);
				odgovor.send(JSON.stringify({ greska: "racun blokiran" }));
				return;
			}
			if (korisnik.lozinka != lozinka) {
				this.evidentirajNeuspjesnuPrijavu(korime);
				odgovor.status(403);
				odgovor.send(JSON.stringify({ greska: "neispravni podaci" }));
				return;
			}
			korisnik.lozinka = null;
			let sesija = zahtjev.session as RWASession;
			sesija.korisnik = korisnik.ime + " " + korisnik.prezime;
			sesija.korime = korisnik.korime;
			sesija.tipKorisnikaId = korisnik.tipKorisnikaId;
			this.neuspjesnaPrijava.delete(korime);
			odgovor.send(JSON.stringify(korisnik));
		});
	}

	getSesija(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		const sesija = zahtjev.session as RWASession | undefined;
		odgovor.send(
			JSON.stringify({
				korime: sesija?.korime ?? null,
				tipKorisnikaId: sesija?.tipKorisnikaId ?? null,
			})
		);
	}

	postOdjava(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		const sesija = zahtjev.session as RWASession | undefined;
		if (sesija) {
			sesija.korisnik = null;
			sesija.korime = "";
			sesija.tipKorisnikaId = null;
		}
		zahtjev.session.destroy((err) => {
			if (err) {
				odgovor.status(500).json({ greska: "greska na serveru" });
				return;
			}
			odgovor.status(200);
			odgovor.json({ uspjeh: true });
		});
	}

	async deleteKorisnik(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		if (!this.provjeriAdmin(zahtjev, odgovor)) {
			return;
		}
		const korime = this.paramAsString(zahtjev.params["korime"]);
		if (korime == undefined) {
			odgovor.status(400);
			odgovor.send(JSON.stringify({ greska: "neispravni podaci" }));
			return;
		}
		try {
			const korisnik = await this.kdao.daj(korime);
			if (korisnik == null) {
				odgovor.status(404);
				odgovor.send(JSON.stringify({ greska: "nepostojeci resurs" }));
				return;
			}
			if (korisnik.tipKorisnikaId === TIP_ADMIN) {
				odgovor.status(400);
				odgovor.json({ greska: "neispravni podaci" });
				return;
			}
			const obrisan = await this.kdao.obrisi(korime);
			if (!obrisan) {
				odgovor.status(500).json({ greska: "greska na serveru" });
				return;
			}
			odgovor.send(JSON.stringify({ ok: "obrisan" }));
		} catch (greska) {
			odgovor.status(500).json({ greska: "greska na serveru" });
		}
	}

	putKorisnik(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		let korime = this.paramAsString(zahtjev.params["korime"]);
		if (korime == undefined) {
			odgovor.status(400);
			odgovor.send(JSON.stringify({ greska: "neispravni podaci" }));
			return;
		}
		let podaci = zahtjev.body;
		let poruka = this.kdao.azuriraj(korime, podaci);
		odgovor.send(JSON.stringify(poruka));
	}

	async putTipKorisnika(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		if (!this.provjeriAdmin(zahtjev, odgovor)) {
			return;
		}
		const korime = String(zahtjev.params["korime"]);
		const tipId = Number(zahtjev.body.tipKorisnikaId);

		const korisnik = await this.kdao.daj(korime);
		if (korisnik?.tipKorisnikaId === TIP_ADMIN) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		await this.kdao.postaviTip(korime, tipId);
		odgovor.json({ uspjeh: true });
	}

	async putBlokadaKorisnik(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		if (!this.provjeriPrijavu(zahtjev, odgovor)) {
			return;
		}
		if (!this.provjeriAdmin(zahtjev, odgovor)) {
			return;
		}
		const korime = String(zahtjev.params["korime"]);
		const blokiran = Boolean(zahtjev.body.racunBlokiran);
		await this.kdao.postaviBlokadu(korime, blokiran);
		odgovor.json({ uspjeh: true });
	}

	async getAktivacijaRacuna(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		const korime =
			typeof zahtjev.query["korime"] === "string"
				? zahtjev.query["korime"]
				: undefined;
		const kod =
			typeof zahtjev.query["kod"] === "string"
				? zahtjev.query["kod"]
				: undefined;
		if (!korime || !kod) {
			odgovor.status(400);
			odgovor.json({ greska: "neispravni podaci" });
			return;
		}
		try {
			const aktiviran = await this.kdao.aktivirajRacun(korime, kod);
			if (!aktiviran) {
				odgovor.status(400);
				odgovor.json({ greska: "neispravni podaci" });
				return;
			}
			odgovor.status(200);
			odgovor.json({ uspjeh: true });
		} catch {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}

	private provjeriAdmin(zahtjev: Request, odgovor: Response): boolean {
		const sesija = zahtjev.session as RWASession | undefined;
		if (sesija?.tipKorisnikaId !== TIP_ADMIN) {
			odgovor.status(403);
			odgovor.json({ greska: "zabranjen pristup" });
			return false;
		}
		return true;
	}

	private provjeriAdminIliModerator(
		zahtjev: Request,
		odgovor: Response
	): { dozvoljeno: boolean; jeAdmin: boolean } {
		const sesija = zahtjev.session as RWASession | undefined;
		const jeAdmin = sesija?.tipKorisnikaId === TIP_ADMIN;
		const jeModerator = sesija?.tipKorisnikaId === 3;
		if (!jeAdmin && !jeModerator) {
			odgovor.status(403);
			odgovor.json({ greska: "zabranjen pristup" });
			return { dozvoljeno: false, jeAdmin: false };
		}
		return { dozvoljeno: true, jeAdmin };
	}

	private async evidentirajNeuspjesnuPrijavu(korime: string) {
		const trenutni = this.neuspjesnaPrijava.get(korime) || 0;
		const novi = trenutni + 1;
		this.neuspjesnaPrijava.set(korime, novi);
		if (novi >= 3) {
			await this.kdao.postaviBlokadu(korime, true);
			this.neuspjesnaPrijava.delete(korime);
		}
	}

	private provjeriPrijavu(zahtjev: Request, odgovor: Response): boolean {
		const sesija = zahtjev.session as RWASession | undefined;
		if (!sesija?.korime) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return false;
		}
		return true;
	}

	private paramAsString(value: string | string[] | undefined): string | undefined {
		if (Array.isArray(value)) {
			return value[0];
		}
		return value;
	}
}
