import supabase from "../config/supabase.config.js";

export const bookSession = async (req, res) => {
  const { counselor_id, session_date } = req.body;

  //Check before inserting
  if (req.user.id === counselor_id) {
    return res.status(400).json({ error: "You cannot book yourself" });
  }

  const { error } = await supabase
    .from("sessions")
    .insert([
      {
        user_id: req.user.id,
        counselor_id,
        session_date,
      },
    ]);

  if (error) return res.status(400).json(error);

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