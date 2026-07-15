import { customAlphabet } from 'nanoid';
import { env } from '../config/env.js';

// Alphabet avoids ambiguous charactersfor readability
const alphabet = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateShortCode = customAlphabet(alphabet, env.shortCodeLength);

const RESERVED_WORDS = new Set([
  'api', 'auth', 'login', 'register', 'dashboard', 'admin', 'app',
  'static', 'assets', 'health', 'favicon.ico', 'robots.txt', 'www',
]);

export const isReservedAlias = (alias) => RESERVED_WORDS.has(alias.toLowerCase());

// Custom aliases: 3-30 chars, letters/numbers/hyphen/underscore only
export const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
