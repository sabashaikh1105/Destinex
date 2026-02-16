import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    picture: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    gender: { type: String, default: "" },
    languages: { type: Array, default: [] },
    foodPreference: { type: String, default: "" },
    foodRestrictions: { type: Array, default: [] },
    incomeBand: { type: String, default: "" },
    addresses: { type: Array, default: [] },
    metadata: { type: Object, default: {} },
    lastLoginAt: { type: Date, default: null },
    resetPasswordCode: { type: String, default: null },
    resetPasswordCodeExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
