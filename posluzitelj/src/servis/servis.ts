import { RestKorisnik } from "./restKorisnik.js";
import { RestTMDB } from "./restTMDB.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";
import { Application } from "express";
import { RestPreference } from "./restPreference.js";
import { RestKolekcije } from "./restKolekcije.js";
import { RestFilm } from "./restFilm.js";

export function pripremiPutanjeResursTMDB(
	server: Application,
	konf: Konfiguracija
) {
	let restTMDB = new RestTMDB(konf.dajKonf()["tmdbApiKeyV3"]);
	server.get("/api/gost/tmdb/zanr", restTMDB.getZanr.bind(restTMDB));
	server.post(
		"/api/gost/tmdb/zanr/postavi",
		restTMDB.postZanrUBazu.bind(restTMDB)
	);
	server.get("/api/tmdb/film/:id", restTMDB.getFilm.bind(restTMDB));
	server.get("/api/tmdb/filmovi", restTMDB.getFilmovi.bind(restTMDB));
	server.get(
		"/api/tmdb/nasumceFilm",
		restTMDB.dohvatiNasumceFilm.bind(restTMDB)
	);
	server.get(
		"/api/tmdb/animirani/najboljeOcijenjeni",
		restTMDB.getNajboljeOcijenjeniAnimirani.bind(restTMDB)
	);
}

export function pripremiPutanjeResursKorisnika(
	server: Application,
	konf: Konfiguracija
) {
	let restKorisnik = new RestKorisnik();
	let restPreference = new RestPreference();

	server.get("/api/korisnici", restKorisnik.getKorisnici.bind(restKorisnik));
	server.post(
		"/api/gost/korisnici",
		restKorisnik.postKorisnici.bind(restKorisnik)
	);
	server.get(
		"/aktivacijaRacuna",
		restKorisnik.getAktivacijaRacuna.bind(restKorisnik)
	);
	server.get(
		"/api/korisnici/:korime",
		restKorisnik.getKorisnik.bind(restKorisnik)
	);
	server.post(
		"/api/gost/korisnici/:korime/prijava",
		restKorisnik.getKorisnikPrijava.bind(restKorisnik)
	);
	server.get("/api/sesija", restKorisnik.getSesija.bind(restKorisnik));
	server.post("/api/odjava", restKorisnik.postOdjava.bind(restKorisnik));
	server.put(
		"/api/korisnici/:korime",
		restKorisnik.putKorisnik.bind(restKorisnik)
	);
	server.delete(
		"/api/korisnici/:korime",
		restKorisnik.deleteKorisnik.bind(restKorisnik)
	);
	server.put(
		"/api/korisnici/:korime/tip",
		restKorisnik.putTipKorisnika.bind(restKorisnik)
	);
	server.put(
		"/api/korisnici/:korime/blokada",
		restKorisnik.putBlokadaKorisnik.bind(restKorisnik)
	);
	server.get(
		"/api/gost/preference",
		restPreference.getPreference.bind(restPreference)
	);
}

export function pripremiPutanjeResursKolekcija(
	server: Application,
	konf: Konfiguracija
) {
	let restKolekcije = new RestKolekcije();
	server.get(
		"/api/gost/javneKolekcije",
		restKolekcije.getJavneKolekcije.bind(restKolekcije)
	);
	server.get("/api/kolekcije", restKolekcije.getSve.bind(restKolekcije));
	server.get(
		"/api/kolekcije/:id",
		restKolekcije.getKolekcija.bind(restKolekcije)
	);
	server.post(
		"/api/kolekcije",
		restKolekcije.postKolekcije.bind(restKolekcije)
	);
	server.put(
		"/api/kolekcije/:id",
		restKolekcije.putKolekcija.bind(restKolekcije)
	);
	server.delete(
		"/api/kolekcije/:id",
		restKolekcije.deleteKolekcija.bind(restKolekcije)
	);
	server.post(
		"/api/kolekcije/:id/filmovi",
		restKolekcije.postKolekcijaFilm.bind(restKolekcije)
	);
	server.delete(
		"/api/kolekcije/:id/filmovi/:filmId",
		restKolekcije.deleteKolekcijaFilm.bind(restKolekcije)
	);
	server.post(
		"/api/kolekcije/:id/korisnici",
		restKolekcije.postKolekcijaKorisnik.bind(restKolekcije)
	);
	server.delete(
		"/api/kolekcije/:id/:korisnikId",
		restKolekcije.deleteKolekcijaKorisnik.bind(restKolekcije)
	);
}

export function pripremiPutanjeResursFilmova(
	server: Application,
	konf: Konfiguracija
) {
	let restFilm = new RestFilm();
	server.get("/api/gost/javniFilmovi", restFilm.getJavniFilmovi.bind(restFilm));
	server.get(
		"/api/javniFilmoviFilter",
		restFilm.getJavneFilmoveFilter.bind(restFilm)
	);
	server.get("/api/filmovi", restFilm.getFilmove.bind(restFilm));
	server.get(
		"/api/filmovi/pretraga",
		restFilm.getFilmPoNazivuIDatumu.bind(restFilm)
	);
	server.get("/api/filmovi/:id", restFilm.getFilm.bind(restFilm));
	server.post("/api/filmovi", restFilm.postFilm.bind(restFilm));
	server.put("/api/filmovi/:id", restFilm.putFilm.bind(restFilm));
	server.delete("/api/filmovi/:id", restFilm.deleteFilm.bind(restFilm));
	server.post(
		"/api/filmovi/:id/kolekcije",
		restFilm.postFilmKolekcija.bind(restFilm)
	);
	server.delete(
		"/api/filmovi/:id/kolekcije/:kolekcijaId",
		restFilm.deleteFilmKolekcija.bind(restFilm)
	);
	server.get("/api/zanrovi", restFilm.getZanorovi.bind(restFilm));
}
