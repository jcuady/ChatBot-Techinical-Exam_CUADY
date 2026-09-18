/**
 * Centralized input validation constants.
 *
 * Reasonable limits to prevent denial-of-service through
 * excessively large input while not rejecting legitimate data.
 */

/** Maximum length for a human name. */
export const MAX_NAME_LENGTH = 100;

/** Maximum length for a street address. */
export const MAX_ADDRESS_LENGTH = 500;

/** Maximum raw input length accepted from any single message. */
export const MAX_INPUT_LENGTH = 1000;
