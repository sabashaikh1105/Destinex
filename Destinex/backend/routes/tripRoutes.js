import express from "express";
import Trip from "../models/Trip.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", optionalAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload?.id) return res.status(400).json({ error: "Trip id is required" });
    const normalizedPayload = {
      ...payload,
      ...(req.userId ? { userId: req.userId } : {}),
    };

    const trip = await Trip.findOneAndUpdate(
      { id: normalizedPayload.id },
      { $set: normalizedPayload, $setOnInsert: { createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json(trip);
  } catch (error) {
    console.error("Failed to save trip:", error);
    return res.status(500).json({ error: "Failed to save trip" });
  }
});

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { userId, userEmail } = req.query;
    const filter = {};
    if (req.userId) {
      filter.userId = req.userId;
    } else if (userId) {
      filter.userId = userId;
    }
    if (userEmail) filter.userEmail = userEmail;

    // Privacy guard: never return all trips without owner context.
    if (!filter.userId && !filter.userEmail) {
      return res.json([]);
    }

    const trips = await Trip.find(filter).sort({ createdAtMs: -1, createdAt: -1 }).lean();
    return res.json(trips);
  } catch (error) {
    console.error("Failed to load trips:", error);
    return res.status(500).json({ error: "Failed to load trips" });
  }
});

router.get("/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findOne({ id: tripId }).lean();
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    return res.json(trip);
  } catch (error) {
    console.error("Failed to load trip:", error);
    return res.status(500).json({ error: "Failed to load trip" });
  }
});

router.patch("/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    const updates = req.body || {};
    const trip = await Trip.findOneAndUpdate(
      { id: tripId },
      { $set: { ...updates, updatedAt: new Date() }, $setOnInsert: { id: tripId, createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json(trip);
  } catch (error) {
    console.error("Failed to update trip:", error);
    return res.status(500).json({ error: "Failed to update trip" });
  }
});

export default router;
