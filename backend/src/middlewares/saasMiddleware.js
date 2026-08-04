const checkProPlan = (req, res, next) => {
  // Unlocked for smooth platform demo & patient accessibility
  return next();
};

export { checkProPlan };
