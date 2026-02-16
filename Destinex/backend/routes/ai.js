import express from "express";
import { generateTrip } from "../lib/ai.js";

const router = express.Router();

router.post("/generate-trip", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const content = await generateTrip(prompt);
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "AI generation failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
