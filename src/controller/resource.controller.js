import supabase from "../config/supabase.config.js";

export const createResource = async (req, res) => {
  try {
    const { title, description, type, category, file_url } = req.body;

    // Check role
    if (req.user.role !== "counselor") {
      return res.status(403).json({ error: "Only counselors can add resources" });
    }

    const { error } = await supabase
      .from("resources")
      .insert([
        {
          title,
          description,
          type,
          category,
          file_url,
          created_by: req.user.id
        }
      ]);

    if (error) return res.status(400).json(error);

    res.json({ message: "Resource added successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllResources = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("resources")
      .select(`
        *,
        profiles (
          career_profiles (
            full_name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json(error);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSingleResource = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(400).json(error);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};