import mongoose from "mongoose";

const ContactMessageSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, index: true },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", ContactMessageSchema);

