import supabase from "../config/supabase.config.js";
import { sendEmail } from "../utils/sendEmails.js";

export const bookSession = async (req, res) => {
  const { counselor_id, session_date } = req.body;

  if (req.user.id === counselor_id) {
    return res.status(400).json({ error: "You cannot book yourself" });
  }

  // Insert session
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

  // Get counselor name
  const { data: counselor } = await supabase
    .from("career_profiles")
    .select("full_name")
    .eq("user_id", counselor_id)
    .single();

  // Get student email from Supabase Auth
  const { data: userData } =
    await supabase.auth.admin.getUserById(req.user.id);

  const studentEmail = userData.user.email;

  // Send email
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

  // If approved and link provided
  if (status === "approved" && meeting_link) {
    updateData.meeting_link = meeting_link;
  }

  const { error } = await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", id)
    .eq("counselor_id", req.user.id);

  if (error) return res.status(400).json(error);

  res.json({ message: "Session updated successfully" });
};