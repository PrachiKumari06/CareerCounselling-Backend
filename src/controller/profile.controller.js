import supabase from "../config/supabase.config.js";

export const createCareerProfile = async (req, res) => {
  const { full_name,education, skills, experience, interests,bio } = req.body;

  const { error } = await supabase
    .from("career_profiles")
    .insert([
      {
        user_id: req.user.id,
full_name,
        education,
        skills,
        experience,
        interests,
        bio
      },
    ]);

  if (error) return res.status(400).json(error);

  res.json({ message: "Profile saved" });
};
export const updateCareerProfile = async (req, res) => {
  const { full_name, education, skills, experience, interests, bio } = req.body;

  const { error } = await supabase
    .from("career_profiles")
    .update({
      full_name,
      education,
      skills,
      experience,
      interests,
      bio
    })
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json(error);

  res.json({ message: "Profile updated successfully" });
};
export const getCareerProfile = async (req, res) => {
  const { data, error } = await supabase
    .from("career_profiles")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) return res.status(400).json(error);

  res.json(data);
};

export const getAllCounselors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        career_profiles!career_profiles_user_id_fkey (    
          full_name,
          education,
          skills,
          bio,
          experience
        )
      `)
      .eq("role", "counselor");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// optional: match counselors based on skills/interests but filter on frontend for simplicity is doing so can be ignre this part if you want to save time and focus on frontend
export const matchCounselors = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const { data: userProfile } = await supabase
      .from("career_profiles")
      .select("skills, interests")
      .eq("user_id", userId)
      .single();

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    //  Get all counselors
    const { data: counselors } = await supabase
      .from("profiles")
      .select(`
        id,
        career_profiles!career_profiles_user_id_fkey (
          full_name,
          skills,
          interests,
          education,
          bio,
          experience
        )
      `)
      .eq("role", "counselor");

    // Simple matching
    const userKeywords = (
      userProfile.skills + " " + userProfile.interests + userProfile.education 
    ).toLowerCase();

    const matched = counselors.filter((c) => {
      const profile = c.career_profiles?.[0];
      if (!profile) return false;

      const counselorKeywords = (
        profile.skills + " " + profile.interests + " " + profile.education+ " " + profile.bio
      ).toLowerCase();

      return userKeywords
        .split(",")
        .some((word) => counselorKeywords.includes(word.trim()));
    });

    res.json(matched.length ? matched : counselors);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};