import Appointment from "../models/Appointment.js";
import DiagnosisLog from "../models/DiagnosisLog.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import User from "../models/User.js";

const PRO_PLAN_PRICE = 49;

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

const getAdminAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = getMonthRange(now);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

    const [
      totalPatients,
      totalDoctors,
      totalAppointmentsThisMonth,
      totalProSubscribers,
      topDiagnoses,
      monthlyAppointmentTrends
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: "doctor" }),
      Appointment.countDocuments({
        date: { $gte: monthStart, $lt: monthEnd }
      }),
      User.countDocuments({ subscriptionPlan: "Pro" }),
      DiagnosisLog.aggregate([
        {
          $project: {
            possibleConditions: {
              $ifNull: ["$aiResponse.possibleConditions", []]
            }
          }
        },
        { $unwind: "$possibleConditions" },
        {
          $group: {
            _id: "$possibleConditions",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 3 },
        {
          $project: {
            _id: 0,
            diagnosis: "$_id",
            count: 1
          }
        }
      ]),
      Appointment.aggregate([
        {
          $match: {
            date: { $gte: yearStart, $lt: yearEnd }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" }
            },
            totalAppointments: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            label: {
              $concat: [
                { $toString: "$_id.year" },
                "-",
                {
                  $cond: [
                    { $lt: ["$_id.month", 10] },
                    { $concat: ["0", { $toString: "$_id.month" }] },
                    { $toString: "$_id.month" }
                  ]
                }
              ]
            },
            totalAppointments: 1
          }
        }
      ])
    ]);

    const revenue = {
      proSubscribers: totalProSubscribers,
      monthlyPricePerSubscriber: PRO_PLAN_PRICE,
      estimatedMonthlyRevenue: totalProSubscribers * PRO_PLAN_PRICE
    };

    return res.status(200).json({
      success: true,
      message: "Admin analytics fetched successfully.",
      data: {
        summary: {
          totalPatients,
          totalDoctors,
          totalAppointmentsThisMonth
        },
        revenue,
        topDiagnoses,
        monthlyAppointmentTrends
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getDoctorAnalytics = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const { start: monthStart, end: monthEnd } = getMonthRange(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const [
      dailyAppointmentsCount,
      monthlyAppointmentsCount,
      monthlyStatusStats,
      monthlyTrend,
      totalPrescriptionCount,
      pastWeekLoad
    ] = await Promise.all([
      Appointment.countDocuments({
        doctorId,
        date: { $gte: todayStart, $lte: todayEnd }
      }),
      Appointment.countDocuments({
        doctorId,
        date: { $gte: monthStart, $lt: monthEnd }
      }),
      Appointment.aggregate([
        {
          $match: {
            doctorId: req.user._id,
            date: { $gte: monthStart, $lt: monthEnd }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1
          }
        }
      ]),
      Appointment.aggregate([
        {
          $match: {
            doctorId: req.user._id,
            date: { $gte: monthStart, $lt: monthEnd }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" }
            },
            totalAppointments: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        {
          $project: {
            _id: 0,
            label: {
              $concat: [
                { $toString: "$_id.year" },
                "-",
                {
                  $cond: [
                    { $lt: ["$_id.month", 10] },
                    { $concat: ["0", { $toString: "$_id.month" }] },
                    { $toString: "$_id.month" }
                  ]
                },
                "-",
                {
                  $cond: [
                    { $lt: ["$_id.day", 10] },
                    { $concat: ["0", { $toString: "$_id.day" }] },
                    { $toString: "$_id.day" }
                  ]
                }
              ]
            },
            totalAppointments: 1
          }
        }
      ]),
      Prescription.countDocuments({ doctorId }),
      Appointment.aggregate([
        {
          $match: {
            doctorId: req.user._id,
            date: { $gte: weekStart, $lte: todayEnd }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" }
            },
            totalAppointments: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            totalAppointments: 1
          }
        }
      ])
    ]);

    const weeklyTotals = pastWeekLoad.map((entry) => entry.totalAppointments);
    const totalWeekAppointments = weeklyTotals.reduce((sum, value) => sum + value, 0);
    const dailyAverage = weeklyTotals.length > 0 ? totalWeekAppointments / weeklyTotals.length : 0;
    const nextSevenDaysEstimate = Math.round(dailyAverage * 7);

    return res.status(200).json({
      success: true,
      message: "Doctor analytics fetched successfully.",
      data: {
        summary: {
          dailyAppointmentsCount,
          monthlyAppointmentsCount,
          totalPrescriptionCount
        },
        monthlyStats: monthlyStatusStats,
        monthlyTrend,
        patientLoadForecast: {
          lastSevenDaysAppointments: totalWeekAppointments,
          dailyAverageLoad: Number(dailyAverage.toFixed(2)),
          nextSevenDaysEstimate
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

export { getAdminAnalytics, getDoctorAnalytics };
