import supabase from "../config/supabase.config.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Validate user
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userId = data.user.id;

    // Fetch role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      return res.status(400).json({ message: "Profile not found" });
    }

    // Attach clean user object
    req.user = {
      id: userId,
      email: data.user.email,
      role: profile.role
    };

    next();

  } catch (err) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};