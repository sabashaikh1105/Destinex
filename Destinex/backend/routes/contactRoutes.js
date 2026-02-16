import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const subject = String(req.body?.subject || "General Inquiry").trim();
    const message = String(req.body?.message || "").trim();

    if (!fullName || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are required" });
    }

    const created = await ContactMessage.create({
      fullName,
      email,
      subject,
      message,
    });

    return res.status(201).json({ id: String(created._id), message: "Saved" });
  } catch (error) {
    console.error("Failed to save contact message:", error);
    return res.status(500).json({ error: "Failed to submit message" });
  }
});

export default router;

