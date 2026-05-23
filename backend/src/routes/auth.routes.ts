import { Router } from 'express';

import { getCurrentUser, login, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), asyncHandler(register));
authRouter.post('/login', validateRequest(loginSchema), asyncHandler(login));
authRouter.get('/me', authenticate, asyncHandler(getCurrentUser));
