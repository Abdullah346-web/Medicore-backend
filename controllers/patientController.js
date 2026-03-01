import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { onboardPatientAccount } from '../services/patientOnboardingService.js';

export const createPatient = asyncHandler(async (req, res) => {
  const { name, email, phone, age, gender, contact } = req.body;
  const resolvedPhone = phone || contact;

  if (!name || !email || !resolvedPhone || age == null || !gender) {
    throw new ApiError(400, 'name, email, phone, age and gender are required');
  }

  const patient = await Patient.create({
    userId: req.user._id,
    name,
    email,
    phone: resolvedPhone,
    age,
    gender,
    contact: resolvedPhone,
    createdBy: req.user._id,
  });

  res.status(201).json(patient);
});

export const registerPatientByReceptionist = asyncHandler(async (req, res) => {
  const { name, email, phone, age, gender, temporaryPassword } = req.body;

  if (!name || !email || !phone || age == null || !gender) {
    throw new ApiError(400, 'name, email, phone, age and gender are required');
  }

  const { user, patientProfile, temporaryPassword: generatedTemporaryPassword } = await onboardPatientAccount({
    name,
    email,
    phone,
    age,
    gender,
    createdBy: req.user._id,
    temporaryPassword,
  });

  res.status(201).json({
    message: 'Patient account created successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    },
    patientProfile,
    temporaryPassword: generatedTemporaryPassword,
  });
});

export const getPatients = asyncHandler(async (req, res) => {
  const query = ['admin', 'doctor'].includes(req.user.role) ? {} : { createdBy: req.user._id };
  const patients = await Patient.find(query).sort({ createdAt: -1 });
  res.status(200).json(patients);
});

export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  if (req.user.role !== 'admin' && String(patient.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, 'Not allowed to access this patient');
  }

  res.status(200).json(patient);
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  if (req.user.role !== 'admin' && String(patient.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, 'Not allowed to update this patient');
  }

  ['name', 'age', 'gender', 'contact'].forEach((field) => {
    if (req.body[field] != null) patient[field] = req.body[field];
  });

  const updated = await patient.save();
  res.status(200).json(updated);
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  if (req.user.role !== 'admin' && String(patient.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, 'Not allowed to delete this patient');
  }

  await Promise.all([
    Appointment.deleteMany({ patientId: patient._id }),
    Prescription.deleteMany({ patientId: patient._id }),
  ]);

  if (patient.userId) {
    await User.findByIdAndDelete(patient.userId);
  }

  await patient.deleteOne();
  res.status(200).json({ message: 'Patient deleted successfully' });
});

export const getMedicalTimeline = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  const [appointments, prescriptions] = await Promise.all([
    Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'name email role')
      .sort({ date: -1 }),
    Prescription.find({ patientId: patient._id })
      .populate('doctorId', 'name email role')
      .sort({ createdAt: -1 }),
  ]);

  const timeline = [
    ...appointments.map((item) => ({
      type: 'appointment',
      date: item.date,
      data: item,
    })),
    ...prescriptions.map((item) => ({
      type: 'prescription',
      date: item.createdAt,
      data: item,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({ patient, timeline });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'patient') {
    throw new ApiError(403, 'Only patients can access this endpoint');
  }

  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  res.status(200).json(patient);
});

export const getMyAppointments = asyncHandler(async (req, res) => {
  if (req.user.role !== 'patient') {
    throw new ApiError(403, 'Only patients can access this endpoint');
  }

  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const appointments = await Appointment.find({ patientId: patient._id })
    .populate('doctorId', 'name email role')
    .sort({ date: -1 });

  res.status(200).json(appointments);
});

export const getMyPrescriptions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'patient') {
    throw new ApiError(403, 'Only patients can access this endpoint');
  }

  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const prescriptions = await Prescription.find({ patientId: patient._id })
    .populate('doctorId', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json(prescriptions);
});