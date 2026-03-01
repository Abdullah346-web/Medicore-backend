import express from 'express';
import {
	changePassword,
	register,
	login,
	getMe,
	getStaffUsers,
	updateStaffUser,
	deleteStaffUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/register', protect, allowRoles('admin'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.get('/staff', protect, allowRoles('admin', 'receptionist'), getStaffUsers);
router.put('/staff/:id', protect, allowRoles('admin'), updateStaffUser);
router.delete('/staff/:id', protect, allowRoles('admin'), deleteStaffUser);

export default router;