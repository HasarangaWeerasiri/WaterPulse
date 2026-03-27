import mongoose from "mongoose";

const contaminationReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  address: {
    type: String
  },
  status: {
    type: String,
    enum: ["Unverified", "In Progress", "Confirmed", "Resolved", "Spam"],
    default: "Unverified"
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

// Enable geospatial search
contaminationReportSchema.index({ location: "2dsphere" });

export default mongoose.model("ContaminationReport", contaminationReportSchema);
