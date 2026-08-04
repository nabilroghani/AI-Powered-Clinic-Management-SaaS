import mongoose from "mongoose";

const { Schema } = mongoose;

// Patient records are created by staff and remain linked to the
// receptionist or user who registered the patient in the clinic system.
const patientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required."],
      trim: true
    },
    age: {
      type: Number,
      required: [true, "Patient age is required."],
      min: [0, "Age cannot be negative."]
    },
    gender: {
      type: String,
      required: [true, "Patient gender is required."],
      trim: true
    },
    contact: {
      type: String,
      required: [true, "Patient contact is required."],
      trim: true
    },
    portalEmail: {
      type: String,
      trim: true,
      default: ""
    },
    portalPassword: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
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

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
