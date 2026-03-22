import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    report: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    cachedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { versionKey: false },
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
