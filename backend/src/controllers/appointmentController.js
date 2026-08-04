import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";

const bookAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, date } = req.body;

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
          message: "You can only book appointments for your own patient profile."
        });
      }
    }

    const [patient, doctor] = await Promise.all([
      Patient.findById(patientId),
      User.findById(doctorId).select("name email role")
    ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found."
      });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      status: "pending"
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email role");

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      data: populatedAppointment
    });
  } catch (error) {
    return next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found."
      });
    }

    appointment.status = status;
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email role");

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully.",
      data: populatedAppointment
    });
  } catch (error) {
    return next(error);
  }
};

const getDoctorSchedule = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (req.user.role === "doctor" && req.user.id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own schedule."
      });
    }

    const doctor = await User.findById(doctorId).select("name email role");

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found."
      });
    }

    const filter = { doctorId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email role")
      .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      message: "Doctor schedule fetched successfully.",
      data: appointments
    });
  } catch (error) {
    return next(error);
  }
};

const getPatientAppointmentHistory = async (req, res, next) => {
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
          message: "You can only view your own appointment history."
        });
      }
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    const appointments = await Appointment.find({ patientId })
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "name email role")
      .sort({ date: -1 });

    const now = new Date();

    return res.status(200).json({
      success: true,
      message: "Patient appointment history fetched successfully.",
      data: {
        all: appointments,
        upcoming: appointments.filter((appointment) => appointment.date >= now),
        past: appointments.filter((appointment) => appointment.date < now)
      }
    });
  } catch (error) {
    return next(error);
  }
};

export {
  bookAppointment,
  getDoctorSchedule,
  getPatientAppointmentHistory,
  updateAppointmentStatus
};
