import { Router } from 'express';
import { login, register, me, completeOnboarding, updateBusiness, updatePersonal, changePassword, updateLogo, verifyEmail, verifyLogin2FA } from '../controllers/auth.controller.js';
import { authRequired } from '../middlewares/auth.middleware.js';
import { uploadLogo } from '../middlewares/upload.middleware.js';

const router = Router();

router.post('/register', uploadLogo, register);
router.post('/login', login);
router.post('/login/verify-2fa', verifyLogin2FA);
router.post('/verify-email', verifyEmail);
router.get('/me', authRequired, me);
router.post('/complete-onboarding', authRequired, completeOnboarding);

router.put('/profile/business', authRequired, updateBusiness);
router.put('/profile/personal', authRequired, updatePersonal);
router.put('/profile/password', authRequired, changePassword);
router.put('/profile/logo', authRequired, uploadLogo, updateLogo);

export default router;
