import asyncHandler from '../utils/asyncHandler.js';
import { getAdminAnalytics, getDoctorAnalytics } from '../services/analyticsService.js';

export const adminDashboard = asyncHandler(async (_req, res) => {
  const analytics = await getAdminAnalytics();
  res.status(200).json(analytics);
});

export const doctorDashboard = asyncHandler(async (req, res) => {
  const analytics = await getDoctorAnalytics(req.user._id);
  res.status(200).json(analytics);
});