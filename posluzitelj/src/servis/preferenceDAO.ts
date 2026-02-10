import { PreferenceI } from "../servisI/korisniciI.js";
import Baza from "../zajednicko/sqliteBaza.js";

export class PreferenceDAO {
	private baza: Baza;

	constructor() {
		this.baza = new Baza("podaci/RWA2025nkihas23.sqlite");
		this.baza.spoji();
	}

	async dajSve(): Promise<Array<PreferenceI>> {
		const sql = "SELECT id, naziv, opis FROM preference ORDER BY naziv ASC";
		const podaci = (await this.baza.dajPodatke(sql, [])) as Array<PreferenceI>;
		const rezultat: Array<PreferenceI> = [];

		for (let p of podaci) {
			rezultat.push({
				id: p["id"],
				naziv: p["naziv"],
				opis: p["opis"] ?? null,
			});
		}
		return rezultat;
	}
}
