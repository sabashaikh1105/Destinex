import mongoose from "mongoose";

const TripSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true, default: null },
  userSelection: Object,
  tripData: mongoose.Schema.Types.Mixed,
  tripDataRaw: mongoose.Schema.Types.Mixed,
  booking: { type: mongoose.Schema.Types.Mixed, default: null },
  travelNotes: { type: Array, default: [] },
  userEmail: { type: String, index: true, default: null },
  createdAtMs: { type: Number, default: () => Date.now() },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

TripSchema.pre("save", function setUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Trip", TripSchema);
