const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Clinic Management API is running.",
    timestamp: new Date().toISOString()
  });
};

export { getHealthStatus };
