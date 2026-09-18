/**
 * Mobile number validation tests.
 *
 * Covers valid Philippine formats, invalid inputs, edge cases,
 * normalization, and security-relevant payloads.
 */

import { describe, it, expect } from 'vitest';
import { validateMobileNumber } from '../src/validation/mobile';

describe('validateMobileNumber', () => {
  describe('valid Philippine mobile numbers', () => {
    it('accepts 09171234567 format', () => {
      const result = validateMobileNumber('09171234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639171234567');
    });

    it('accepts 09181234567 format', () => {
      const result = validateMobileNumber('09181234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639181234567');
    });

    it('accepts 09201234567 format', () => {
      const result = validateMobileNumber('09201234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639201234567');
    });

    it('accepts +639171234567 format', () => {
      const result = validateMobileNumber('+639171234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639171234567');
    });

    it('accepts 639171234567 format (without +)', () => {
      const result = validateMobileNumber('639171234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639171234567');
    });

    it('accepts number with spaces', () => {
      const result = validateMobileNumber('0917 123 4567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639171234567');
    });

    it('accepts number with dashes', () => {
      const result = validateMobileNumber('0917-123-4567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639171234567');
    });

    it('accepts 09051234567 (Smart prefix)', () => {
      const result = validateMobileNumber('09051234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639051234567');
    });

    it('accepts 09991234567', () => {
      const result = validateMobileNumber('09991234567');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+639991234567');
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty string', () => {
      const result = validateMobileNumber('');
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('rejects whitespace-only', () => {
      const result = validateMobileNumber('   ');
      expect(result.valid).toBe(false);
    });

    it('rejects short number: 12345', () => {
      const result = validateMobileNumber('12345');
      expect(result.valid).toBe(false);
    });

    it('rejects alphabetic: ABC123', () => {
      const result = validateMobileNumber('ABC123');
      expect(result.valid).toBe(false);
    });

    it('rejects too short: 091712345 (9 digits)', () => {
      const result = validateMobileNumber('091712345');
      expect(result.valid).toBe(false);
    });

    it('rejects too long: 091712345678 (12 digits)', () => {
      const result = validateMobileNumber('091712345678');
      expect(result.valid).toBe(false);
    });

    it('rejects non-mobile prefix: 08171234567', () => {
      const result = validateMobileNumber('08171234567');
      expect(result.valid).toBe(false);
    });

    it('rejects landline-like number: 021234567', () => {
      const result = validateMobileNumber('021234567');
      expect(result.valid).toBe(false);
    });

    it('rejects +63 with wrong starting digit', () => {
      const result = validateMobileNumber('+638171234567');
      expect(result.valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('rejects special characters: !@#$%', () => {
      const result = validateMobileNumber('!@#$%^&*()');
      expect(result.valid).toBe(false);
    });

    it('rejects very long string', () => {
      const result = validateMobileNumber('0917' + '1'.repeat(500));
      expect(result.valid).toBe(false);
    });

    it('handles null-like input gracefully', () => {
      // TypeScript would catch this, but testing runtime safety
      const result = validateMobileNumber(undefined as unknown as string);
      expect(result.valid).toBe(false);
    });

    it('rejects number starting with 0 but not 09', () => {
      const result = validateMobileNumber('07171234567');
      expect(result.valid).toBe(false);
    });
  });

  describe('normalization', () => {
    it('normalizes 09171234567 to +639171234567', () => {
      const result = validateMobileNumber('09171234567');
      expect(result.normalized).toBe('+639171234567');
    });

    it('normalizes 639171234567 to +639171234567', () => {
      const result = validateMobileNumber('639171234567');
      expect(result.normalized).toBe('+639171234567');
    });

    it('preserves +639171234567 as-is', () => {
      const result = validateMobileNumber('+639171234567');
      expect(result.normalized).toBe('+639171234567');
    });

    it('strips whitespace before normalizing', () => {
      const result = validateMobileNumber('  0917 123 4567  ');
      expect(result.normalized).toBe('+639171234567');
    });
  });
});
