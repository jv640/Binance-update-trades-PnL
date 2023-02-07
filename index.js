import { BinanceApi } from './binance-api-service/binanceApi.js'
import { google } from "googleapis"
import dotenv from 'dotenv'
import nodeCron from 'node-cron'
import { NodeMail } from './nodeMail.js';
import express  from 'express';
dotenv.config();

const binanceApi = new BinanceApi()
const nodemail = new NodeMail()
const app = express()

app.get('/', (req, res) => {
    res.send("Hello Dude!!")
})

app.get('/run-my-script', async (req, res) => {
    await main()
    await nodemail.sendMail(`Trades updated successfully`)
    res.send("Script ran successfully")
})
app.listen(3000, () => {
    console.log('App is running')
})

async function getGoogleAuthAndSpreadSheet() {
    try {
        const credentials = {
            type: "service_account",
            project_id: process.env.PROJECT_ID,
            private_key_id: process.env.PRIVATE_KEY_ID,
            private_key: process.env.PRIVATE_KEY,
            client_email: process.env.CLIENT_EMAIL,
            client_id: process.env.CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        }

        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        // Create client instance for auth
        const client = await auth.getClient();

        // Instance of Google Sheets API
        const googleSheets = google.sheets({ version: "v4", auth: client });

        return { auth, googleSheets }
    } catch (error) {
        const errMsg = `Google Auth failed with reason: ${JSON.stringify(error?.message || error)}`
        await nodemail.sendMail(errMsg)
        throw new Error(errMsg);
    }
}

function filterUniqueTrades(tradesFromBinance, tradesAlreadyInSheet= []) {
    try {
        let result= []
        let duplicate = 0
        tradesFromBinance.forEach((element) => {
            if (tradesAlreadyInSheet.find(orderId => orderId == element.id)) {
                console.log('duplicate order', element.id)
                duplicate = duplicate + 1
            }
            else {
                result.push(Object.values(element))
            }
        });
        console.log("Total trade came was ", tradesFromBinance.length)
        console.log("Total duplicate trade was ", duplicate)
        return result
    } catch (error) {
        const errMsg = `Filter unique trades function failed with reason: ${JSON.stringify(error?.message || error)}`
        nodemail.sendMail(errMsg)
        throw new Error(errMsg);
    }
}


async function updateTotalTrades(auth, googleSheets) {
    console.log("🚀 ~ Updating overall trades start")
    const tradesInfo = await binanceApi.getRecent7DaysTrades()

    if (!tradesInfo) {
        throw new Error("Not able to get trade infor");
    }
    const spreadsheetId = process.env.OVERALL_SPREADSHEET_ID;

    const tradesFromSheet = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!B2:B",
    }).catch(async (error) => {
        const { response } = error;
        let errorMsg = ''
        if (response)
            errorMsg = JSON.stringify(response.data)
        else
            errorMsg = error?.message || JSON.stringify(error)
        await nodemail.sendMail(`Get Trades from spreadSheet while updating overall trades failed with reason: ${errorMsg}`)
        throw new Error(`Get Trades from spreadSheet while updating overall trades failed with reason: ${errorMsg}`)
    })

    const filteredTrades = filterUniqueTrades(tradesInfo, tradesFromSheet?.data?.values?.flat(1))

    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1!A:O",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: filteredTrades,
        },
    }).catch(async (error) => {
        const { response } = error;
        let errorMsg = ''
        if (response)
            errorMsg = JSON.stringify(response.data)
        else
            errorMsg = error?.message || JSON.stringify(error)
        await nodemail.sendMail(`Append Trades to spreadSheet while updating overall trades failed with reason: ${errorMsg}`)
        throw new Error(`Append Trades to spreadSheet while updating overall trades failed with reason: ${errorMsg}`)
    })
    console.log("🚀 ~ Updating overall trades completed with success")
}

function getCurrentMonthTimestamps() {
    var offset = (new Date().getTimezoneOffset() / 60) * -1;
    var tmpDate = new Date(new Date().getTime() + offset);
    var firstDay = new Date(tmpDate.getFullYear(), tmpDate.getMonth(), 1).valueOf();
    var lastDay = new Date(tmpDate.getFullYear(), tmpDate.getMonth() + 1, 0).valueOf();
    const currentMonth = tmpDate.toLocaleString('default', { month: 'short' });

    return { firstDay, lastDay, currentMonth }
}

async function updateCurrentMonthTrades(auth, googleSheets) {
    console.log("🚀 ~ Updating current month trades started")

    const { firstDay, lastDay, currentMonth } = getCurrentMonthTimestamps()
    const spreadsheetId = process.env.CURRENT_MONTH_SPREADSHEET_ID

    const sheetMetadata = await googleSheets.spreadsheets.get({
        spreadsheetId,
    }).catch(async (error) => {
        const { response } = error;
        let errorMsg = ''
        if (response)
            errorMsg = JSON.stringify(response.data)
        else
            errorMsg = error?.message || JSON.stringify(error)
        await nodemail.sendMail(`Get metadata from current month spreadSheet while updating current month trades failed with reason: ${errorMsg}`)
        throw new Error(`Get metadata from current month spreadSheet while updating current month trades failed with reason: ${errorMsg}`)
    })

    const title = sheetMetadata.data.properties.title

    if (!title) {
        throw new Error("Failed to get title");
    }
    const sheetMonth = title.substring(title.lastIndexOf(" ") + 1);

    if (sheetMonth !== currentMonth) {
        await nodemail.sendMail('Create new Spreate sheet and update the spreadSheet Id of current month in environment')
        throw new Error("Create new Spreate sheet and update the spreadSheet Id of current month in environment");
    }
    let tradesInfo = []
    let totalTrades = 0
    for (let i = firstDay; i < Math.min(new Date().valueOf(), lastDay); i = i + 604800000) {
        const trades = await binanceApi.getCurrentMonthTrades(i)
        console.log("🚀 ~ file: index.ts:52 ~ main ~ trades", trades.length, i)
        totalTrades = totalTrades + trades.length

        if (!trades) {
            throw new Error("Not able to get trade infor");
        }

        tradesInfo.push(trades)
    }

    if (!tradesInfo) {
        throw new Error("Not able to get trade infor");
    }

    tradesInfo = tradesInfo.flat(1)

    const tradesFromSheet = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!B2:B",
    }).catch(async (error) => {
        const { response } = error;
        let errorMsg = ''
        if (response)
            errorMsg = JSON.stringify(response.data)
        else
            errorMsg = error?.message || JSON.stringify(error)
        await nodemail.sendMail(`Get Trades from spreadSheet while updating current month trades failed with reason: ${errorMsg}`)
        throw new Error(`Get Trades from spreadSheet while updating current month trades failed with reason: ${errorMsg}`)
    })

    const filteredTrades = filterUniqueTrades(tradesInfo, tradesFromSheet?.data?.values?.flat(1))

    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1!A:O",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: filteredTrades,
        },
    }).catch(async (error) => {
        const { response } = error;
        let errorMsg = ''
        if (response)
            errorMsg = JSON.stringify(response.data)
        else
            errorMsg = error?.message || JSON.stringify(error)
        await nodemail.sendMail(`Append Trades from spreadSheet while updating current month trades failed with reason: ${errorMsg}`)
        throw new Error(`Append Trades from spreadSheet while updating current month trades failed with reason: ${errorMsg}`)
    })
    console.log("🚀 ~ Updating current month trades completed with success")
}


async function main() {
    console.log('Job running successfully')
    const { auth, googleSheets } = await getGoogleAuthAndSpreadSheet()

    nodeCron.schedule('0 0 0 * * *', async () => {
        // This job will run every day
        console.log('Cron job started successfully', new Date().toLocaleTimeString());
        await updateTotalTrades(auth, googleSheets)
        await updateCurrentMonthTrades(auth, googleSheets)
    })
}