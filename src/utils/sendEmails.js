import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
dotenv.config();

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (to, subject, text) => {
  await tranEmailApi.sendTransacEmail({
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "CareerConnect",
    },
    to: [{ email: to }],
    subject,
    textContent: text,
  });
};