import User from "../models/User.js";

const getDoctorsDirectory = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: "doctor" })
      .select("_id name email")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Doctors directory fetched successfully.",
      data: doctors
    });
  } catch (error) {
    return next(error);
  }
};

export { getDoctorsDirectory };
