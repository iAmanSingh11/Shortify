import { v4 as uuidv4 } from 'uuid';

// Adds a unique request ID to help trace requests across the application.
export const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};
