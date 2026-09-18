/**
 * Philippine mobile number validation.
 *
 * This implementation validates the formats required by the
 * technical-examination scenario rather than claiming universal
 * international phone-number validation.
 *
 * Accepted formats:
 *   09XXXXXXXXX   (11 digits, starts with 09)
 *   +639XXXXXXXXX (+63 prefix, 12 digits total)
 *   639XXXXXXXXX  (63 prefix without +, 12 digits)
 *
 * The second digit after the network prefix (09XX) must be a
 * recognized Philippine mobile network prefix.
 */

export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  message?: string;
}

/**
 * Known Philippine mobile network prefixes (the 2-digit code after "09").
 * Covers Globe, Smart, Sun, TNT, DITO, and other major telcos.
 */
const VALID_PH_PREFIXES = new Set([
  '05', '06', '07', '08', '09',
  '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
  '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '50', '51', '53', '54', '55', '56', '57', '58', '59',
  '60', '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '70', '71', '73', '75', '76', '77', '78', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '90', '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

const INVALID_MOBILE_MESSAGE =
  'That doesn\'t look like a valid Philippine mobile number.\n\n' +
  'Please enter an 11-digit mobile number, for example:\n\n' +
  '09171234567\n\n' +
  'You can also use the +63 format.';

/**
 * Validates a Philippine mobile number and normalizes to +63 format.
 *
 * @param input - Raw user input
 * @returns Validation result with normalized number if valid
 */
export function validateMobileNumber(input: string): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { valid: false, message: INVALID_MOBILE_MESSAGE };
  }

  // Strip whitespace, dashes, and parentheses that users sometimes add
  const cleaned = input.replace(/[\s\-()]/g, '');

  if (cleaned.length === 0) {
    return { valid: false, message: INVALID_MOBILE_MESSAGE };
  }

  // Reject non-numeric characters (except leading +)
  if (!/^\+?\d+$/.test(cleaned)) {
    return { valid: false, message: INVALID_MOBILE_MESSAGE };
  }

  let localNumber: string;

  if (cleaned.startsWith('+63')) {
    // +639XXXXXXXXX format → should be 13 chars total (+63 + 10 digits)
    const digits = cleaned.slice(3);
    if (digits.length !== 10 || !digits.startsWith('9')) {
      return { valid: false, message: INVALID_MOBILE_MESSAGE };
    }
    localNumber = '0' + digits;
  } else if (cleaned.startsWith('63')) {
    // 639XXXXXXXXX format → should be 12 chars total (63 + 10 digits)
    const digits = cleaned.slice(2);
    if (digits.length !== 10 || !digits.startsWith('9')) {
      return { valid: false, message: INVALID_MOBILE_MESSAGE };
    }
    localNumber = '0' + digits;
  } else if (cleaned.startsWith('09')) {
    // 09XXXXXXXXX format → should be 11 chars total
    if (cleaned.length !== 11) {
      return { valid: false, message: INVALID_MOBILE_MESSAGE };
    }
    localNumber = cleaned;
  } else {
    return { valid: false, message: INVALID_MOBILE_MESSAGE };
  }

  // Validate the network prefix (3rd and 4th digits, e.g., "17" from "0917")
  const networkPrefix = localNumber.substring(2, 4);
  if (!VALID_PH_PREFIXES.has(networkPrefix)) {
    return { valid: false, message: INVALID_MOBILE_MESSAGE };
  }

  // Normalize to +63 international format
  const normalized = '+63' + localNumber.substring(1);

  return { valid: true, normalized };
}
