import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema } = mongoose;

// User accounts represent every authenticated platform role and
// keep subscription state at the account level for SaaS billing logic.
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required."],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password is required."]
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist", "patient"],
      required: [true, "User role is required."]
    },
    patientProfile: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      default: null
    },
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Pro"],
      default: "Free"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
