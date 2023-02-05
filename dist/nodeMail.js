"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class NodeMail {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: "hotmail",
            auth: {
                user: process.env.HOTMAIL_USER_EMAIL || "",
                pass: process.env.HOTMAIL_PASS || "",
            },
        });
    }
    sendMail(body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transporter
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
                console.log("🚀 ~ file: nodeMail.ts:20 ~ NodeMail ~ sendMail ~ error", error);
            });
        });
    }
}
exports.NodeMail = NodeMail;
//# sourceMappingURL=nodeMail.js.map