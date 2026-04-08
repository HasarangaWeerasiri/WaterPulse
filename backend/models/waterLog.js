import mongoose from "mongoose";

const waterLogSchema = new mongoose.Schema({
  region: {
    type: String,
    required: false,
    index: true // Indexed for analytics queries
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ContaminationReport",
    required: false // Optional - for linking to investigative logs
  },
  phLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 14
  },
  turbidity: {
    type: Number,
    required: true,
    min: 0 // NTU (Nephelometric Turbidity Units)
  },
  contaminants: {
    type: [String],
    default: []
  },
  safetyRating: {
    type: String,
    enum: ["Safe", "Warning", "Unsafe"],
    default: "Unsafe"
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    index: true // Indexed for time-based queries
  }
}, { timestamps: true });

export default mongoose.model("WaterLog", waterLogSchema);
