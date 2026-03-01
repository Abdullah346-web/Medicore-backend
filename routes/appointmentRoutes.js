import express from 'express';
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  getDoctorSchedule,
  updateAppointmentStatus,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/doctor/schedule', allowRoles('doctor'), getDoctorSchedule);
router
  .route('/')
  .post(allowRoles('admin', 'doctor', 'receptionist'), createAppointment)
  .get(allowRoles('admin', 'doctor', 'receptionist'), getAppointments);

router.patch('/:id/status', allowRoles('admin', 'doctor', 'receptionist'), updateAppointmentStatus);
router.delete('/:id', allowRoles('admin', 'doctor', 'receptionist'), deleteAppointment);

export default router;