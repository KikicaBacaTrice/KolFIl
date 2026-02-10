import { PreferenceDAO } from "./preferenceDAO.js";
import { Request, Response } from "express";

export class RestPreference {
	private pdao: PreferenceDAO;

	constructor() {
		this.pdao = new PreferenceDAO();
	}

	async getPreference(zahtjev: Request, odgovor: Response) {
		odgovor.type("application/json");
		try {
			const preference = await this.pdao.dajSve();
			odgovor.send(JSON.stringify(preference));
		} catch (greksa) {
			odgovor.status(500);
			odgovor.json({ greska: "greska na serveru" });
		}
	}
}
