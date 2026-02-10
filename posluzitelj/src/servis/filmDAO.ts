import {
	FilmI,
	FilmDetaljiI,
	FilmUnosI,
	UnutarKolekcijaI,
	ZanrI,
} from "../servisI/filmI.js";
import Baza from "../zajednicko/sqliteBaza.js";

interface FilmFilter {
	samoJavni?: boolean;
	trazi?: string;
}

type sortiranjaTipovi = "asc" | "desc" | "";

interface JavniFilmFilter {
	trazi?: string;
	filtrirajPoOcjeniDolje?: number;
	filtrirajPoOcjeniGore?: number;
	sortirajPoDatumuPremijere?: sortiranjaTipovi;
	sortirajPoBrojuGlasova?: sortiranjaTipovi;
}

interface FilmAzuriranje extends Partial<FilmUnosI> {}

export class FilmDAO {
	private baza: Baza;

	constructor() {
		this.baza = new Baza("podaci/RWA2025nkihas23.sqlite");
		this.baza.spoji();
	}

	async dajJavneFilmove(maxBroj: number = 10): Promise<Array<FilmI>> {
		const sql =
			"SELECT id, naziv, opis, datum_premijere AS datumPremijere, popularnost, prosjecna_ocjena AS prosjecnaOcjena, broj_glasova AS brojGlasova, film_javan AS filmJavan, autor, poster_slika AS posterSlika, banner_slika AS bannerSlika, video FROM film WHERE film_javan = 1 LIMIT ?";
		const redovi = await this.baza.dajPodatke(sql, [maxBroj]);
		const filmovi: Array<FilmI> = [];
		for (let red of redovi) {
			filmovi.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"],
				datumPremijere: red["datumPremijere"],
				popularnost:
					red["popularnost"] !== null ? Number(red["popularnost"]) : null,
				prosjecnaOcjena:
					red["prosjecnaOcjena"] !== null
						? Number(red["prosjecnaOcjena"])
						: null,
				brojGlasova:
					red["brojGlasova"] !== null ? Number(red["brojGlasova"]) : null,
				filmJavan: !!red["filmJavan"],
				autor: red["autor"] ?? null,
				posterSlika: red["posterSlika"] ?? null,
				bannerSlika: red["bannerSlika"] ?? null,
				video: red["video"] ?? null,
			});
		}
		return filmovi;
	}

	async dajFilmove(filter: FilmFilter = {}): Promise<Array<FilmI>> {
		const uvijeti: Array<string> = [];
		const vrijednosti: Array<string | number> = [];
		const filmovi: Array<FilmI> = [];

		if (filter.samoJavni) {
			uvijeti.push("film_javan = 1");
		}
		if (filter.trazi) {
			uvijeti.push("LOWER(naziv) LIKE ?");
			vrijednosti.push(`%${filter.trazi.toLocaleLowerCase()}%`);
		}

		const sql = `SELECT id, naziv, opis, datum_premijere AS datumPremijere, popularnost, prosjecna_ocjena AS prosjecnaOcjena, broj_glasova AS brojGlasova, film_javan AS filmJavan, autor, poster_slika AS posterSlika, banner_slika AS bannerSlika, video FROM film ${
			uvijeti.length ? "WHERE " + uvijeti.join(" AND ") : ""
		}`;

		const redovi = await this.baza.dajPodatke(sql, vrijednosti);
		for (let red of redovi) {
			filmovi.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"],
				datumPremijere: red["datumPremijere"],
				popularnost:
					red["popularnost"] !== null ? Number(red["popularnost"]) : null,
				prosjecnaOcjena:
					red["prosjecnaOcjena"] !== null
						? Number(red["prosjecnaOcjena"])
						: null,
				brojGlasova:
					red["brojGlasova"] !== null ? Number(red["brojGlasova"]) : null,
				filmJavan: !!red["filmJavan"],
				autor: red["autor"] ?? null,
				posterSlika: red["posterSlika"] ?? null,
				bannerSlika: red["bannerSlika"] ?? null,
				video: red["video"] ?? null,
			});
		}
		return filmovi;
	}

	async dajJavneFilmoveFilter(
		filter: JavniFilmFilter = {}
	): Promise<Array<FilmI>> {
		const uvijetiWhere: Array<string> = [];
		const uvijetiOrderBy: Array<string> = [];
		const vrijednosti: Array<string | number> = [];
		const filmovi: Array<FilmI> = [];
		uvijetiWhere.push("film_javan = 1");

		if (filter.trazi && filter.trazi.trim().length > 2) {
			uvijetiWhere.push("LOWER(naziv) LIKE ?");
			vrijednosti.push(`%${filter.trazi.toLowerCase()}%`);
		}
		if (filter.filtrirajPoOcjeniDolje !== undefined) {
			uvijetiWhere.push("prosjecna_ocjena >= ?");
			vrijednosti.push(filter.filtrirajPoOcjeniDolje);
		}
		if (filter.filtrirajPoOcjeniGore !== undefined) {
			uvijetiWhere.push("prosjecna_ocjena <= ?");
			vrijednosti.push(filter.filtrirajPoOcjeniGore);
		}

		if (filter.sortirajPoBrojuGlasova) {
			if (filter.sortirajPoBrojuGlasova == "asc") {
				uvijetiOrderBy.push("broj_glasova ASC");
			} else {
				uvijetiOrderBy.push("broj_glasova DESC");
			}
		}
		if (filter.sortirajPoDatumuPremijere) {
			if (filter.sortirajPoDatumuPremijere == "asc") {
				uvijetiOrderBy.push("datum_premijere ASC");
			} else {
				uvijetiOrderBy.push("datum_premijere DESC");
			}
		}

		const sql = `SELECT id, naziv, opis, datum_premijere AS datumPremijere, popularnost, prosjecna_ocjena AS prosjecnaOcjena, broj_glasova AS brojGlasova, film_javan AS filmJavan, autor, poster_slika AS posterSlika, banner_slika AS bannerSlika, video FROM film ${
			uvijetiWhere.length ? "WHERE " + uvijetiWhere.join(" AND ") : ""
		} ${uvijetiOrderBy.length ? "ORDER BY " + uvijetiOrderBy.join(", ") : ""}`;

		const redovi = await this.baza.dajPodatke(sql, vrijednosti);
		for (let red of redovi) {
			filmovi.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"],
				datumPremijere: red["datumPremijere"],
				popularnost:
					red["popularnost"] !== null ? Number(red["popularnost"]) : null,
				prosjecnaOcjena:
					red["prosjecnaOcjena"] !== null
						? Number(red["prosjecnaOcjena"])
						: null,
				brojGlasova:
					red["brojGlasova"] !== null ? Number(red["brojGlasova"]) : null,
				filmJavan: !!red["filmJavan"],
				autor: red["autor"] ?? null,
				posterSlika: red["posterSlika"] ?? null,
				bannerSlika: red["bannerSlika"] ?? null,
				video: red["video"] ?? null,
			});
		}
		return filmovi;
	}

	async dajFilmPoNazivuIDatumu(
		naziv: string,
		datumPremijere: string
	): Promise<FilmDetaljiI | null> {
		const id = await this.nadjiPosotjiLiFilmUDB(naziv, datumPremijere);
		if (!id) {
			return null;
		}
		return await this.dajFilm(id);
	}

	async dajFilm(id: number): Promise<FilmDetaljiI | null> {
		const sql =
			"SELECT id, naziv, opis, datum_premijere AS datumPremijere, popularnost, prosjecna_ocjena AS prosjecnaOcjena, broj_glasova AS brojGlasova, film_javan AS filmJavan, autor, poster_slika AS posterSlika, banner_slika AS bannerSlika, video FROM film WHERE id=? LIMIT 1";
		const red = await this.baza.dajPodatke(sql, [id]);
		if (!red || red.length == 0) {
			return null;
		}
		const film = {
			id: Number(red[0]["id"]),
			naziv: red[0]["naziv"],
			opis: red[0]["opis"],
			datumPremijere: red[0]["datumPremijere"],
			popularnost:
				red[0]["popularnost"] !== null ? Number(red[0]["popularnost"]) : null,
			prosjecnaOcjena:
				red[0]["prosjecnaOcjena"] !== null
					? Number(red[0]["prosjecnaOcjena"])
					: null,
			brojGlasova:
				red[0]["brojGlasova"] !== null ? Number(red[0]["brojGlasova"]) : null,
			filmJavan: !!red[0]["filmJavan"],
			autor: red[0]["autor"] ?? null,
			posterSlika: red[0]["posterSlika"] ?? null,
			bannerSlika: red[0]["bannerSlika"] ?? null,
			video: red[0]["video"] ?? null,
		};
		const zanrovi = await this.dajZanroveZaFilma(id);
		const kolekcije = await this.dajKolekcijeZaFilm(id);
		return {
			...film,
			zanrovi,
			kolekcije,
		};
	}

	async kreirajFilm(podaci: FilmUnosI): Promise<number> {
		console.log(podaci);
		const postojeciId = await this.nadjiPosotjiLiFilmUDB(
			podaci.naziv,
			podaci.datumPremijere
		);
		if (postojeciId) {
			return postojeciId;
		}

		const sql =
			"INSERT INTO film (naziv, opis, datum_premijere, popularnost, prosjecna_ocjena, broj_glasova, film_javan, autor, poster_slika, banner_slika, video) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
		const vrijednosti: Array<string | number | null> = [
			podaci.naziv,
			podaci.opis,
			podaci.datumPremijere,
			podaci.popularnost ?? null,
			podaci.prosjecnaOcjena ?? null,
			podaci.brojGlasova ?? null,
			podaci.filmJavan === false ? 0 : 1,
			podaci.autor ?? null,
			podaci.posterSlika ?? null,
			podaci.bannerSlika ?? null,
			podaci.video ?? null,
		];

		const rez = await this.baza.ubaciAzurirajPodatke(sql, vrijednosti);
		const filmID = Number(rez?.lastID) || 0;
		if (filmID && podaci.zanroviIds && podaci.zanroviIds.length > 0) {
			await this.postaviZanrove(filmID, podaci.zanroviIds);
		}
		return filmID;
	}

	async azurirajFilm(id: number, podaci: FilmAzuriranje): Promise<boolean> {
		const polja: Array<string> = [];
		const vrijednosti: Array<string | number | null> = [];
		if (podaci.naziv !== undefined) {
			polja.push("naziv=?");
			vrijednosti.push(podaci.naziv);
		}
		if (podaci.opis !== undefined) {
			polja.push("opis=?");
			vrijednosti.push(podaci.opis);
		}
		if (podaci.datumPremijere !== undefined) {
			polja.push("datum_premijere=?");
			vrijednosti.push(podaci.datumPremijere);
		}
		if (podaci.popularnost !== undefined) {
			polja.push("popularnost=?");
			vrijednosti.push(podaci.popularnost);
		}
		if (podaci.prosjecnaOcjena !== undefined) {
			polja.push("prosjecna_ocjena=?");
			vrijednosti.push(podaci.prosjecnaOcjena);
		}
		if (podaci.brojGlasova !== undefined) {
			polja.push("broj_glasova=?");
			vrijednosti.push(podaci.brojGlasova);
		}
		if (podaci.filmJavan !== undefined) {
			polja.push("film_javan=?");
			vrijednosti.push(podaci.filmJavan ? 1 : 0);
		}
		if (podaci.autor !== undefined) {
			polja.push("autor=?");
			vrijednosti.push(podaci.autor);
		}
		if (podaci.posterSlika !== undefined) {
			polja.push("poster_slika=?");
			vrijednosti.push(podaci.posterSlika);
		}
		if (podaci.bannerSlika !== undefined) {
			polja.push("banner_slika=?");
			vrijednosti.push(podaci.bannerSlika);
		}
		if (podaci.video !== undefined) {
			polja.push("video=?");
			vrijednosti.push(podaci.video);
		}

		let azurirano = false;
		let filmPostoji: boolean | null = null;
		if (polja.length > 0) {
			vrijednosti.push(id);
			const sql = `UPDATE film SET ${polja.join(", ")} WHERE id = ?`;
			const rez = await this.baza.ubaciAzurirajPodatke(sql, vrijednosti);
			const promjene = Number(rez?.changes) || 0;
			if (promjene > 0) {
				azurirano = true;
			} else {
				filmPostoji = await this.postojiFilm(id);
				if (!filmPostoji) {
					return false;
				}
			}
		}

		if (podaci.zanroviIds !== undefined) {
			if (filmPostoji == null) {
				filmPostoji = await this.postojiFilm(id);
			}
			if (!filmPostoji) {
				return false;
			}
			await this.postaviZanrove(id, podaci.zanroviIds);
			azurirano = true;
		}
		return azurirano;
	}

	async obrisiFilm(id: number): Promise<boolean> {
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM zanr_film WHERE film_id=?",
			[id]
		);
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM kolekcija_film WHERE film_id = ?",
			[id]
		);
		const rez = await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM film WHERE id=?",
			[id]
		);
		return Number(rez?.changes) > 0;
	}

	async dodajFilmUKolekciju(
		filmId: number,
		kolekcijaId: number
	): Promise<boolean> {
		const postoji = await this.postojiFilmUKolekciji(filmId, kolekcijaId);
		if (postoji) {
			return false;
		}
		const sql =
			"INSERT OR IGNORE INTO kolekcija_film(film_id, kolekcija_id) VALUES(?,?)";
		const rez = await this.baza.ubaciAzurirajPodatke(sql, [
			filmId,
			kolekcijaId,
		]);
		return Number(rez?.changes) > 0;
	}

	async makniFilmIzKolekcija(
		filmId: number,
		kolekcijaId: number
	): Promise<boolean> {
		const sql = "DELETE FROM kolekcija_film WHERE film_id=? AND kolekcija_id=?";
		const rez = await this.baza.ubaciAzurirajPodatke(sql, [
			filmId,
			kolekcijaId,
		]);
		return Number(rez?.changes) > 0;
	}

	private async postojiFilm(id: number): Promise<boolean> {
		const sql = "SELECT 1 AS postoji FROM film WHERE id=? LIMIT 1";
		const rez = await this.baza.dajPodatke(sql, [id]);
		return rez.length > 0;
	}

	async dajSveZanrove(): Promise<Array<ZanrI>> {
		const sql = "SELECT id, naziv, opis FROM zanr ORDER BY naziv ASC";
		const redovi = await this.baza.dajPodatke(sql, []);
		const zanrovi: Array<ZanrI> = [];
		for (let red of redovi) {
			zanrovi.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"] ?? null,
			});
		}
		return zanrovi;
	}

	async spremiZanrove(zanrovi: Array<{ id: number; name?: string }>) {
		if (!Array.isArray(zanrovi) || zanrovi.length == 0) {
			return 0;
		}
		let dodao = 0;
		for (let z of zanrovi) {
			if (!z || !Number.isInteger(z.id)) continue;
			const sql =
				"INSERT OR IGNORE INTO zanr(id, naziv, opis) VALUES (?, ?, NULL)";
			const rez = await this.baza.ubaciAzurirajPodatke(sql, [
				z.id,
				z.name ?? String(z.id),
			]);
			dodao += Number(rez?.changes) || 0;
		}
		return dodao;
	}

	private async postaviZanrove(filmId: number, zanrovi: Array<number>) {
		await this.baza.ubaciAzurirajPodatke(
			"DELETE FROM zanr_film WHERE film_id=?",
			[filmId]
		);
		const jedinstevni = Array.from(
			new Set(
				zanrovi
					.map((z) => Number(z))
					.filter((z) => Number.isInteger(z) && z > 0)
			)
		);
		const dozvoljeni = await this.dajPostojeceZanrove(jedinstevni);
		for (let zanrId of dozvoljeni) {
			await this.baza.ubaciAzurirajPodatke(
				"INSERT OR IGNORE INTO zanr_film(film_id, zanr_id) VALUES(?,?)",
				[filmId, zanrId]
			);
		}
	}

	private async dajPostojeceZanrove(
		ids: Array<number>
	): Promise<Array<number>> {
		if (!Array.isArray(ids) || ids.length == 0) {
			return [];
		}
		const mjesta = ids.map(() => "?").join(",");
		const redovi = await this.baza.dajPodatke(
			`SELECT id FROM zanr WHERE id IN (${mjesta})`,
			ids
		);
		const postojeci = new Set<number>();
		for (let red of redovi) {
			postojeci.add(Number(red["id"]));
		}
		return ids.filter((id) => postojeci.has(id));
	}

	async dajZanroveZaFilma(filmId: number): Promise<Array<ZanrI>> {
		const sql =
			"SELECT z.id, z.naziv, z.opis FROM zanr z INNER JOIN zanr_film zf ON zf.zanr_id = z.id WHERE zf.film_id=? ORDER BY z.naziv ASC";
		const redovi = await this.baza.dajPodatke(sql, [filmId]);
		const zanroviFilm: Array<ZanrI> = [];
		for (let red of redovi) {
			zanroviFilm.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				opis: red["opis"] ?? null,
			});
		}
		return zanroviFilm;
	}

	private async dajKolekcijeZaFilm(
		filmId: number
	): Promise<Array<UnutarKolekcijaI>> {
		const sql =
			"SELECT k.id, k.naziv, k.slika_kolekcije AS slikaKolekcije FROM kolekcija k INNER JOIN kolekcija_film kf ON kf.kolekcija_id = k.id WHERE kf.film_id=?";
		const redovi = await this.baza.dajPodatke(sql, [filmId]);
		const kolekcijaFilm: Array<UnutarKolekcijaI> = [];
		for (let red of redovi) {
			kolekcijaFilm.push({
				id: Number(red["id"]),
				naziv: red["naziv"],
				slikaKolekcije: red["slikaKolekcije"] ?? null,
			});
		}
		return kolekcijaFilm;
	}

	private async nadjiPosotjiLiFilmUDB(
		naziv: string,
		datumPremijere: string
	): Promise<number | null> {
		const sql =
			"SELECT id FROM film WHERE LOWER(naziv)=LOWER(?) AND datum_premijere=? LIMIT 1";
		const rez = await this.baza.dajPodatke(sql, [naziv, datumPremijere]);
		if (!rez || rez.length == 0) {
			return null;
		}
		return Number(rez[0]["id"]) || null;
	}

	private async postojiFilmUKolekciji(
		filmId: number,
		kolekcijaId: number
	): Promise<boolean> {
		const sql =
			"SELECT 1 AS postoji FROM kolekcija_film WHERE film_id=? AND kolekcija_id=? LIMIT 1";
		const rez = await this.baza.dajPodatke(sql, [filmId, kolekcijaId]);
		return rez.length > 0;
	}
}
