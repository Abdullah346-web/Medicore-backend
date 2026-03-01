import ApiError from '../utils/apiError.js';
import Patient from '../models/Patient.js';

export const requireProPlan = (req, _res, next) => {
  if (req.user.subscriptionPlan === 'free') {
    throw new ApiError(403, 'AI features require Pro subscription plan');
  }
  next();
};

export const enforceFreePatientLimit = async (req, _res, next) => {
  if (req.user.subscriptionPlan === 'pro') {
    return next();
  }

  const count = await Patient.countDocuments({ createdBy: req.user._id });
  if (count >= 20) {
    throw new ApiError(403, 'Free plan allows up to 20 patients only');
  }
  next();
};