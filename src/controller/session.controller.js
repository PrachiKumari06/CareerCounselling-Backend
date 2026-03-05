import supabase from "../config/supabase.config.js";
import { sendEmail } from "../utils/sendEmails.js";
import razorpay from "../utils/razorpay.js";

export const bookSession = async (req, res) => {
  const { counselor_id, session_date } = req.body;

  if (req.user.id === counselor_id) {
    return res.status(400).json({ error: "You cannot book yourself" });
  }
  console.log("bookSession API called");
console.log("User ID:", req.user.id);
// check how many sessions user already has
const { data: sessions } = await supabase
  .from("sessions")
  .select("id")
  .eq("user_id", req.user.id)
  .eq("counselor_id", counselor_id); //check with parsticular counsellor how much session : if one free then paid

const count = sessions?.length || 0;

console.log("Session count:", count);

// first session free
if (count === 0) {
  console.log("First session free");
} else {
const { data: counselorPrice } = await supabase
  .from("career_profiles")
  .select("session_price")
  .eq("user_id", counselor_id)
  .single();

const order = await razorpay.orders.create({   //payment procedure based on counsellor price for per session
  amount: counselorPrice.session_price * 100,
  currency: "INR",
  receipt: `receipt_${Date.now()}`
});

  return res.json({
    paymentRequired: true,
    order
  });
}
  const { data, error } = await supabase
    .from("sessions")
    .insert([
      {
        user_id: req.user.id,
        counselor_id,
        session_date,
      },
    ])
    .select()
    .single();

  if (error) return res.status(400).json(error);

  const { data: counselor } = await supabase
    .from("career_profiles")
    .select("full_name")
    .eq("user_id", counselor_id)
    .single();

  const { data: userData } =
    await supabase.auth.admin.getUserById(req.user.id);

  const studentEmail = userData?.user?.email;

  if (!studentEmail) {
    return res.status(400).json({ error: "User email not found" });
  }

  try {
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
    console.log("Email sent successfully");
  } catch (err) {
    console.log("Email failed:", err.message);
  }

  res.json({ message: "Session booked successfully" });
};
// user when they want to see their sessions
export const getMySessions = async (req, res) => {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
  id,
  session_date,
  status,
  meeting_link,
  profiles!sessions_counselor_id_fkey (
    career_profiles!career_profiles_user_id_fkey (
      full_name
    )
  )
`)
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json(error);

  res.json(data);
};
// counselor when they want to see their sessions to accept request
export const getCounselorSessions = async (req, res) => {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id,
      session_date,
      status,
      meeting_link,
      profiles!sessions_user_id_fkey (
        career_profiles!career_profiles_user_id_fkey (
          full_name,
          education,
          skills,
          interests
        )
      )
    `)
    .eq("counselor_id", req.user.id);

  if (error) {
    console.log(" Supabase Error:", error);
    return res.status(400).json(error);
  }

  res.json(data);
};
// counselor can accept or reject session request by updating status
export const updateSessionStatus = async (req, res) => {
  const { id } = req.params;
  const { status, meeting_link } = req.body;

  const updateData = { status };
//if approved then we will send the link
  if (status === "approved" && meeting_link) {
    updateData.meeting_link = meeting_link;
  }

  // get updated session
  const { data: session, error } = await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", id)
    .eq("counselor_id", req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json(error);

  // Only if approved
  if (status === "approved") {
    try {
      const { data: userData } =
        await supabase.auth.admin.getUserById(session.user_id);

      const studentEmail = userData?.user?.email;

      if (studentEmail) {
        const sessionTime = new Date(session.session_date);

        // 1️. Send approval email immediately
        await sendEmail(
          studentEmail,
          "Session Approved 🎉",
          `
Hello,

Your session has been approved!

Date: ${sessionTime.toLocaleString()}
Meeting Link: ${meeting_link}

Please join on time.

Thank you.
`
        );

        // 2️. Schedule reminder 1 hour before
        const reminderTime = new Date(
          sessionTime.getTime() - 60 * 60 * 1000
        );
console.log("Session Date Raw:", session.session_date);
console.log("Session Time Parsed:", sessionTime);
console.log("Reminder Time:", reminderTime);
console.log("Current Time:", new Date());
console.log("Reminder scheduled for:", reminderTime.toISOString());
        // Only schedule if reminder time is future
        if (reminderTime > new Date()) {
          await sendEmail(
            studentEmail,
            "Session Reminder ⏰",
            `
Reminder:

Your session is scheduled at:
${sessionTime.toLocaleString()}

Please join on time.
`,
            reminderTime // pass scheduled time
          );
        }
      }
    } catch (err) {
      console.log("Email process failed:", err.message);
    }
  }

  res.json({ message: "Session updated successfully" });
};