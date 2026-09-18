/**
 * Input validation tests for name and address validators.
 */

import { describe, it, expect } from 'vitest';
import { validateName, validateAddress, sanitizeInput } from '../src/validation/input';

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('returns empty string for null-like input', () => {
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
    expect(sanitizeInput(null as unknown as string)).toBe('');
    expect(sanitizeInput('')).toBe('');
  });

  it('truncates to max length', () => {
    const long = 'a'.repeat(2000);
    const result = sanitizeInput(long);
    expect(result.length).toBe(1000);
  });
});

describe('validateName', () => {
  it('accepts normal names', () => {
    expect(validateName('Juan Dela Cruz').valid).toBe(true);
    expect(validateName('Maria Santos').valid).toBe(true);
    expect(validateName('John Smith').valid).toBe(true);
  });

  it('accepts names with hyphens', () => {
    expect(validateName('Mary-Jane').valid).toBe(true);
  });

  it('accepts names with apostrophes', () => {
    expect(validateName("O'Connor").valid).toBe(true);
  });

  it('accepts names with periods', () => {
    expect(validateName('Juan D. Cruz').valid).toBe(true);
  });

  it('rejects empty input', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('rejects whitespace-only input', () => {
    expect(validateName('   ').valid).toBe(false);
  });

  it('rejects names with numbers', () => {
    expect(validateName('John123').valid).toBe(false);
  });

  it('rejects names with special characters', () => {
    expect(validateName('John@Doe').valid).toBe(false);
  });

  it('rejects very long names', () => {
    const longName = 'A'.repeat(200);
    expect(validateName(longName).valid).toBe(false);
  });

  it('trims input before validation', () => {
    const result = validateName('  Juan  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Juan');
  });
});

describe('validateAddress', () => {
  it('accepts normal addresses', () => {
    expect(validateAddress('Quezon City, Metro Manila').valid).toBe(true);
    expect(validateAddress('123 Main Street, Makati City').valid).toBe(true);
  });

  it('rejects empty input', () => {
    expect(validateAddress('').valid).toBe(false);
  });

  it('rejects whitespace-only input', () => {
    expect(validateAddress('   ').valid).toBe(false);
  });

  it('rejects very long addresses', () => {
    const longAddr = 'A'.repeat(600);
    expect(validateAddress(longAddr).valid).toBe(false);
  });

  it('accepts addresses with special characters', () => {
    expect(validateAddress('Unit 4B, #123 Rizal Ave.').valid).toBe(true);
    expect(validateAddress('Brgy. San Jose, 2nd Floor').valid).toBe(true);
  });
});
