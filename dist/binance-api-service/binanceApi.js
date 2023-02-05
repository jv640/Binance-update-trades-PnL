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
exports.BinanceApi = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const nodeMail_1 = require("../nodeMail");
dotenv_1.default.config();
class BinanceApi {
    constructor() {
        this.APIKEY = process.env.API_KEY;
        this.SECRETKEY = process.env.SECRET_KEY || "";
        this.BASE_URL = process.env.BASE_URL;
        this.nodemail = new nodeMail_1.NodeMail();
    }
    getAccountInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = Date.now();
            const msg = `timestamp=${timestamp}`;
            const signature = crypto_1.default
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
            const data = yield axios_1.default.get(url, config);
            return data.data;
        });
    }
    getCurrentMonthTrades(time) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = Date.now();
            const msg = `startTime=${time}&endTime=${Math.min(time + 604800000, new Date().valueOf())}&timestamp=${timestamp}&limit=1000`;
            const signature = crypto_1.default
                .createHmac("SHA256", this.SECRETKEY)
                .update(msg)
                .digest("hex");
            return this.getTrades(msg, signature);
        });
    }
    getRecent7DaysTrades() {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = Date.now();
            const msg = `timestamp=${timestamp}&limit=1000`;
            const signature = crypto_1.default
                .createHmac("SHA256", this.SECRETKEY)
                .update(msg)
                .digest("hex");
            return this.getTrades(msg, signature);
        });
    }
    getTrades(msg, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    "X-MBX-APIKEY": this.APIKEY,
                },
            };
            const url = `${this.BASE_URL}/fapi/v1/userTrades?${msg}&signature=${signature}`;
            return axios_1.default
                .get(url, config)
                .then((response) => response.data)
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                const { response } = error;
                let errorMsg = "";
                if (response)
                    errorMsg = JSON.stringify(response.data);
                else
                    errorMsg = (error === null || error === void 0 ? void 0 : error.message) || JSON.stringify(error);
                yield this.nodemail.sendMail(`Get Trades call failed with reason: ${errorMsg}`);
                throw new Error(`Get Trades call failed with reason: ${errorMsg}`);
            }));
        });
    }
}
exports.BinanceApi = BinanceApi;
//# sourceMappingURL=binanceApi.js.map