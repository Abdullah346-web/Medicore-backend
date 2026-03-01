import express from 'express';
import { updateSubscriptionPlan } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.patch('/plan', protect, updateSubscriptionPlan);

export default router;