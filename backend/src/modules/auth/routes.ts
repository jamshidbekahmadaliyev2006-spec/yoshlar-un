import { Router } from 'express';
import { AuthController } from './controller';
import { validate } from '../../middleware/validate';
import { loginSchema, otpSendSchema, otpVerifySchema } from './schema';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/otp/send', validate(otpSendSchema), AuthController.sendOtp);
router.post('/otp/verify', validate(otpVerifySchema), AuthController.verifyOtp);
router.get('/me', authMiddleware, AuthController.getMe);

export default router;

