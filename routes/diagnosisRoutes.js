import express from 'express';
import {
  runPrescriptionExplanation,
  runRiskDetection,
  runSymptomCheck,
} from '../controllers/diagnosisController.js';
import { protect } from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect, allowRoles('doctor'));

router.post('/symptom-check', runSymptomCheck);
router.post('/risk-detection', runRiskDetection);
router.post('/prescription-explain', runPrescriptionExplanation);

export default router;