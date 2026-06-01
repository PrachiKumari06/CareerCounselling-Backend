import supabase from "../config/supabase.config.js";

/* GET ALL JOBS (with search)*/
export const getJobs = async (req, res) => {
  try {
   const { search, location, type, status } = req.query;

let query = supabase.from("jobs").select(`
  id,
  title,
  company,
  location,
  type,
  salary,
  description,
  expiry_date,
  created_at,
  company_culture,
  skills_required
`);
// NEW: filter by status
if (status === "active") {
  query = query.gte("expiry_date", new Date().toISOString());
}

if (status === "closed") {
  query = query.lt("expiry_date", new Date().toISOString());
}
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) return res.status(400).json(error);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*apply to job */
export const applyJob = async (req, res) => {
 
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("USER:", req.user);

    const { job_id } = req.body;
    const file = req.file;
 const { data: job } = await supabase
  .from("jobs")
  .select("expiry_date")
  .eq("id", job_id)
  .single();

if (new Date(job.expiry_date) < new Date()) {
  return res.status(400).json({ error: "Job expired" });
}
    if (!file) {
      console.log("No file received");
      return res.status(400).json({ error: "Resume is required" });
    }

    if (file.mimetype !== "application/pdf") {
      console.log("Wrong file type:", file.mimetype);
      return res.status(400).json({ error: "Only PDF allowed" });
    }

    const { data: existing } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("job_id", job_id)
      .maybeSingle();

    if (existing) {
      console.log("Duplicate application");
      return res.status(400).json({ error: "Already applied" });
    }

    const fileName = `${req.user.id}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      return res.status(400).json({ error: uploadError.message });
    }

    const { data: publicData } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    console.log("Resume URL:", publicData.publicUrl);

    const { error } = await supabase
      .from("job_applications")
      .insert([
        {
          user_id: req.user.id,
          job_id,
          resume_url: publicData.publicUrl,
        },
      ]);

    if (error) {
      console.log("INSERT ERROR:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Applied successfully" });

  } catch (error) {
    console.log("CATCH ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

/* get my applied job */
export const getMyApplications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
        resume_url,
        jobs (
          id,
          title,
          company,
          location,
          type,
          salary
        )
      `)
      .eq("user_id", req.user.id);

    if (error) return res.status(400).json(error);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecommendedJobs = async (req, res) => {
  try {
const normalizeSkills = (value = "") => {
  return value
    .toLowerCase()
    .split(",")
    .map(skill => skill.trim())
    .filter(Boolean);
};
const { data: userProfile, error: profileError } = await supabase
  .from("career_profiles")
  .select("skills")
  .eq("user_id", req.user.id)
  .single();

if (profileError || !userProfile) {
  return res.status(404).json({ error: "Profile not found" });
}

const { data: jobs, error: jobsError } = await supabase
  .from("jobs")
  .select("*");

if (jobsError) {
  return res.status(400).json({ error: jobsError.message });
}

const userSkills = normalizeSkills(userProfile.skills);

const jobsWithMatch = jobs.map(job => {
const jobSkills = normalizeSkills(
  job.skills_required ||
  job.skills ||
  job.required_skills ||
  ""
);
  const matchedSkills = userSkills.filter(userSkill =>
    jobSkills.some(jobSkill =>
      jobSkill === userSkill ||
      jobSkill.includes(userSkill) ||
      userSkill.includes(jobSkill)
    )
  );

  const matchPercent =
    userSkills.length === 0
      ? 0
      : Math.round((matchedSkills.length / userSkills.length) * 100);

  return {
    ...job,
    matchedSkills,
    matchPercent,
  };
});

const recommendedJobs = jobsWithMatch.filter(job => job.matchedSkills.length > 0);

    // 5. Sort
    jobsWithMatch.sort((a, b) => b.matchPercent - a.matchPercent);

    // 6. ✅ Fallback (IMPORTANT)
    const hasMatch = jobsWithMatch.some(job => job.matchPercent > 0);

    const finalJobs = hasMatch ? jobsWithMatch : jobs;

    res.json(finalJobs);

  } catch (err) {
  console.log("RECOMMENDED JOB ERROR:", err);
  res.status(500).json({ error: err.message });
}
};