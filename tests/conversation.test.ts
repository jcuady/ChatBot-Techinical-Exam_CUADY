/**
 * Conversation flow tests.
 *
 * Tests the complete state machine: happy path, restart flow,
 * invalid mobile rejection, and unexpected input handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { handleMessage } from '../src/conversation/flow';
import { clearState } from '../src/state/conversationState';

const CONV_ID = 'test-conversation';

describe('Conversation Flow', () => {
  beforeEach(() => {
    clearState(CONV_ID);
  });

  describe('happy path: START → Name → Mobile → Address → Confirm → Complete', () => {
    it('completes the full flow', () => {
      // Step 1: Enter name
      const nameResponse = handleMessage(CONV_ID, 'Juan Dela Cruz');
      expect(nameResponse.length).toBeGreaterThan(0);
      expect(nameResponse[0].text).toContain('Juan Dela Cruz');
      expect(nameResponse[0].text).toContain('mobile');

      // Step 2: Enter valid mobile
      const mobileResponse = handleMessage(CONV_ID, '09171234567');
      expect(mobileResponse.length).toBeGreaterThan(0);
      expect(mobileResponse[0].text).toContain('address');

      // Step 3: Enter address
      const addressResponse = handleMessage(CONV_ID, 'Quezon City, Metro Manila');
      expect(addressResponse.length).toBeGreaterThan(0);
      expect(addressResponse[0].text).toContain('Juan Dela Cruz');
      expect(addressResponse[0].text).toContain('+639171234567');
      expect(addressResponse[0].text).toContain('Quezon City, Metro Manila');

      // Step 4: Confirm
      const confirmResponse = handleMessage(CONV_ID, 'yes');
      expect(confirmResponse.length).toBeGreaterThan(0);
      expect(confirmResponse[0].text).toContain('Thank you');
      expect(confirmResponse[0].text).toContain('Juan');
    });
  });

  describe('restart flow: Name → Mobile → Address → No → ASK_NAME', () => {
    it('clears state and restarts on rejection', () => {
      handleMessage(CONV_ID, 'Maria Santos');
      handleMessage(CONV_ID, '09181234567');
      handleMessage(CONV_ID, 'Makati City');

      // Reject at confirmation
      const restartResponse = handleMessage(CONV_ID, 'no');
      expect(restartResponse.length).toBeGreaterThan(0);
      expect(restartResponse[0].text).toContain('start again');
      expect(restartResponse[0].text).toContain('name');

      // Should be back at ASK_NAME — entering a name should work
      const newNameResponse = handleMessage(CONV_ID, 'New Name');
      expect(newNameResponse[0].text).toContain('New Name');
      expect(newNameResponse[0].text).toContain('mobile');
    });
  });

  describe('invalid mobile stays in ASK_MOBILE', () => {
    it('re-prompts on invalid mobile and accepts valid retry', () => {
      handleMessage(CONV_ID, 'Test User');

      // Invalid mobile
      const invalidResponse = handleMessage(CONV_ID, '12345');
      expect(invalidResponse[0].text).toContain('valid Philippine mobile');

      // Another invalid
      const invalid2 = handleMessage(CONV_ID, 'ABC123');
      expect(invalid2[0].text).toContain('valid Philippine mobile');

      // Valid mobile should now advance
      const validResponse = handleMessage(CONV_ID, '09171234567');
      expect(validResponse[0].text).toContain('address');
    });
  });

  describe('unexpected input at CONFIRM', () => {
    it('re-prompts with available options', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      handleMessage(CONV_ID, 'Test Address');

      const unexpectedResponse = handleMessage(CONV_ID, 'asdfgh');
      expect(unexpectedResponse[0].text).toContain('choose one');
    });
  });

  describe('restart command from any state', () => {
    it('restarts from ASK_MOBILE', () => {
      handleMessage(CONV_ID, 'Test User');
      const restartResponse = handleMessage(CONV_ID, 'restart');
      expect(restartResponse[0].text).toContain('start again');
    });

    it('restarts from ASK_ADDRESS', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      const restartResponse = handleMessage(CONV_ID, 'start over');
      expect(restartResponse[0].text).toContain('start again');
    });
  });

  describe('"Yes, submit" text variant at confirmation', () => {
    it('accepts "yes, submit" as confirmation', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      handleMessage(CONV_ID, 'Test Address');

      const response = handleMessage(CONV_ID, 'yes, submit');
      expect(response[0].text).toContain('Thank you');
    });
  });

  describe('"Start over" text variant at confirmation', () => {
    it('accepts "start over" as rejection', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      handleMessage(CONV_ID, 'Test Address');

      const response = handleMessage(CONV_ID, 'start over');
      expect(response[0].text).toContain('start again');
    });
  });

  describe('Adaptive Cards are included in responses', () => {
    it('includes adaptive card at confirmation step', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');

      const response = handleMessage(CONV_ID, 'Test Address');
      expect(response[0].adaptiveCard).toBeDefined();
      expect(response[0].adaptiveCard?.type).toBe('AdaptiveCard');
    });

    it('includes adaptive card at completion step', () => {
      handleMessage(CONV_ID, 'Test User');
      handleMessage(CONV_ID, '09171234567');
      handleMessage(CONV_ID, 'Test Address');

      const response = handleMessage(CONV_ID, 'yes');
      expect(response[0].adaptiveCard).toBeDefined();
    });
  });
});
