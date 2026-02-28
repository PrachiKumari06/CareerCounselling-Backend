import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from "../config/supabase.config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getCareerRecommendation = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️. Check if already exists
    const { data: existing } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return res.json(existing.data);
    }

    // 2️. Get profile
    const { data: profile } = await supabase
      .from("career_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return res.status(400).json({ error: "Complete profile first" });
    }

    // 3️. Use correct model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a professional career counselor.

User Profile:
Education: ${profile.education}
Skills: ${profile.skills}
Experience: ${profile.experience}
Interests: ${profile.interests}

Respond ONLY in valid JSON format:

{
  "career_paths": [
    {
      "title": "",
      "why_match": "",
      "salary_range_india": "",
      "required_skills": [],
      "roadmap": [
        { "step": "", "description": "" }
      ]
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean markdown
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: "Invalid AI format" });
    }

    const parsed = JSON.parse(match[0]);

    // 4️. Save to DB
    await supabase.from("ai_recommendations").insert([
      {
        user_id: userId,
        data: parsed,
      },
    ]);

    res.json(parsed);

  } catch (err) {
    console.log("SERVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};
export const regenerateRecommendation = async (req, res) => {
  const userId = req.user.id;

  await supabase
    .from("ai_recommendations")
    .delete()
    .eq("user_id", userId);

  res.json({ message: "Old recommendation deleted" });
};