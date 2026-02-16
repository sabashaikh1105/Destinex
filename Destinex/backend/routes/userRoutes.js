import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    delete user.passwordHash;
    delete user.resetPasswordCode;
    delete user.resetPasswordCodeExpiresAt;
    return res.json(user);
  } catch (error) {
    console.error("Failed to load user:", error);
    return res.status(500).json({ error: "Failed to load user" });
  }
});

router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = { ...req.body };
    delete payload.passwordHash;
    delete payload.resetPasswordCode;
    delete payload.resetPasswordCodeExpiresAt;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: payload },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });
    delete user.passwordHash;
    delete user.resetPasswordCode;
    delete user.resetPasswordCodeExpiresAt;
    return res.json(user);
  } catch (error) {
    console.error("Failed to upsert user:", error);
    return res.status(500).json({ error: "Failed to save user" });
  }
});

export default router;
