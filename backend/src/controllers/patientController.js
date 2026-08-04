import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";

const generateRandomPassword = () =>
  Math.random().toString(36).slice(-6).padEnd(6, "0").slice(0, 6);

const createPatient = async (req, res, next) => {
  try {
    const { name, age, gender, contact } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      contact,
      createdBy: req.user.id
    });

    let generatedEmail = `patient.${patient._id.toString().slice(-6)}@clinic.com`;
    const generatedPassword = generateRandomPassword();
    let emailSuffix = 1;

    while (await User.findOne({ email: generatedEmail })) {
      generatedEmail = `patient.${patient._id.toString().slice(-6)}${emailSuffix}@clinic.com`;
      emailSuffix += 1;
    }

    patient.portalEmail = generatedEmail;
    patient.portalPassword = generatedPassword;
    await patient.save();

    await User.create({
      name,
      email: generatedEmail,
      password: generatedPassword,
      role: "patient",
      patientProfile: patient._id
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully.",
      data: {
        patient,
        email: generatedEmail,
        password: generatedPassword
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getAllPatients = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.user.role === "doctor") {
      const doctorAppointmentPatientIds = await Appointment.find({ doctorId: req.user.id }).distinct("patientId");
      query = {
        $or: [
          { _id: { $in: doctorAppointmentPatientIds } },
          { createdBy: req.user.id }
        ]
      };
    }

    const [patients, totalPatients] = await Promise.all([
      Patient.find(query)
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: "Patients fetched successfully.",
      data: patients,
      pagination: {
        page,
        limit,
        totalItems: totalPatients,
        totalPages: Math.ceil(totalPatients / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient fetched successfully.",
      data: patient
    });
  } catch (error) {
    return next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const updates = {};
    const allowedFields = ["name", "age", "gender", "contact"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    Object.assign(patient, updates);
    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      data: patient
    });
  } catch (error) {
    return next(error);
  }
};

export { createPatient, getAllPatients, getPatientById, updatePatient };
