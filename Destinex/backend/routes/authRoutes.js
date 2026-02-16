import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const createToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

const safeUser = (userDoc) => {
  if (!userDoc) return null;
  return {
    uid: String(userDoc._id),
    email: userDoc.email || "",
    name: userDoc.name || "",
    firstName: userDoc.firstName || "",
    lastName: userDoc.lastName || "",
    picture: userDoc.picture || "",
    profilePicture: userDoc.profilePicture || "",
    gender: userDoc.gender || "",
    languages: Array.isArray(userDoc.languages) ? userDoc.languages : [],
    foodPreference: userDoc.foodPreference || "",
    foodRestrictions: Array.isArray(userDoc.foodRestrictions)
      ? userDoc.foodRestrictions
      : [],
    incomeBand: userDoc.incomeBand || "",
    addresses: Array.isArray(userDoc.addresses) ? userDoc.addresses : [],
    metadata: userDoc.metadata || {},
    lastLoginAt: userDoc.lastLoginAt || null,
    createdAt: userDoc.createdAt || null,
    updatedAt: userDoc.updatedAt || null,
  };
};

router.post("/register", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const firstName = String(req.body?.firstName || "").trim();
    const lastName = String(req.body?.lastName || "").trim();
    const name =
      String(req.body?.name || "").trim() ||
      [firstName, lastName].filter(Boolean).join(" ");
    const gender = String(req.body?.gender || "").trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    let user;

    if (existing?.passwordHash) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      // Upgrade legacy profile rows created before local-password auth.
      existing.passwordHash = passwordHash;
      existing.firstName = firstName || existing.firstName || "";
      existing.lastName = lastName || existing.lastName || "";
      existing.name = name || existing.name || "";
      existing.gender = gender || existing.gender || "";
      existing.lastLoginAt = new Date();
      user = await existing.save();
    } else {
      user = await User.create({
        email,
        passwordHash,
        firstName,
        lastName,
        name,
        gender,
        lastLoginAt: new Date(),
      });
    }

    const token = createToken(String(user._id));
    return res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    if (!user.passwordHash) {
      return res.status(400).json({
        error: "This account is from an old auth system. Please sign up once to activate password login.",
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(String(user._id));
    return res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user: safeUser(user) });
  } catch (error) {
    console.error("Failed to load current user:", error);
    return res.status(500).json({ error: "Failed to load current user" });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const updates = req.body || {};
    const allowed = {
      name: updates.name,
      firstName: updates.firstName,
      lastName: updates.lastName,
      picture: updates.picture,
      profilePicture: updates.profilePicture,
      gender: updates.gender,
      languages: updates.languages,
      foodPreference: updates.foodPreference,
      foodRestrictions: updates.foodRestrictions,
      incomeBand: updates.incomeBand,
      addresses: updates.addresses,
      metadata: updates.metadata,
    };

    const compact = Object.fromEntries(
      Object.entries(allowed).filter(([, value]) => value !== undefined)
    );

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: compact },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user: safeUser(user) });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/request-password-reset", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If the email exists, a reset code was generated." });
    }

    const resetCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.json({
      message: "Password reset code generated. Use the code to reset your password.",
      resetCode,
    });
  } catch (error) {
    console.error("Failed to request password reset:", error);
    return res.status(500).json({ error: "Failed to request password reset" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid reset request" });

    const isExpired =
      !user.resetPasswordCodeExpiresAt ||
      user.resetPasswordCodeExpiresAt.getTime() < Date.now();
    if (user.resetPasswordCode !== code || isExpired) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpiresAt = null;
    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(String(user._id));
    return res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
