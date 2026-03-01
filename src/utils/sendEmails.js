import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.BREVO_SMTP_USER,
    to,
    subject,
    text,
  });
};
transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP VERIFY ERROR:", error);
  } else {
    console.log("SMTP Server is ready");
  }
});