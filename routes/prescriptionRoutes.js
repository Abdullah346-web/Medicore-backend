import express from 'express';
import {
  createPrescription,
  getPrescriptionsByPatient,
  regeneratePrescriptionPdf,
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roleMiddleware.js';
import { requireProPlan } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', allowRoles('doctor'), createPrescription);
router.get('/patient/:patientId', allowRoles('admin', 'doctor', 'receptionist'), getPrescriptionsByPatient);
router.post('/:id/regenerate-pdf', allowRoles('doctor'), regeneratePrescriptionPdf);
router.get('/pro/check', allowRoles('doctor'), requireProPlan, (_req, res) => {
  res.status(200).json({ message: 'Pro plan active for AI features' });
});

export default router;