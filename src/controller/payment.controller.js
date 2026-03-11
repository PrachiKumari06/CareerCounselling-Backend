import crypto from "crypto";
import supabase from "../config/supabase.config.js";
import { sendEmail } from "../utils/sendEmails.js";

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    counselor_id,
    session_date
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  // create session after payment success
  const { data, error } = await supabase
    .from("sessions")
    .insert([
      {
        user_id: req.user.id,
        counselor_id,
        session_date,
         payment_status: "paid"
      }
    ])
    .select()
    .single();

  if (error) return res.status(400).json(error);

  // send email
  try {
    const { data: counselor } = await supabase
      .from("career_profiles")
      .select("full_name")
      .eq("user_id", counselor_id)
      .single();

    const { data: userData } =
      await supabase.auth.admin.getUserById(req.user.id);

    const studentEmail = userData?.user?.email;

    if (studentEmail) {
      await sendEmail(
        studentEmail,
        "Session Booked Successfully",
        `
Hello,

Your session has been booked successfully.

Counselor: ${counselor.full_name}
Date: ${new Date(session_date).toLocaleString()}
Status: Pending approval

Thank you.
`
      );
    }
  } catch (err) {
    console.log("Email error:", err.message);
  }

  res.json({
    message: "Payment verified and session booked , check your mail!"
  });
};