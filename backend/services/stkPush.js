import axios from "axios";
import moment from "moment";
import dotenv from "dotenv";
import { getAccessToken } from "./mpesaToken.js";

dotenv.config();

export const stkPush = async (phone, amount) => {
  try {

    // =====================================
    // FORMAT PHONE NUMBER
    // =====================================
    phone = String(phone).trim();

    // Remove +
    if (phone.startsWith("+")) {
      phone = phone.slice(1);
    }

    // Convert 07xxxxxxxx -> 2547xxxxxxxx
    if (phone.startsWith("0")) {
      phone = `254${phone.slice(1)}`;
    }

    const formattedPhone = phone;

    console.log("FORMATTED PHONE:", formattedPhone);

    // =====================================
    // GET ACCESS TOKEN
    // =====================================
    const token = await getAccessToken();

    console.log("ACCESS TOKEN:", token);

    // =====================================
    // TIMESTAMP
    // =====================================
    const timestamp = moment().format("YYYYMMDDHHmmss");

    console.log("TIMESTAMP:", timestamp);
    console.log("SHORTCODE:", process.env.MPESA_SHORTCODE);
console.log("PASSKEY:", process.env.MPESA_PASSKEY);
console.log("TIMESTAMP:", timestamp);

    // =====================================
    // PASSWORD
    // =====================================
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    console.log("GENERATED PASSWORD:", password);
    console.log("SHORTCODE:", process.env.MPESA_SHORTCODE);
console.log("PASSKEY:", process.env.MPESA_PASSKEY);

    // =====================================
    // REQUEST DATA
    // =====================================
    const data = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Number(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: "VESTORA",
      TransactionDesc: "Deposit",
    };

    console.log("=====================================");
    console.log("STK REQUEST DATA:");
    console.log(JSON.stringify(data, null, 2));
    console.log("=====================================");

    // =====================================
    // SEND STK PUSH
    // =====================================
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("=====================================");
    console.log("STK SUCCESS:");
    console.log(response.data);
    console.log("=====================================");

    return response.data;

  } catch (error) {

    console.log("=====================================");
    console.log("🔥 STK PUSH ERROR");
    console.log("=====================================");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    console.log("=====================================");

    throw error;
  }
};