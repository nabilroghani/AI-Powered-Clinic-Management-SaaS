import mongoose from "mongoose";

const { Schema } = mongoose;

// Diagnosis logs capture the symptom input plus the AI output payload
// so medical staff can review suggested conditions and escalation risk.
const diagnosisLogSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      default: null
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    symptoms: {
      type: String,
      required: [true, "Symptoms are required."],
      trim: true
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative."],
      default: null
    },
    gender: {
      type: String,
      trim: true,
      default: ""
    },
    aiResponse: {
      type: Schema.Types.Mixed,
      required: [true, "AI response data is required."]
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: [true, "Risk level is required."]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

const DiagnosisLog = mongoose.model("DiagnosisLog", diagnosisLogSchema);

export default DiagnosisLog;
