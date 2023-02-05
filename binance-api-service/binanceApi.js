import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";
import { NodeMail } from "../nodeMail.js";

dotenv.config();
export class BinanceApi {
    APIKEY = process.env.API_KEY;
    SECRETKEY = process.env.SECRET_KEY || "";
    BASE_URL = process.env.BASE_URL;

    nodemail = new NodeMail();

    async getAccountInfo() {
        const timestamp = Date.now();
        const msg = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac("SHA256", this.SECRETKEY)
            .update(msg)
            .digest("hex");

        const config = {
            headers: {
                "Content-Type": "application/json",
                "X-MBX-APIKEY": this.APIKEY,
            },
        };

        const url = `${this.BASE_URL}/fapi/v2/account?${msg}&signature=${signature}`;
        const data = await axios.get(url, config);

        return data.data;
    }

    async getCurrentMonthTrades(time) {
        const timestamp = Date.now();
        const msg = `startTime=${time}&endTime=${Math.min(
            time + 604800000,
            new Date().valueOf()
        )}&timestamp=${timestamp}&limit=1000`;
        const signature = crypto
            .createHmac("SHA256", this.SECRETKEY)
            .update(msg)
            .digest("hex");

        return this.getTrades(msg, signature);
    }

    async getRecent7DaysTrades() {
        const timestamp = Date.now();
        const msg = `timestamp=${timestamp}&limit=1000`;
        const signature = crypto
            .createHmac("SHA256", this.SECRETKEY)
            .update(msg)
            .digest("hex");
        return this.getTrades(msg, signature);
    }

    async getTrades(msg, signature) {
        const config = {
            headers: {
                "Content-Type": "application/json",
                "X-MBX-APIKEY": this.APIKEY,
            },
        };

        const url = `${this.BASE_URL}/fapi/v1/userTrades?${msg}&signature=${signature}`;
        return axios
            .get(url, config)
            .then((response) => response.data)
            .catch(async (error) => {
                const { response } = error;
                let errorMsg = "";
                if (response) errorMsg = JSON.stringify(response.data);
                else errorMsg = error?.message || JSON.stringify(error);
                await this.nodemail.sendMail(
                    `Get Trades call failed with reason: ${errorMsg}`
                );
                throw new Error(
                    `Get Trades call failed with reason: ${errorMsg}`
                );
            });
    }
}
