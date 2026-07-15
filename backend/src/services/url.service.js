import Url from '../models/Url.js';
import { generateShortCode, isReservedAlias } from '../utils/shortCode.js';
import { ApiError } from '../utils/ApiError.js';

// Generates a unique short code, retrying on the rare collision.
export const generateUniqueShortCode = async () => {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = generateShortCode();
    // eslint disable next line no await in loop
    const exists = await Url.exists({ shortCode: code });
    if (!exists) return code;
  }
  throw new ApiError(500, 'Could not generate a unique short code, please try again');
};

export const ensureAliasAvailable = async (alias) => {
  if (isReservedAlias(alias)) {
    throw new ApiError(400, `"${alias}" is a reserved word and cannot be used as an alias`);
  }
  const exists = await Url.exists({ shortCode: alias });
  if (exists) {
    throw new ApiError(409, `Alias "${alias}" is already taken`);
  }
};
