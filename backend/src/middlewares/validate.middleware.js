import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

// Middleware to validate incoming request data using Zod schemas.
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    req.body = parsed.body ?? req.body;
    if (parsed.params) req.params = parsed.params;
    if (parsed.query) req.query = parsed.query;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      }));
      return next(new ApiError(422, 'Validation failed', details));
    }
    next(err);
  }
};
