/**
 * Security-focused tests.
 *
 * Verifies that malicious input (XSS, SQL injection, oversized
 * payloads) does not cause crashes, unexpected state transitions,
 * or unsafe behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { handleMessage } from '../src/conversation/flow';
import { clearState } from '../src/state/conversationState';

const CONV_ID = 'security-test';

describe('Security Tests', () => {
  beforeEach(() => {
    clearState(CONV_ID);
  });

  describe('XSS payloads', () => {
    it('handles script tag as name input without crash', () => {
      const response = handleMessage(CONV_ID, '<script>alert(1)</script>');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      // Should be rejected as invalid name (contains < > characters)
      expect(response[0].text).toBeDefined();
    });

    it('handles script tag as address without crash', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');

      const response = handleMessage(CONV_ID, '<script>alert("xss")</script>');
      expect(response).toBeDefined();
      // Address is more permissive but should still handle safely
      expect(response.length).toBeGreaterThan(0);
    });

    it('handles img onerror payload', () => {
      const response = handleMessage(CONV_ID, '<img onerror="alert(1)" src="x">');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('SQL injection payloads', () => {
    it('handles SQL injection as name', () => {
      const response = handleMessage(CONV_ID, "' OR '1'='1");
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });

    it('handles SQL injection as mobile', () => {
      handleMessage(CONV_ID, 'Test User');
      const response = handleMessage(CONV_ID, "'; DROP TABLE users; --");
      expect(response).toBeDefined();
      // Should be rejected as invalid mobile
      expect(response[0].text).toContain('valid Philippine mobile');
    });

    it('handles SQL injection as address', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      const response = handleMessage(CONV_ID, "1; DROP TABLE addresses;");
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('oversized input', () => {
    it('handles extremely long name input', () => {
      const longName = 'A'.repeat(10000);
      const response = handleMessage(CONV_ID, longName);
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      // Should be rejected due to length
    });

    it('handles extremely long mobile input', () => {
      handleMessage(CONV_ID, 'Test User');
      const longMobile = '0917' + '1'.repeat(10000);
      const response = handleMessage(CONV_ID, longMobile);
      expect(response).toBeDefined();
      expect(response[0].text).toContain('valid Philippine mobile');
    });

    it('handles extremely long address input', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      const longAddress = 'A'.repeat(10000);
      const response = handleMessage(CONV_ID, longAddress);
      expect(response).toBeDefined();
      // Should be rejected due to length
    });
  });

  describe('special characters and encoding', () => {
    it('handles unicode characters', () => {
      const response = handleMessage(CONV_ID, '日本語テスト');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });

    it('handles emoji input', () => {
      const response = handleMessage(CONV_ID, '😀😁😂🤣');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });

    it('handles null bytes', () => {
      const response = handleMessage(CONV_ID, 'Test\x00User');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('state safety', () => {
    it('never leaves conversation in undefined state', () => {
      // Rapid-fire random inputs
      const inputs = ['', '   ', '<script>', "' OR 1=1", 'a'.repeat(5000), '09171234567', 'yes', 'no'];
      for (const input of inputs) {
        const response = handleMessage(CONV_ID, input);
        expect(response).toBeDefined();
        expect(response.length).toBeGreaterThan(0);
        expect(response[0].text).toBeDefined();
      }
    });

    it('recovers from complete flow and starts over', () => {
      // Complete a full flow
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      handleMessage(CONV_ID, 'Test Address');
      handleMessage(CONV_ID, 'yes');

      // After completion, next message should start new flow
      const response = handleMessage(CONV_ID, 'New conversation');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });
});
