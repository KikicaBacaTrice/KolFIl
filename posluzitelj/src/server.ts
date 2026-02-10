import cors from "cors";
import path from "path";
import fs from "fs";
import express, { Application } from "express";
import { dajPort } from "./zajednicko/esmPomocnik.js";
import { Konfiguracija } from "./zajednicko/konfiguracija.js";
import {
	pripremiPutanjeResursTMDB,
	pripremiPutanjeResursKorisnika,
	pripremiPutanjeResursKolekcija,
	pripremiPutanjeResursFilmova,
} from "./servis/servis.js";
import { __dirname } from "./zajednicko/esmPomocnik.js";
import sesija from "express-session";
import kolacici from "cookie-parser";

main(process.argv);

async function main(argv: Array<string>) {
	let port: number = dajPort("nkihas23");
	if (argv[3] != undefined) {
		port = parseInt(argv[3]);
	}

	let konf: Konfiguracija | null = null;
	try {
		konf = await inicjalizirajKonfiguraciju();
	} catch (greska: Error | any) {
		if (process.argv.length == 2)
			console.error("Potrebno je dati naziv datoteke");
		else if (greska.path != undefined)
			console.error("Nije moguće otvoriti datoteku: " + greska.path);
		else console.log(greska.message);
		process.exit();
	}

	const server: Application = express();

	inicjalizirajPostavkeServera(server, konf);

	pripremiPutanjeServera(server, konf, port);
	pokreniServer(server, port);
}

async function inicjalizirajKonfiguraciju(): Promise<Konfiguracija> {
	let konf = new Konfiguracija();
	await konf.ucitajKonfiguraciju();
	return konf;
}

function pripremiPutanjeServera(
	server: Application,
	konf: Konfiguracija,
	port: number
) {
	pripremiPutanjeResursKorisnika(server, konf);
	pripremiPutanjeResursTMDB(server, konf);
	pripremiPutanjeResursKolekcija(server, konf);
	pripremiPutanjeResursFilmova(server, konf);

	pripremiStaticnePutanje(server);
	pripremiPutanjeAngularAplikacije(server);

	server.use((zahtjev, odgovor) => {
		odgovor.status(404);
		var poruka = { greska: "nepostojeći resurs" };
		odgovor.send(JSON.stringify(poruka));
	});
}

function inicjalizirajPostavkeServera(
	server: Application,
	konf: Konfiguracija
) {
	server.use(express.json());
	server.use(express.urlencoded({ extended: true }));
	server.use(
		cors({
			origin: (origin, povratniPoziv) => {
				console.log(origin);
				if (
					!origin ||
					origin.startsWith("http://spider.foi.hr:") ||
					origin.startsWith("http://localhost:")
				) {
					povratniPoziv(null, true);
				} else {
					povratniPoziv(new Error("Nije dozvoljeno zbog CORS"));
				}
			},
			credentials: true,
			optionsSuccessStatus: 200,
		})
	);

	server.use(kolacici());
	server.use(
		sesija({
			secret: konf.dajKonf().tajniKljucSesija,
			saveUninitialized: true,
			cookie: { maxAge: 1000 * 60 * 60 * 3 },
			resave: false,
		})
	);
}

function pripremiPutanjeAngularAplikacije(server: Application) {
	const angularRoot = path.resolve(process.cwd(), "angular");
	const angularBrowser = path.join(angularRoot, "browser");
	const angularBuildPutanja = fs.existsSync(angularBrowser)
		? angularBrowser
		: angularRoot;
	server.use(express.static(angularBuildPutanja));
	server.get(/^(?!\/api\/).*/, (zahtjev, odgovor) => {
		odgovor.sendFile(path.join(angularBuildPutanja, "index.html"));
	});
}

function pripremiStaticnePutanje(server: Application) {
	server.use("/js", express.static(__dirname() + "/jsk"));
	server.use("/css", express.static(__dirname() + "/css"));
	server.use("/slike", express.static(__dirname() + "/slike"));
}

function pokreniServer(server: Application, port: number) {
	server.listen(port, () => {
		console.log(`Server pokrenut na portu: ${port}`);
	});
}
