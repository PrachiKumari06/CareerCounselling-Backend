import supabase from "../config/supabase.config.js";

export const createPost = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content required" });
    }

    const { data, error } = await supabase
      .from("forum_posts")
      .insert([
        {
          user_id: req.user.id,
          title,
          content,
          category,
        },
      ]);

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(400).json(error);
    }

    res.json({ message: "Post created successfully" });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getAllPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("forum_posts")
     .select(`
  id,
  title,
  category,
  status,
  upvotes,
  created_at,
  profiles (
    id,
    career_profiles (
      full_name
    )
  ),
  forum_comments(count)
`)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json(error);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getSinglePost = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("forum_posts")
      .select(`
  id,
  user_id,
  title,
  content,
  category,
  status,
  upvotes,
  created_at,
  profiles (
    career_profiles (
      full_name
    )
  ),
  forum_comments (
    id,
    content,
    created_at,
    profiles (
      career_profiles (
        full_name
      )
    )
  )
`)
      .eq("id", id)
      .single();

    if (error) return res.status(400).json(error);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const addComment = async (req, res) => {
  try {
    const { post_id, content } = req.body;

    const { error } = await supabase
      .from("forum_comments")
      .insert([
        {
          post_id,
          user_id: req.user.id,
          content,
        },
      ]);

    if (error) return res.status(400).json(error);

    res.json({ message: "Comment added" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const upvotePost = async (req, res) => {
  try {
    const { post_id } = req.body;

    // Insert vote
    const { error } = await supabase
      .from("forum_upvotes")
      .insert([
        {
          post_id,
          user_id: req.user.id,
        },
      ]);

    if (error) return res.status(400).json({ error: "Already upvoted" });

    // Increase counter
    await supabase.rpc("increment_upvote", { post_id_input: post_id });

    res.json({ message: "Upvoted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const closePost = async (req, res) => {
  try {
    const { post_id } = req.body;

    // Check if user is owner
    const { data: post } = await supabase
      .from("forum_posts")
      .select("user_id")
      .eq("id", post_id)
      .single();

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await supabase
      .from("forum_posts")
      .update({ status: "closed" })
      .eq("id", post_id);

    res.json({ message: "Post closed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};