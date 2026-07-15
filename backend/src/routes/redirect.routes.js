import { Router } from 'express';
import { handleRedirect, verifyAndRedirect } from '../controllers/redirect.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { verifyPasswordSchema } from '../validators/url.validator.js';
import { redirectLimiter } from '../middlewares/rateLimiter.middleware.js';

// Router for the pswd verific API
export const redirectApiRouter = Router();
redirectApiRouter.post('/:shortCode/verify', redirectLimiter, validate(verifyPasswordSchema), verifyAndRedirect);

// Router for the actual short link redirect
export const redirectRootRouter = Router();
redirectRootRouter.get('/:shortCode', redirectLimiter, handleRedirect);
