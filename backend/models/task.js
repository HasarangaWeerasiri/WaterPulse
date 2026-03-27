import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ContaminationReport",
    required: true,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
    default: "medium"
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "cancelled"],
    default: "pending"
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledByRole: {
    type: String,
    enum: ["admin", "authority"],
    default: null
  },
  resolutionNotes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true 
});

// Compound index for efficient queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ reportId: 1, status: 1 });
taskSchema.index({ priority: 1, status: 1 });

export default mongoose.model("Task", taskSchema);
