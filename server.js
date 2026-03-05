import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import authRoutes from "./src/routes/auth.routes.js"
import profileRoutes from "./src/routes/profile.routes.js"
import sessionRoutes from "./src/routes/session.routes.js"
import jobRoutes from "./src/routes/job.routes.js"
import forumRoutes from "./src/routes/forum.routes.js"
import resourceRoutes from "./src/routes/resource.routes.js"
import aiRoutes from "./src/routes/ai.routes.js"
import paymentRoutes from "./src/routes/payment.routes.js"

dotenv.config()

const app=express()
const PORT=process.env.PORT || 5000;
app.use(express.json())
app.use(cors())   // as it will used to connect and not give any error during deployment and connection with frontend
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true
// }));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/resources",resourceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
