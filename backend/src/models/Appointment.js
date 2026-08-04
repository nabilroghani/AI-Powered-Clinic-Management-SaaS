import mongoose from "mongoose";

const { Schema } = mongoose;

// Appointments connect a patient to a doctor and track the lifecycle
// of a booking from intake through completion or cancellation.
const appointmentSchema = new Schema(
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
    date: {
      type: Date,
      required: [true, "Appointment date is required."]
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
