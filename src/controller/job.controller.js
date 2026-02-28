import supabase from "../config/supabase.config.js";

/* ===============================
   GET ALL JOBS (with search)
================================= */
export const getJobs = async (req, res) => {
  try {
    const { search, location, type } = req.query;

    let query = supabase.from("jobs").select("*");

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


/* ===============================
   APPLY TO JOB
================================= */
export const applyJob = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("USER:", req.user);

    const { job_id } = req.body;
    const file = req.file;

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

/* ===============================
   GET MY APPLIED JOBS
================================= */
export const getMyApplications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        status,
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