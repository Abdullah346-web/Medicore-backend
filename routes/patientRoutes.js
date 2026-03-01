import express from 'express';
import {
  deletePatient,
  getMedicalTimeline,
  getMyAppointments,
  getMyPrescriptions,
  getMyProfile,
  getPatientById,
  getPatients,
  registerPatientByReceptionist,
  updatePatient,
} from '../controllers/patientController.js';
import { protect } from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roleMiddleware.js';
import { enforceFreePatientLimit } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(allowRoles('admin', 'doctor', 'receptionist'), getPatients)
  .post(
    allowRoles('admin', 'receptionist'),
    enforceFreePatientLimit,
    registerPatientByReceptionist
  );

router.post(
  '/onboard',
  allowRoles('admin', 'receptionist'),
  enforceFreePatientLimit,
  registerPatientByReceptionist
);

router.get('/me/profile', allowRoles('patient'), getMyProfile);
router.get('/me/appointments', allowRoles('patient'), getMyAppointments);
router.get('/me/prescriptions', allowRoles('patient'), getMyPrescriptions);

router.get('/:id/timeline', allowRoles('admin', 'doctor', 'receptionist'), getMedicalTimeline);

router
  .route('/:id')
  .get(allowRoles('admin', 'doctor', 'receptionist'), getPatientById)
  .put(allowRoles('admin', 'doctor', 'receptionist'), updatePatient)
  .delete(allowRoles('admin', 'doctor', 'receptionist'), deletePatient);

export default router;