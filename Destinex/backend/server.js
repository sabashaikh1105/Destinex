import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env first and force override so local backend config wins.
dotenv.config({ path: path.join(__dirname, ".env"), override: true });
// Load root .env as fallback for values not present in backend/.env.
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

const mongoUri = (process.env.MONGO_URI || "").trim();
if (!mongoUri) {
  throw new Error("MONGO_URI is missing. Set it in Destinex/backend/.env or Destinex/.env");
}

mongoose.set("strictQuery", true);
mongoose
  .connect(mongoUri)
  .then(() => {
    const dbName = mongoose.connection?.name || "unknown";
    console.log(`Mongo connected (${dbName})`);
  })
  .catch((err) => {
    console.error("Mongo connection failed:", err?.message || err);
    process.exit(1);
  });

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`Backend running on ${port}`));
