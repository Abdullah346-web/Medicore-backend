import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, subscriptionPlan } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  if (!role || role === 'patient') {
    throw new ApiError(403, 'Public patient self-registration is not allowed');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    subscriptionPlan: subscriptionPlan || 'free',
    mustChangePassword: false,
  });

  const token = generateToken(user._id);
  res.status(201).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken(user._id);

  if (user.role === 'patient' && user.mustChangePassword) {
    return res.status(200).json({
      token,
      forcePasswordChange: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  }

  res.status(200).json({
    token,
    forcePasswordChange: false,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'oldPassword and newPassword are required');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'newPassword must be at least 6 characters long');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isValidOldPassword = await user.comparePassword(oldPassword);
  if (!isValidOldPassword) {
    throw new ApiError(401, 'Invalid old password');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({ message: 'Password updated successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

export const getStaffUsers = asyncHandler(async (req, res) => {
  const roleFilter = req.query.role;
  const allowedRoles = ['doctor', 'receptionist'];

  const query = allowedRoles.includes(roleFilter)
    ? { role: roleFilter }
    : { role: { $in: allowedRoles } };

  const staffUsers = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json(staffUsers);
});

export const updateStaffUser = asyncHandler(async (req, res) => {
  const staffUser = await User.findById(req.params.id);
  if (!staffUser) {
    throw new ApiError(404, 'Staff user not found');
  }

  if (!['doctor', 'receptionist'].includes(staffUser.role)) {
    throw new ApiError(400, 'Only doctor/receptionist users can be updated from this endpoint');
  }

  const { name, email, role, subscriptionPlan } = req.body;

  if (name != null) {
    staffUser.name = name;
  }

  if (email != null) {
    staffUser.email = email;
  }

  if (role != null) {
    if (!['doctor', 'receptionist'].includes(role)) {
      throw new ApiError(400, 'role must be doctor or receptionist');
    }

    staffUser.role = role;
  }

  if (subscriptionPlan != null) {
    if (!['free', 'pro'].includes(subscriptionPlan)) {
      throw new ApiError(400, 'subscriptionPlan must be free or pro');
    }

    staffUser.subscriptionPlan = subscriptionPlan;
  }

  const updated = await staffUser.save();
  res.status(200).json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    subscriptionPlan: updated.subscriptionPlan,
    mustChangePassword: updated.mustChangePassword,
    createdAt: updated.createdAt,
  });
});

export const deleteStaffUser = asyncHandler(async (req, res) => {
  const staffUser = await User.findById(req.params.id);
  if (!staffUser) {
    throw new ApiError(404, 'Staff user not found');
  }

  if (!['doctor', 'receptionist'].includes(staffUser.role)) {
    throw new ApiError(400, 'Only doctor/receptionist users can be deleted from this endpoint');
  }

  await staffUser.deleteOne();
  res.status(200).json({ message: 'Staff user deleted successfully' });
});