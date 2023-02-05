import nodemailer from "nodemailer";
export class NodeMail {
    transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: process.env.HOTMAIL_USER_EMAIL || "",
            pass: process.env.HOTMAIL_PASS || "",
        },
    });

    async sendMail(body) {
        await this.transporter
            .sendMail({
                from: `"Your binance Script 👻" <${process.env.HOTMAIL_USER_EMAIL}>`,
                to: [
                    process.env.ALERT_EMAIL1 || "",
                    process.env.ALERT_EMAIL2 || "",
                ],
                subject: "Hello ✔, Asshole",
                text: `You resting your script got fucked with these reasons ${body}`,
                // html: "<b>Script fucked<b>",
            })
            .catch((error) => {
                console.log(
                    "🚀 ~ file: nodeMail.ts:20 ~ NodeMail ~ sendMail ~ error",
                    error
                );
            });
    }
}
