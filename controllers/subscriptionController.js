import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import User from '../models/User.js';

export const updateSubscriptionPlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro'].includes(plan)) {
    throw new ApiError(400, 'Plan must be free or pro');
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { subscriptionPlan: plan },
    { new: true }
  ).select('-password');

  res.status(200).json(updated);
});