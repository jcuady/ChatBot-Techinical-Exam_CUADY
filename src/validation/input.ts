/**
 * General input validation utilities.
 *
 * All user input is treated as untrusted. These validators enforce
 * reasonable constraints without being overly restrictive about
 * legitimate cultural variations in names or addresses.
 */

import { MAX_NAME_LENGTH, MAX_ADDRESS_LENGTH, MAX_INPUT_LENGTH } from './constants';

export interface InputValidationResult {
  valid: boolean;
  sanitized: string;
  message?: string;
}

/**
 * Sanitizes raw input: trims whitespace and enforces maximum length.
 * This is the first step applied to ALL user input.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().substring(0, MAX_INPUT_LENGTH);
}

/**
 * Validates a human name.
 *
 * Allows letters, spaces, hyphens, apostrophes, periods, and common
 * Unicode letters. Does not make assumptions about cultural naming
 * conventions — "Mary-Jane", "O'Connor", "Juan D. Cruz" are all valid.
 */
export function validateName(input: string): InputValidationResult {
  const sanitized = sanitizeInput(input);

  if (sanitized.length === 0) {
    return {
      valid: false,
      sanitized,
      message: 'Please enter your name.',
    };
  }

  if (sanitized.length > MAX_NAME_LENGTH) {
    return {
      valid: false,
      sanitized: sanitized.substring(0, MAX_NAME_LENGTH),
      message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  // Allow letters (including Unicode), spaces, hyphens, apostrophes, periods
  const namePattern = /^[\p{L}\s'\-.\u00C0-\u024F]+$/u;
  if (!namePattern.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      message: 'Please enter a valid name (letters, spaces, hyphens, apostrophes, and periods are allowed).',
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validates an address.
 *
 * Addresses are free-form text. We only reject empty input and
 * enforce a maximum length. We do not over-validate legitimate
 * addresses which may contain numbers, punctuation, and special
 * characters.
 */
export function validateAddress(input: string): InputValidationResult {
  const sanitized = sanitizeInput(input);

  if (sanitized.length === 0) {
    return {
      valid: false,
      sanitized,
      message: 'Please enter your address.',
    };
  }

  if (sanitized.length > MAX_ADDRESS_LENGTH) {
    return {
      valid: false,
      sanitized: sanitized.substring(0, MAX_ADDRESS_LENGTH),
      message: `Address must be ${MAX_ADDRESS_LENGTH} characters or fewer.`,
    };
  }

  return { valid: true, sanitized };
}
