import supabase from "../config/supabase.config.js"
import dotenv from "dotenv"
dotenv.config();

export const signup=async(req,res)=>{
   try {
    const {email,password}=req.body;

    const { data, error } = await supabase.auth.signUp({
  email,
  password
});
if (error) {
  return res.status(400).json({ error: error.message });
}

// Create profile with default role "user"
    await supabase.from("profiles").insert([
      {
        id: data.user.id,
        role: "user"
      }
    ]);

    res.status(200).json({ message: "User created successfully" });
    }

   catch (error) {
    res.status(500).json({error:error.message});
   }
}
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }
const userId = data.user.id;
  const token = data.session.access_token;

  // 🔹 Fetch role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  // Check if career profile exists
const { data: careerProfile } = await supabase
  .from("career_profiles")
  .select("id")
  .eq("user_id", userId)
  .maybeSingle();

res.json({
  token,
  role: profile.role,
  userId,
  hasProfile: !!careerProfile  // true or false
});


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout=async(req,res)=>{
    try {
        const {error}=await supabase.auth.signOut();
        if(error){
            res.status(400).json({error:error.message});
        }
        else{
            res.status(200).json({message:"Logged out successfully"});
        }
    } catch (error) {
        res.status(500).json({error:error.message});
    }
}

// optional 
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/update-password`
      //redirectTo:"http://localhost:5173/update-password"   //this i swhen i run on my localhost
     
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Reset link sent to email" });
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const updatePassword = async (req, res) => {
  try {
    const { password, access_token, refresh_token } = req.body;

    // 🔹 Set session using token from email
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError) {
      return res.status(400).json({ error: sessionError.message });
    }

    // 🔹 Update password
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};