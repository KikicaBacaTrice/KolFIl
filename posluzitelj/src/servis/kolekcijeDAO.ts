import {
	FilmKolekcijaI,
	KolekcijaDetaljiI,
	KolekcijaI,
	KorisnikKolekcijaI,
} from "../servisI/kolekcijeI.js";
import Baza from "../zajednicko/sqliteBaza.js";

interface KolekcijaUnos {
	naziv: string;
	opis?: string | null;
	slikaKolekcije: string;
	kolekcijaJavna?: boolean;
}
interface KolekcijaAzuriranje extends KolekcijaUnos {}

export class KolekcijeDAO {
	private baza: Baza;

	constructor() {
		this.baza = new Baza("podaci/RWA2025nkihas23.sqlite");
		this.baza.spoji();
	}

	async dajJavne(): Promise<Array<KolekcijaI>> {
		const sql =
			"SELECT k.id, k.naziv, k.opis, k.slika_kolekcije AS slikaKolekcije, COUNT(kf.film_id) AS brojFilmova FROM kolekcija k LEFT JOIN kolekcija_film kf ON kf.kolekcija_id = k.id WHERE k.kolekcija_javna=1 GROUP BY k.id";
		const redovi = (await this.baza.dajPodatke(sql, [])) as Array<any>;
		const kolekcije: Array<KolekcijaI> = [];
		for (let red of redovi) {
			kolekcije.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"] ?? null,
				slikaKolekcija: red["slikaKolekcije"],
				brojFilmova: Number(red["brojFilmova"]) || 0,
			});
		}
		return kolekcije;
	}

	async dajSve(): Promise<Array<KolekcijaI>> {
		const sql =
			"SELECT k.id, k.naziv, k.opis, k.slika_kolekcije AS slikaKolekcije, COUNT(kf.film_id) AS brojFilmova FROM kolekcija k LEFT JOIN kolekcija_film kf ON kf.kolekcija_id = k.id GROUP BY k.id";
		const redovi = (await this.baza.dajPodatke(sql, [])) as Array<any>;
		const kolekcije: Array<KolekcijaI> = [];
		for (let red of redovi) {
			kolekcije.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"] ?? null,
				slikaKolekcija: red["slikaKolekcije"],
				brojFilmova: Number(red["brojFilmova"]) || 0,
			});
		}
		return kolekcije;
	}

	async dajKolekciju(id: number): Promise<KolekcijaDetaljiI | null> {
		const sql =
			"SELECT id, naziv, opis, slika_kolekcije AS slikaKolekcija, kolekcija_javna AS kolekcijaJavna FROM kolekcija WHERE id = ?";
		const redovi = await this.baza.dajPodatke(sql, [id]);
		if (!redovi || redovi.length === 0) {
			return null;
		}
		let osnovniPodaci: KolekcijaI = {
			id: Number(redovi[0]["id"]),
			naziv: redovi[0]["naziv"],
			opis: redovi[0]["opis"],
			slikaKolekcija: redovi[0]["slikaKolekcija"],
			kolekcijaJavna: Boolean(redovi[0]["kolekcijaJavna"]),
			brojFilmova: 0,
		};
		const filmovi = await this.dajFilmoveZaKolekciju(id);
		const korisnici = await this.dajKorisnikeZaKolekciju(id);
		return {
			...osnovniPodaci,
			brojFilmova: filmovi.length,
			filmovi,
			korisnici,
		};
	}

	async kreirajKolekciju(podaci: KolekcijaUnos): Promise<number> {
		const sql =
			"INSERT INTO kolekcija (naziv, opis, kolekcija_javna, slika_kolekcije) VALUES (?, ?, ?, ?);";
		const rezultat = await this.baza.ubaciAzurirajPodatke(sql, [
			podaci.naziv,
			podaci.opis ?? null,
			podaci.kolekcijaJavna ? 1 : 0,
			podaci.slikaKolekcije,
		]);
		return Number(rezultat?.lastID) || 0;
	}

	async azurirajKolekciju(
		id: number,
		podaci: KolekcijaAzuriranje
	): Promise<boolean> {
		const polja: Array<string> = [];
		const vrijednosti: Array<string | number | null> = [];
		if (podaci.naziv !== undefined) {
			polja.push("naziv = ?");
			vrijednosti.push(podaci.naziv);
		}
		if (podaci.opis !== undefined) {
			polja.push("opis = ?");
			vrijednosti.push(podaci.opis);
		}
		if (podaci.kolekcijaJavna !== undefined) {
			polja.push("kolekcija_javna = ?");
			vrijednosti.push(podaci.kolekcijaJavna ? 1 : 0);
		}
		if (podaci.slikaKolekcije !== undefined) {
			polja.push("slika_kolekcije = ?");
			vrijednosti.push(podaci.slikaKolekcije);
		}
		if (polja.length == 0) {
			return false;
		}
		vrijednosti.push(id);
		const sql = `UPDATE kolekcija SET ${polja.join(", ")} WHERE id=?`;
		const rezultat = await this.baza.ubaciAzurirajPodatke(sql, vrijednosti);
		return Number(rezultat?.changes) > 0;
	}

	async obrisiKolekciju(id: number): Promise<boolean> {
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM kolekcija_film WHERE kolekcija_id = ?",
			[id]
		);
		const rezultat = await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM kolekcija WHERE id = ?",
			[id]
		);
		return Number(rezultat?.changes) > 0;
	}

	async dodajFilmUKolekciju(
		kolekcijaId: number,
		filmId: number
	): Promise<boolean> {
		const sql =
			"INSERT OR IGNORE INTO kolekcija_film(film_id, kolekcija_id) VALUES (?,?)";
		const rezultat = await this.baza.ubaciAzurirajPodatke(sql, [
			filmId,
			kolekcijaId,
		]);
		return Number(rezultat?.changes) > 0;
	}

	async makniFilmIzKolekcije(
		kolekcijaId: number,
		filmId: number
	): Promise<boolean> {
		const sql =
			"DELETE FROM kolekcija_film WHERE kolekcija_id = ? AND film_id = ?";
		const rezultat = await this.baza.ubaciAzurirajPodatke(sql, [
			kolekcijaId,
			filmId,
		]);
		return Number(rezultat?.changes) > 0;
	}

	async dodajKorisnikaUKolekciju(
		kolekcijaId: number,
		korisnikId: number
	): Promise<boolean> {
		const sql =
			"INSERT OR IGNORE INTO kolekcija_has_korisnik(kolekcija_id, korisnik_id) VALUES(?,?)";
		const rez = await this.baza.ubaciAzurirajPodatke(sql, [
			kolekcijaId,
			korisnikId,
		]);
		return Number(rez?.changes) > 0;
	}

	async makniKorisnikaIzKolekcije(
		kolekcijaId: number,
		korisnikId: number
	): Promise<boolean> {
		const sql =
			"DELETE FROM kolekcija_has_korisnik WHERE kolekcija_id =? AND korisnik_id=?";
		const rez = await this.baza.ubaciAzurirajPodatke(sql, [
			kolekcijaId,
			korisnikId,
		]);
		return Number(rez?.changes) > 0;
	}

	async jeKorisnikUKolekciji(
		kolekcijaId: number,
		korime: string
	): Promise<boolean> {
		const sql =
			"SELECT 1 AS postoji FROM kolekcija_has_korisnik kk INNER JOIN korisnik k ON k.id = kk.korisnik_id WHERE kk.kolekcija_id = ? AND k.korime = ? LIMIT 1";
		const redovi = await this.baza.dajPodatke(sql, [kolekcijaId, korime]);
		return Array.isArray(redovi) && redovi.length > 0;
	}

	private async dajFilmoveZaKolekciju(
		kolekcijaId: number
	): Promise<Array<FilmKolekcijaI>> {
		const sql =
			"SELECT f.id, f.naziv,f.opis, f.datum_premijere AS datumPremijere, f.poster_slika AS posterSlika FROM film f LEFT JOIN kolekcija_film kf ON kf.film_id=f.id WHERE kf.kolekcija_id=?";
		const redovi = (await this.baza.dajPodatke(sql, [
			kolekcijaId,
		])) as Array<any>;
		return redovi.map((red) => ({
			id: Number(red["id"]),
			naziv: red["naziv"],
			datumPremijere: red["datumPremijere"],
			opis: red["opis"] ?? null,
			posterSlika: red["posterSlika"] ?? null,
		}));
	}

	private async dajKorisnikeZaKolekciju(
		kolekcijaId: number
	): Promise<Array<KorisnikKolekcijaI>> {
		const sql =
			"SELECT k.id, k.korime FROM korisnik k INNER JOIN kolekcija_has_korisnik kk ON kk.korisnik_id=k.id WHERE kk.kolekcija_id=?";
		const redovi = (await this.baza.dajPodatke(sql, [
			kolekcijaId,
		])) as Array<any>;
		return redovi.map((red) => ({
			id: Number(red["id"]),
			korime: red["korime"],
		}));
	}
}
