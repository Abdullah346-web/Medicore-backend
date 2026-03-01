import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

export const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, status, notes } = req.body;
  if (!patientId || !doctorId || !date) {
    throw new ApiError(400, 'patientId, doctorId and date are required');
  }

  if (req.user.role === 'doctor' && doctorId !== String(req.user._id)) {
    throw new ApiError(403, 'Doctors can only create appointments for themselves');
  }

  const [patient, doctor] = await Promise.all([
    Patient.findById(patientId),
    User.findById(doctorId),
  ]);

  if (!patient) throw new ApiError(404, 'Patient not found');
  if (!doctor || doctor.role !== 'doctor') {
    throw new ApiError(400, 'doctorId must belong to a doctor user');
  }

  const appointment = await Appointment.create({
    patientId,
    patientName: patient.name,
    doctorId,
    doctorName: doctor.name,
    date,
    status,
    notes,
  });

  res.status(201).json(appointment);
});

export const getAppointments = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === 'doctor') {
    query.doctorId = req.user._id;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const appointments = await Appointment.find(query)
    .populate('patientId', 'name age gender contact')
    .populate('doctorId', 'name email')
    .sort({ date: -1 });

  res.status(200).json(appointments);
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (req.user.role === 'doctor' && String(appointment.doctorId) !== String(req.user._id)) {
    throw new ApiError(403, 'Doctors can only update their own appointments');
  }

  if (status) appointment.status = status;
  if (notes != null) appointment.notes = notes;

  const updated = await appointment.save();
  res.status(200).json(updated);
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (req.user.role === 'doctor' && String(appointment.doctorId) !== String(req.user._id)) {
    throw new ApiError(403, 'Doctors can only delete their own appointments');
  }

  await appointment.deleteOne();
  res.status(200).json({ message: 'Appointment deleted successfully' });
});

export const getDoctorSchedule = asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor') {
    throw new ApiError(403, 'Only doctors can access their schedule view');
  }

  const dateInput = req.query.date;
  let targetDate;

  if (dateInput) {
    const isDateOnlyFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateInput);

    if (isDateOnlyFormat) {
      const [year, month, day] = dateInput.split('-').map(Number);
      targetDate = new Date(year, month - 1, day);
    } else {
      targetDate = new Date(dateInput);
    }

    if (Number.isNaN(targetDate.getTime())) {
      throw new ApiError(400, 'Invalid date query format');
    }
  } else {
    targetDate = new Date();
  }

  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const schedule = await Appointment.find({
    doctorId: req.user._id,
    date: { $gte: start, $lte: end },
  })
    .populate('patientId', 'name age gender contact')
    .sort({ date: 1 });

  res.status(200).json(schedule);
});