import supabase from "../config/supabase.config.js";

export const addFeedback = async (req, res) => {
  const userId = req.user.id;
  const { counselor_id, rating, comment } = req.body;

  try {
    //check session exists + approved
    const { data: session } = await supabase
      .from("sessions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("counselor_id", counselor_id)
      .eq("status", "approved");

    if (!session || session.length === 0) {
      return res.status(400).json({
        error: "You can only review after approved session"
      });
    }

    // prevent duplicate review
    const { data: existing } = await supabase
      .from("feedback")
      .select("id")
      .eq("user_id", userId)
      .eq("counselor_id", counselor_id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        error: "You already reviewed this counselor"
      });
    }

    // Insert feedback
    const { data, error } = await supabase
      .from("feedback")
      .insert([
        {
          user_id: userId,
          counselor_id,
          rating,
          comment
        }
      ])
      .select()
      .single();

    if (error) return res.status(400).json(error);

    res.json({ message: "Feedback added", data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFeedback = async (req, res) => {
  const { counselorId } = req.params;
  const { filter } = req.query;

  try {
    let query = supabase
      .from("feedback")
     .select(`
  id,
  rating,
  comment,
  created_at,
  profiles!feedback_user_id_fkey (
    career_profiles (
      full_name
    )
  ),
  feedback_likes(count)
`)
      .eq("counselor_id", counselorId)
      .order("created_at", { ascending: false });

    //filter: last 7 days
   
if (filter === "new") {
  query = query.order("created_at", { ascending: false });
}

if (filter === "week") {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  query = query.gte("created_at", oneWeekAgo.toISOString());
}
    const { data, error } = await query;

    if (error) return res.status(400).json(error);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRatingSummary = async (req, res) => {
  const { counselorId } = req.params;

  try {
    const { data } = await supabase
      .from("feedback")
      .select("rating")
      .eq("counselor_id", counselorId);

    if (!data || data.length === 0) {
      return res.json({ avg: 0, total: 0 });
    }

    const total = data.length;
    const avg =
      data.reduce((sum, f) => sum + f.rating, 0) / total;

    res.json({
      avg: avg.toFixed(1),
      total
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  const userId = req.user.id;
  const { feedback_id } = req.body;

  try {
    const { data: existing } = await supabase
      .from("feedback_likes")
      .select("id")
      .eq("feedback_id", feedback_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // unlike
      await supabase
        .from("feedback_likes")
        .delete()
        .eq("id", existing.id);

      return res.json({ message: "Unliked" });
    }

    // like
    await supabase
      .from("feedback_likes")
      .insert([{ feedback_id, user_id: userId }]);

    res.json({ message: "Liked" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};