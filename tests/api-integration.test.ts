/**
 * DCBSD Chatbot Simulation — Express API Integration Test Suite
 * Author: Malcolm Joaquin L. Cuady
 * Role: Principal QA Engineer
 *
 * Exhaustive integration testing for all server HTTP endpoints:
 *   - GET  /api/health
 *   - POST /api/chat/start
 *   - POST /api/chat
 *   - POST /api/messages (Bot Framework / Microsoft Agents SDK Protocol)
 *   - GET  / (Static UI Client)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../src/index';

interface BotResponseItem {
  type?: string;
  text?: string;
  adaptiveCard?: {
    type: string;
    version: string;
    body?: Array<Record<string, unknown>>;
  };
  attachments?: Array<{
    contentType: string;
    content: unknown;
  }>;
}

interface ApiResponsePayload {
  status?: string;
  timestamp?: string;
  error?: string;
  responses?: BotResponseItem[];
}

describe('Express Server API Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe('1. Health Check Endpoint (GET /api/health)', () => {
    it('returns HTTP 200 with healthy status and valid ISO timestamp', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as ApiResponsePayload;
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(Number.isNaN(Date.parse(data.timestamp ?? ''))).toBe(false);
    });
  });

  describe('2. Conversation Initialization (POST /api/chat/start)', () => {
    it('returns HTTP 200 with 3-part structured welcome sequence', async () => {
      const res = await fetch(`${baseUrl}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'test-init-1' }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as ApiResponsePayload;
      expect(Array.isArray(data.responses)).toBe(true);
      expect((data.responses?.length ?? 0)).toBeGreaterThanOrEqual(3);
      expect(data.responses?.[0]?.text).toContain('DCBSD Chatbot Assistant');
      expect(data.responses?.[(data.responses?.length ?? 1) - 1]?.text?.toLowerCase()).toContain('name');
    });

    it('returns HTTP 400 when conversationId is missing or empty', async () => {
      const res = await fetch(`${baseUrl}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as ApiResponsePayload;
      expect(data).toHaveProperty('error');
    });
  });

  describe('3. REST Chat Endpoint (POST /api/chat)', () => {
    const convId = 'rest-chat-flow-' + Date.now();

    it('returns HTTP 400 when missing conversationId or text', async () => {
      const res1 = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello' }),
      });
      expect(res1.status).toBe(400);

      const res2 = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      });
      expect(res2.status).toBe(400);
    });

    it('executes full 5-step intake conversation flow over HTTP', async () => {
      // Step 1: Send Name
      const nameRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, text: 'Juan Dela Cruz' }),
      });
      expect(nameRes.status).toBe(200);
      const nameData = (await nameRes.json()) as ApiResponsePayload;
      expect(nameData.responses?.[0]?.text).toContain('Juan Dela Cruz');
      expect(nameData.responses?.[0]?.text?.toLowerCase()).toContain('mobile');

      // Step 2: Send Invalid Mobile -> Validation guidance
      const badMobileRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, text: '09123' }),
      });
      expect(badMobileRes.status).toBe(200);
      const badMobileData = (await badMobileRes.json()) as ApiResponsePayload;
      expect(badMobileData.responses?.[0]?.text).toContain('valid Philippine mobile number');

      // Step 3: Send Valid Mobile -> Prompt for Address
      const goodMobileRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, text: '09171234567' }),
      });
      expect(goodMobileRes.status).toBe(200);
      const goodMobileData = (await goodMobileRes.json()) as ApiResponsePayload;
      expect(goodMobileData.responses?.[0]?.text?.toLowerCase()).toContain('address');

      // Step 4: Send Address -> Summary with Adaptive Card
      const addrRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, text: 'Makati Central Business District' }),
      });
      expect(addrRes.status).toBe(200);
      const addrData = (await addrRes.json()) as ApiResponsePayload;
      expect(addrData.responses?.[0]?.adaptiveCard).toBeDefined();
      expect(addrData.responses?.[0]?.adaptiveCard?.type).toBe('AdaptiveCard');

      // Step 5: Confirm -> Completion Card & message
      const confirmRes = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, text: 'yes' }),
      });
      expect(confirmRes.status).toBe(200);
      const confirmData = (await confirmRes.json()) as ApiResponsePayload;
      expect(confirmData.responses?.[0]?.text).toContain('Thank you');
      expect(confirmData.responses?.[0]?.adaptiveCard).toBeDefined();
    });
  });

  describe('4. Bot Framework / Agents SDK Protocol Endpoint (POST /api/messages)', () => {
    const bfConvId = 'bf-proto-' + Date.now();

    it('processes standard Bot Framework message Activity payload', async () => {
      const activityPayload = {
        type: 'message',
        text: 'Malcolm Joaquin L. Cuady',
        conversation: { id: bfConvId },
        channelId: 'emulator',
        from: { id: 'client-user', name: 'User' },
        recipient: { id: 'bot-dcbsd', name: 'DCBSD Assistant' },
      };

      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityPayload),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as ApiResponsePayload;
      expect(Array.isArray(data.responses)).toBe(true);
      expect((data.responses?.length ?? 0)).toBeGreaterThan(0);
      expect(data.responses?.[0]?.type).toBe('message');
      expect(data.responses?.[0]?.text).toContain('Malcolm Joaquin L. Cuady');
    });

    it('handles conversationUpdate activity with membersAdded', async () => {
      const convUpdatePayload = {
        type: 'conversationUpdate',
        conversation: { id: 'welcome-conv-1' },
        channelId: 'emulator',
        recipient: { id: 'bot-dcbsd' },
        membersAdded: [
          { id: 'new-client-user', name: 'Prospective Client' },
        ],
      };

      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convUpdatePayload),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as ApiResponsePayload;
      expect(Array.isArray(data.responses)).toBe(true);
      expect((data.responses?.length ?? 0)).toBeGreaterThanOrEqual(3);
    });

    it('handles Adaptive Card Action.Submit activity value payload', async () => {
      const cardSubmitConvId = 'card-submit-' + Date.now();

      // Step 1: Name
      await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          text: 'Juan Dela Cruz',
          conversation: { id: cardSubmitConvId },
        }),
      });

      // Step 2: Mobile
      await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          text: '09171234567',
          conversation: { id: cardSubmitConvId },
        }),
      });

      // Step 3: Address
      await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          text: 'BGC Taguig',
          conversation: { id: cardSubmitConvId },
        }),
      });

      // Step 4: Submit via Adaptive Card action
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          conversation: { id: cardSubmitConvId },
          value: { action: 'submit' },
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as ApiResponsePayload;
      expect((data.responses?.length ?? 0)).toBeGreaterThan(0);
      expect(data.responses?.[0]?.text).toContain('Thank you');
    });

    it('returns HTTP 400 for empty or invalid request body', async () => {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as ApiResponsePayload;
      expect(data).toHaveProperty('error');
    });
  });

  describe('5. Static Client UI Asset Delivery', () => {
    it('serves the web client HTML at root /', async () => {
      const res = await fetch(`${baseUrl}/`);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('DCBSD');
      expect(html).toContain('chat-messages');
      expect(html).toContain('chat-input');
    });
  });
});
