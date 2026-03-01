import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import DiagnosisLog from '../models/DiagnosisLog.js';

export const getAdminAnalytics = async () => {
  const [totalPatients, totalDoctors] = await Promise.all([
    Patient.countDocuments(),
    User.countDocuments({ role: 'doctor' }),
  ]);

  const monthlyAppointments = await Appointment.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const diagnosisStats = await DiagnosisLog.aggregate([
    {
      $group: {
        _id: '$riskLevel',
        total: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const mostCommonDiagnosis = diagnosisStats[0]?._id || 'N/A';
  const revenueSimulation = totalPatients * Number(process.env.SIMULATED_ARPU || 30);

  return {
    totalPatients,
    totalDoctors,
    monthlyAppointments,
    revenueSimulation,
    mostCommonDiagnosis,
    diagnosisStats,
  };
};

export const getDoctorAnalytics = async (doctorId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [dailyAppointments, prescriptionCount, monthlyStats] = await Promise.all([
    Appointment.countDocuments({
      doctorId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    Prescription.countDocuments({ doctorId }),
    Appointment.aggregate([
      { $match: { doctorId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    dailyAppointments,
    monthlyStats,
    prescriptionCount,
  };
};