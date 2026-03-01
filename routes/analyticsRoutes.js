import express from 'express';
import { adminDashboard, doctorDashboard } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/admin', protect, allowRoles('admin'), adminDashboard);
router.get('/doctor', protect, allowRoles('doctor'), doctorDashboard);

export default router;