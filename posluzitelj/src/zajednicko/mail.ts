import nodemailer from "nodemailer";

let mailer = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: "nkihas23@student.foi.hr",
		pass: "euxd mroo inil trrv",
	},
});

export async function posaljiMail(
	salje: string,
	prima: string,
	predmet: string,
	poruka: string
) {
	let message = {
		from: salje,
		to: prima,
		subject: predmet,
		text: poruka,
	};

	let odgovor = await mailer.sendMail(message);
	return odgovor;
}
