import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
dotenv.config();

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (to, subject, text, scheduleTime = null) => {
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY is missing in backend .env");
  }

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing in backend .env");
  }
console.log("BREVO_API_KEY:", brevoApiKey);
console.log("BREVO_SENDER_EMAIL:", senderEmail);
console.log("KEY LENGTH:", brevoApiKey.length);
  apiKey.apiKey = brevoApiKey;

  const emailData = {
    sender: {
      email: senderEmail,
      name: "CareerConnect",
    },
    to: [{ email: to }],
    subject,
    textContent: text,
  };

  if (scheduleTime) {
    emailData.scheduledAt = scheduleTime.toISOString();
  }

  try {
    await tranEmailApi.sendTransacEmail(emailData);
  } catch (error) {
    const brevoMessage =
      error?.response?.body?.message ||
      error?.response?.text ||
      error?.message ||
      "Unknown Brevo error";

    throw new Error(`Brevo email failed: ${brevoMessage}`);
  }
};
