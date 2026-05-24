import supabase from "../config/supabase.config.js";
import { sendEmail } from "../utils/sendEmails.js";
import razorpay from "../utils/razorpay.js";

const REMINDER_MINUTES_BEFORE_SESSION = 30;

const formatSessionDate = (sessionDate) =>
  new Date(sessionDate).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getStudentEmail = async (userId) => {
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  return userData?.user?.email;
};

const getCounselorName = async (counselorId) => {
  const { data: counselor } = await supabase
    .from("career_profiles")
    .select("full_name")
    .eq("user_id", counselorId)
    .single();

  return counselor?.full_name || "Your counselor";
};

const scheduleSessionReminder = async ({
  studentEmail,
  counselorName,
  sessionDate,
  meetingLink,
}) => {
  const sessionStart = new Date(sessionDate);
  const reminderAt = new Date(
    sessionStart.getTime() - REMINDER_MINUTES_BEFORE_SESSION * 60 * 1000
  );

  if (Number.isNaN(sessionStart.getTime()) || reminderAt <= new Date()) {
    return;
  }

  await sendEmail(
    studentEmail,
    "Reminder: Your counseling session starts soon",
    `
Hello,

This is a reminder that your counseling session starts in ${REMINDER_MINUTES_BEFORE_SESSION} minutes.

Counselor: ${counselorName}
Date: ${formatSessionDate(sessionDate)}
Meeting Link: ${meetingLink || "The counselor will share it before the session."}

All the best.
`,
    reminderAt
  );
};

export const sendSessionBookedEmail = async ({
  studentEmail,
  counselorName,
  sessionDate,
}) => {
  await sendEmail(
    studentEmail,
    "Session Booked Successfully",
    `
Hello,

Your session has been booked successfully.

Counselor: ${counselorName}
Date: ${formatSessionDate(sessionDate)}
Status: Pending approval

You will receive another email after the counselor approves it.

Thank you.
`
  );
};

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
        payment_status: "free"
      },
    ])
    .select()
    .single();

  if (error) return res.status(400).json(error);

  const counselorName = await getCounselorName(counselor_id);
  const studentEmail = await getStudentEmail(req.user.id);

  if (!studentEmail) {
    return res.status(400).json({ error: "User email not found" });
  }

  try {
    await sendSessionBookedEmail({
      studentEmail,
      counselorName,
      sessionDate: session_date,
    });
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
  rejection_reason,
  reschedule_reason,
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
      rejection_reason,
      reschedule_reason,
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
  const { status, meeting_link, rejection_reason } = req.body;

  let updateData = { status };

  if (status === "approved") {
    updateData.meeting_link = meeting_link;
  }

  if (status === "rejected") {
    updateData.rejection_reason = rejection_reason;
  }

  const { error } = await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", id);

  if (error) return res.status(400).json(error);

  try {
    const { data: session } = await supabase
      .from("sessions")
      .select("user_id, counselor_id, session_date")
      .eq("id", id)
      .single();

    const studentEmail = session?.user_id
      ? await getStudentEmail(session.user_id)
      : null;
    const counselorName = session?.counselor_id
      ? await getCounselorName(session.counselor_id)
      : "Your counselor";

    if (studentEmail && session) {
      if (status === "approved") {
        await sendEmail(
          studentEmail,
          "Your counseling session is approved",
          `
Hello,

Your counseling session has been approved.

Counselor: ${counselorName}
Date: ${formatSessionDate(session.session_date)}
Meeting Link: ${meeting_link || "The counselor will share it before the session."}

Thank you.
`
        );

        await scheduleSessionReminder({
          studentEmail,
          counselorName,
          sessionDate: session.session_date,
          meetingLink: meeting_link,
        });
      }

      if (status === "rejected") {
        await sendEmail(
          studentEmail,
          "Your counseling session was rejected",
          `
Hello,

Your counseling session request was rejected.

Counselor: ${counselorName}
Date: ${formatSessionDate(session.session_date)}
Reason: ${rejection_reason || "No reason provided"}

Please book another slot from your dashboard.
`
        );
      }

      if (status === "cancelled") {
        await sendEmail(
          studentEmail,
          "Your counseling session was cancelled",
          `
Hello,

Your counseling session was cancelled.

Counselor: ${counselorName}
Date: ${formatSessionDate(session.session_date)}

Please book another slot from your dashboard.
`
        );
      }
    }
  } catch (err) {
    console.log("Session status email failed:", err.message);
  }

  res.json({ message: "Updated successfully" });
};

export const rescheduleSession = async (req, res) => {
  const { id } = req.params;
  const { session_date, reason, reschedule_reason } = req.body;
  const rescheduleReason = reason || reschedule_reason;

  try {
    const { error } = await supabase
      .from("sessions")
      .update({
        session_date,
        status: "pending",
        reschedule_reason: rescheduleReason,
        meeting_link: null
      })
      .eq("id", id);

    if (error) return res.status(400).json(error);

    try {
      const { data: session } = await supabase
        .from("sessions")
        .select("user_id, counselor_id")
        .eq("id", id)
        .single();

      const studentEmail = session?.user_id
        ? await getStudentEmail(session.user_id)
        : null;
      const counselorName = session?.counselor_id
        ? await getCounselorName(session.counselor_id)
        : "Your counselor";

      if (studentEmail) {
        await sendEmail(
          studentEmail,
          "Your counseling session was rescheduled",
          `
Hello,

Your session reschedule request has been sent for counselor approval.

Counselor: ${counselorName}
New Date: ${formatSessionDate(session_date)}
Reason: ${rescheduleReason || "No reason provided"}

You will receive an email after the counselor approves it.
`
        );
      }
    } catch (err) {
      console.log("Reschedule email failed:", err.message);
    }

    res.json({ message: "Session rescheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
