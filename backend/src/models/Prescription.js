import mongoose from "mongoose";

const { Schema } = mongoose;

const medicineSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required."],
      trim: true
    },
    dosage: {
      type: String,
      required: [true, "Dosage is required."],
      trim: true
    },
    duration: {
      type: String,
      required: [true, "Duration is required."],
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    _id: false
  }
);

// Prescriptions store structured medicine instructions from doctors
// so the frontend can render printable and auditable treatment plans.
const prescriptionSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient reference is required."]
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor reference is required."]
    },
    medicines: {
      type: [medicineSchema],
      required: [true, "At least one medicine entry is required."],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one medicine entry is required."
      }
    },
    instructions: {
      type: String,
      required: [true, "Prescription instructions are required."],
      trim: true
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

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
