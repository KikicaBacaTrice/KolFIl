import dsPromise from "fs/promises";

type tipKonf = {
	tajniKljucSesija: string;
	stranicaLimit: number;
	tmdbApiKeyV3: string;
	tmdbApiKeyV4: string;
};

export class Konfiguracija {
	private konf: tipKonf;
	constructor() {
		this.konf = this.initKonf();
	}

	private initKonf() {
		return {
			tajniKljucSesija: "",
			stranicaLimit: 0,
			tmdbApiKeyV3: "",
			tmdbApiKeyV4: "",
		};
	}

	public dajKonf() {
		return this.konf;
	}

	public async ucitajKonfiguraciju() {
		const putanja: string = process.argv[2] ?? "podaci/konfiguracija.csv";

		const podaci: string = await dsPromise.readFile(putanja, {
			encoding: "utf-8",
		});
		this.procitajKonfigCSV(podaci);
		this.provjeriPodatkeKonfiguracije();
	}

	private procitajKonfigCSV(podaci: string) {
		let konf: { [kljuc: string]: string } = {};
		const linije = podaci.split(/\r?\n/);
		for (let linija of linije) {
			if (!linija.trim()) continue;
			const dijelovi = linija.split("$");
			if (dijelovi.length !== 2) {
				throw new Error(
					"Neispravan format konfiguracije (koristiti naziv$vrijednost)."
				);
			}
			const naziv = dijelovi[0]?.trim();
			const vrijednost = dijelovi[1] ?? "";
			if (!naziv) continue;
			if (vrijednost.includes("$")) {
				throw new Error(`Vrijednost za '${naziv}' ne smije sadrzavati '$'.`);
			}
			konf[naziv] = vrijednost.trim();
		}

		this.konf = {
			tajniKljucSesija: konf["tajniKljucSesija"] ?? "",
			stranicaLimit: Number.parseInt(konf["stranicaLimit"] ?? "0"),
			tmdbApiKeyV3: konf["tmdbApiKeyV3"] ?? "",
			tmdbApiKeyV4: konf["tmdbApiKeyV4"] ?? "",
		};
	}

	private provjeriPodatkeKonfiguracije() {
		if (
			this.konf.tajniKljucSesija == undefined ||
			!/^[a-z0-9!%$]{100,200}$/.test(this.konf.tajniKljucSesija)
		) {
			throw new Error(
				"Neispravan tajniKljucSesija (100-200 znakova, mala slova, brojke, !%$)."
			);
		}

		if (
			this.konf.stranicaLimit == undefined ||
			Number.isNaN(this.konf.stranicaLimit) ||
			this.konf.stranicaLimit < 10 ||
			this.konf.stranicaLimit > 50
		) {
			throw new Error("Neispravan stranicaLimit (broj 10-50).");
		}

		if (
			this.konf.tmdbApiKeyV3 == undefined ||
			this.konf.tmdbApiKeyV3.trim() === ""
		) {
			throw new Error("Fali TMDB API kljuc u tmdbApiKeyV3.");
		}

		if (
			this.konf.tmdbApiKeyV4 == undefined ||
			this.konf.tmdbApiKeyV4.trim() === ""
		) {
			throw new Error("Fali TMDB API kljuc u tmdbApiKeyV4.");
		}
	}
}
