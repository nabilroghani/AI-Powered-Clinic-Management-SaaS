import Appointment from "../models/Appointment.js";
import DiagnosisLog from "../models/DiagnosisLog.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";
import { analyzeSymptomsAI, askAntigravityAi, explainPrescriptionAI } from "../services/aiService.js";

const createPrescription = async (req, res, next) => {
  try {
    const { patientId, medicines, instructions } = req.body;

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    // Ensure patient has portal credentials & linked User account
    if (!patient.portalEmail || !patient.portalPassword) {
      let generatedEmail = patient.portalEmail || `patient.${patient._id.toString().slice(-6)}@clinic.com`;
      let emailSuffix = 1;
      while (await User.findOne({ email: generatedEmail })) {
        generatedEmail = `patient.${patient._id.toString().slice(-6)}${emailSuffix}@clinic.com`;
        emailSuffix += 1;
      }
      const generatedPassword = patient.portalPassword || Math.random().toString(36).slice(-6).padEnd(6, "0").slice(0, 6);

      patient.portalEmail = generatedEmail;
      patient.portalPassword = generatedPassword;
      await patient.save();

      const existingUser = await User.findOne({
        $or: [{ email: generatedEmail }, { patientProfile: patient._id }]
      });

      if (!existingUser) {
        await User.create({
          name: patient.name,
          email: generatedEmail,
          password: generatedPassword,
          role: "patient",
          patientProfile: patient._id
        });
      }
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user.id,
      medicines,
      instructions
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate("patientId", "name age gender contact portalEmail portalPassword")
      .populate("doctorId", "name email role");

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully.",
      data: populatedPrescription
    });
  } catch (error) {
    return next(error);
  }
};

const getPatientMedicalHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === "patient") {
      if (!req.user.patientProfile) {
        return res.status(403).json({
          success: false,
          message: "Your account is not linked to a patient profile."
        });
      }

      if (req.user.patientProfile.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own medical history."
        });
      }
    }

    const patient = await Patient.findById(patientId).populate(
      "createdBy",
      "name email role"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    const [appointments, prescriptions, diagnosisLogs] = await Promise.all([
      Appointment.find({ patientId })
        .populate("doctorId", "name email role")
        .sort({ date: -1 }),
      Prescription.find({ patientId })
        .populate("patientId", "name age gender contact portalEmail portalPassword")
        .populate("doctorId", "name email role")
        .sort({ createdAt: -1 }),
      DiagnosisLog.find({ patientId })
        .populate("doctorId", "name email role")
        .sort({ createdAt: -1 })
    ]);

    const timeline = [
      ...appointments.map((appointment) => ({
        type: "appointment",
        date: appointment.date,
        record: appointment
      })),
      ...prescriptions.map((prescription) => ({
        type: "prescription",
        date: prescription.createdAt,
        record: prescription
      })),
      ...diagnosisLogs.map((diagnosisLog) => ({
        type: "diagnosisLog",
        date: diagnosisLog.createdAt,
        record: diagnosisLog
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      message: "Patient medical history fetched successfully.",
      data: {
        patient,
        appointments,
        prescriptions,
        diagnosisLogs,
        timeline
      }
    });
  } catch (error) {
    return next(error);
  }
};

const runSmartDiagnosis = async (req, res, next) => {
  try {
    const { symptoms, age, gender, patientId } = req.body;

    if (patientId) {
      const patient = await Patient.findById(patientId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found."
        });
      }
    }

    const aiResponse = await analyzeSymptomsAI(symptoms, age, gender);

    const diagnosisLog = await DiagnosisLog.create({
      patientId: patientId || null,
      doctorId: req.user.id,
      symptoms,
      age,
      gender,
      aiResponse,
      riskLevel: aiResponse.riskLevel
    });

    return res.status(200).json({
      success: true,
      message: "Smart diagnosis completed successfully.",
      data: {
        diagnosisLogId: diagnosisLog._id,
        analysis: aiResponse
      }
    });
  } catch (error) {
    return next(error);
  }
};

const runPrescriptionExplanation = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const { language = "English" } = req.body;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email role");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found."
      });
    }

    if (req.user.role === "patient") {
      if (!req.user.patientProfile) {
        return res.status(403).json({
          success: false,
          message: "Your account is not linked to a patient profile."
        });
      }

      if (prescription.patientId?._id?.toString() !== req.user.patientProfile.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only view prescription explanations for your own records."
        });
      }
    }

    const explanation = await explainPrescriptionAI(
      prescription.medicines,
      prescription.instructions,
      language
    );

    return res.status(200).json({
      success: true,
      message: "Prescription explanation generated successfully.",
      data: {
        prescriptionId: prescription._id,
        patientId: prescription.patientId?._id || prescription.patientId,
        explanation
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getDoctorPrescriptions = async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    const [prescriptions, diagnosisLogs, allAppointments] = await Promise.all([
      Prescription.find({ doctorId })
        .populate("patientId", "name age gender contact portalEmail portalPassword")
        .populate("doctorId", "name email role")
        .sort({ createdAt: -1 }),
      DiagnosisLog.find({ doctorId })
        .populate("patientId", "name age gender contact portalEmail portalPassword")
        .populate("doctorId", "name email role")
        .sort({ createdAt: -1 }),
      Appointment.find({ doctorId })
        .populate("patientId", "name age gender contact portalEmail portalPassword")
        .populate("doctorId", "name email role")
        .sort({ date: -1 })
    ]);

    // Calculate Today's patient count
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAppointments = allAppointments.filter(
      (app) => new Date(app.date).toISOString().slice(0, 10) === todayStr
    );
    const todayPrescriptions = prescriptions.filter(
      (p) => new Date(p.createdAt).toISOString().slice(0, 10) === todayStr
    );

    return res.status(200).json({
      success: true,
      message: "Doctor records fetched successfully.",
      data: {
        prescriptions,
        diagnosisLogs,
        appointments: allAppointments,
        stats: {
          totalPrescriptions: prescriptions.length,
          totalAppointments: allAppointments.length,
          todayAppointmentsCount: todayAppointments.length,
          todayPrescriptionsCount: todayPrescriptions.length
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

const runAntigravityAiAssistant = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt query is required."
      });
    }

    const role = req.user.role;
    const userId = req.user._id;
    let contextData = {};

    if (role === "doctor") {
      const [appointments, prescriptions, diagnosisLogs] = await Promise.all([
        Appointment.find({ doctorId: userId })
          .populate("patientId", "name age gender contact portalEmail")
          .sort({ date: -1 })
          .limit(10),
        Prescription.find({ doctorId: userId })
          .populate("patientId", "name age gender contact portalEmail")
          .sort({ createdAt: -1 })
          .limit(10),
        DiagnosisLog.find({ doctorId: userId })
          .populate("patientId", "name age gender contact portalEmail")
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      contextData = {
        doctorName: req.user.name,
        doctorEmail: req.user.email,
        recentAppointments: appointments.map((a) => ({
          patientName: a.patientId?.name || "Unknown",
          date: a.date,
          status: a.status,
          notes: a.notes
        })),
        recentPrescriptions: prescriptions.map((p) => ({
          patientName: p.patientId?.name || "Unknown",
          medicines: p.medicines,
          instructions: p.instructions,
          date: p.createdAt
        })),
        recentDiagnoses: diagnosisLogs.map((d) => ({
          patientName: d.patientId?.name || "Unknown",
          riskLevel: d.riskLevel,
          possibleConditions: d.possibleConditions,
          suggestedTests: d.suggestedTests,
          date: d.createdAt
        }))
      };
    } else if (role === "patient") {
      const patientDoc = await Patient.findOne({
        $or: [{ _id: req.user.patientProfile }, { portalEmail: req.user.email }, { contact: req.user.email }]
      });

      if (patientDoc) {
        const [prescriptions, appointments] = await Promise.all([
          Prescription.find({ patientId: patientDoc._id })
            .populate("doctorId", "name email")
            .sort({ createdAt: -1 }),
          Appointment.find({ patientId: patientDoc._id })
            .populate("doctorId", "name email")
            .sort({ date: -1 })
        ]);

        contextData = {
          patientName: patientDoc.name,
          age: patientDoc.age,
          gender: patientDoc.gender,
          contact: patientDoc.contact,
          portalEmail: patientDoc.portalEmail,
          myPrescriptions: prescriptions.map((p) => ({
            doctorName: p.doctorId?.name || "Dr. Sarah Jenkins",
            medicines: p.medicines,
            instructions: p.instructions,
            date: p.createdAt
          })),
          myAppointments: appointments.map((a) => ({
            doctorName: a.doctorId?.name || "Assigned Doctor",
            date: a.date,
            status: a.status
          }))
        };
      }
    } else {
      const [totalPatients, totalAppointments, totalPrescriptions] = await Promise.all([
        Patient.countDocuments(),
        Appointment.countDocuments(),
        Prescription.countDocuments()
      ]);

      contextData = {
        clinicRole: role,
        userName: req.user.name,
        totalPatients,
        totalAppointments,
        totalPrescriptions
      };
    }

    const reply = await askAntigravityAi(prompt.trim(), role, req.user.name, contextData);

    return res.status(200).json({
      success: true,
      message: "Antigravity AI responded successfully.",
      data: { reply }
    });
  } catch (error) {
    return next(error);
  }
};

export {
  createPrescription,
  getDoctorPrescriptions,
  getPatientMedicalHistory,
  runAntigravityAiAssistant,
  runPrescriptionExplanation,
  runSmartDiagnosis
};
