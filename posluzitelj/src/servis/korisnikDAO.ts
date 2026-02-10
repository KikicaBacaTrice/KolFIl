import {
	KorisnikI,
	PreferenceI,
	KorisnickaKolekcijaI,
} from "../servisI/korisniciI.js";
import Baza from "../zajednicko/sqliteBaza.js";

export class KorisnikDAO {
	private baza: Baza;

	constructor() {
		this.baza = new Baza("podaci/RWA2025nkihas23.sqlite");
		this.baza.spoji();
	}

	async dajSve(): Promise<Array<KorisnikI>> {
		let sql =
			"SELECT k.id, k.ime, k.prezime, k.adresa, k.opis, k.korime, k.lozinka, k.email, k.racun_blokiran AS racunBlokiran, k.aktivan AS aktivan, k.aktivacijski_kod AS aktivacijskiKod, k.id_tip_korisnika AS tipKorisnikaId, tk.naziv AS tipKorisnikaNaziv FROM korisnik k LEFT JOIN tip_korisnika tk ON tk.id = k.id_tip_korisnika;";
		var podaci = (await this.baza.dajPodatke(sql, [])) as Array<KorisnikI>;
		let rezultat = await Promise.all(
			podaci.map(async (p) => {
				let k: KorisnikI = {
					id: Number(p["id"]),
					ime: p["ime"],
					prezime: p["prezime"],
					adresa: p["adresa"],
					opis: p["opis"],
					korime: p["korime"],
					lozinka: p["lozinka"],
					email: p["email"],
					racunBlokiran: p["racunBlokiran"],
					aktivan: p["aktivan"] === null ? null : Boolean(p["aktivan"]),
					aktivacijskiKod: p["aktivacijskiKod"] ?? null,
					tipKorisnikaId: p["tipKorisnikaId"],
					tipKorisnikaNaziv: p["tipKorisnikaNaziv"],
				};
				if (k.id) {
					k.kolekcije = await this.dajKolekcijeZaKorisnikaId(k.id);
				}
				return k;
			})
		);
		return rezultat;
	}

	async daj(korime: string): Promise<KorisnikI | null> {
		let sql =
			"SELECT k.id, k.ime, k.prezime, k.adresa, k.opis, k.korime, k.lozinka, k.email, k.racun_blokiran AS racunBlokiran, k.aktivan AS aktivan, k.aktivacijski_kod AS aktivacijskiKod, k.id_tip_korisnika AS tipKorisnikaId, tk.naziv AS tipKorisnikaNaziv FROM korisnik k LEFT JOIN tip_korisnika tk ON tk.id = k.id_tip_korisnika WHERE k.korime = ?;";
		var podaci = (await this.baza.dajPodatke(sql, [
			korime,
		])) as Array<KorisnikI>;

		if (podaci.length == 1 && podaci[0] != undefined) {
			let p = podaci[0];
			let k: KorisnikI = {
				id: Number(p["id"]),
				ime: p["ime"],
				prezime: p["prezime"],
				adresa: p["adresa"],
				opis: p["opis"],
				korime: p["korime"],
				lozinka: p["lozinka"],
				email: p["email"],
				racunBlokiran: p["racunBlokiran"],
				aktivan: p["aktivan"] === null ? null : Boolean(p["aktivan"]),
				aktivacijskiKod: p["aktivacijskiKod"] ?? null,
				tipKorisnikaId: p["tipKorisnikaId"],
				tipKorisnikaNaziv: p["tipKorisnikaNaziv"],
			};
			k.preference = await this.dajPreferenceZaKorisnika(korime);
			if (k.id) {
				k.kolekcije = await this.dajKolekcijeZaKorisnikaId(k.id);
			}
			return k;
		}

		return null;
	}

	async dodaj(korisnik: KorisnikI, preferenceIds: Array<number> = []) {
		console.log(korisnik);
		let sql = `INSERT INTO korisnik (ime,prezime,adresa,opis,lozinka,email,korime,racun_blokiran,aktivan, aktivacijski_kod, id_tip_korisnika) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
		let podaci = [
			korisnik.ime,
			korisnik.prezime,
			korisnik.adresa,
			korisnik.opis,
			korisnik.lozinka,
			korisnik.email,
			korisnik.korime,
			0,
			korisnik.aktivan ? 1 : 0,
			korisnik.aktivacijskiKod ?? null,
			2,
		];
		const rezultat = await this.baza.ubaciAzurirajPodatke(sql, podaci);
		const korisnikId = rezultat?.lastID;

		let spremljenePreference = 0;
		if (preferenceIds.length > 0) {
			const unosPreferenceUpit =
				"INSERT INTO korisnik_has_preference (korisnik_id, preference_id) VALUES (?,?)";
			const jedinstvenePreference = Array.from(
				new Set(preferenceIds.filter((id) => Number.isInteger(id)))
			);
			for (let pref of jedinstvenePreference) {
				const prefId = Number(pref);
				await this.baza.ubaciAzurirajPodatke(unosPreferenceUpit, [
					korisnikId,
					prefId,
				]);
				spremljenePreference++;
			}
		}

		return { uspjeh: true, korisnikId, spremljenePreference };
	}

	async obrisi(korime: string) {
		const korisnik = await this.daj(korime);
		if (!korisnik?.id) {
			return false;
		}
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM korisnik_has_preference WHERE korisnik_id=?",
			[korisnik.id]
		);
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM kolekcija_has_korisnik WHERE korisnik_id=?",
			[korisnik.id]
		);
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM korisnik WHERE korime=?",
			[korime]
		);
		return true;
	}

	azuriraj(korime: string, korisnik: KorisnikI) {
		let sql = `UPDATE korisnik SET ime=?, prezime=?, adresa=?, opis=?, lozinka=?, email=? WHERE korime=?`;
		let podaci = [
			korisnik.ime,
			korisnik.prezime,
			korisnik.adresa,
			korisnik.opis,
			korisnik.lozinka,
			korisnik.email,
			korime,
		];
		this.baza.ubaciAzurirajPodatke(sql, podaci);
		return true;
	}

	async postaviTip(korime: string, tipId: number) {
		const sql = "UPDATE korisnik SET id_tip_korisnika=? WHERE korime=?";
		await this.baza.ubaciAzurirajPodatke(sql, [tipId, korime]);
		return true;
	}

	async postaviBlokadu(korime: string, blokiran: boolean) {
		const sql = "UPDATE korisnik SET racun_blokiran=? WHERE korime=?";
		await this.baza.ubaciAzurirajPodatke(sql, [blokiran ? 1 : 0, korime]);
		return true;
	}

	async aktivirajRacun(korime: string, kod: string): Promise<boolean> {
		const sql =
			"UPDATE korisnik SET aktivan=1, aktivacijski_kod=NULL WHERE korime=? AND aktivacijski_kod=? AND aktivan=0";
		const rez = await this.baza.ubaciAzurirajPodatke(sql, [korime, kod]);
		return Number(rez?.changes) > 0;
	}

	private async dajPreferenceZaKorisnika(
		korime: string
	): Promise<Array<PreferenceI>> {
		const sql =
			"SELECT p.id, p.naziv, p.opis FROM preference p INNER JOIN korisnik_has_preference khp ON khp.preference_id=p.id INNER JOIN korisnik k ON k.id=khp.korisnik_id WHERE k.korime=? ORDER BY p.naziv ASC";
		const podaci = (await this.baza.dajPodatke(sql, [korime])) as Array<any>;
		const rezultat: Array<PreferenceI> = [];
		for (let p of podaci) {
			rezultat.push({
				id: p["id"],
				naziv: p["naziv"],
				opis: p["opis"],
			});
		}
		return rezultat;
	}

	private async dajKolekcijeZaKorisnikaId(
		korisnikId: number
	): Promise<Array<KorisnickaKolekcijaI>> {
		const sql =
			"SELECT k.id, k.naziv, k.opis, k.slika_kolekcije AS slikaKolekcije, COUNT(kf.film_id) AS brojFilmova FROM kolekcija k INNER JOIN kolekcija_has_korisnik kk ON kk.kolekcija_id = k.id LEFT JOIN kolekcija_film kf ON kf.kolekcija_id = k.id WHERE kk.korisnik_id = ? GROUP BY k.id";
		const podaci = (await this.baza.dajPodatke(sql, [
			korisnikId,
		])) as Array<any>;
		const rezultat: Array<KorisnickaKolekcijaI> = [];
		for (let p of podaci) {
			rezultat.push({
				id: Number(p["id"]),
				naziv: p["naziv"],
				opis: p["opis"] ?? null,
				slikaKolekcije: p["slikaKolekcije"],
				brojFilmova: Number(p["brojFilmova"]) || 0,
			});
		}
		return rezultat;
	}
}
