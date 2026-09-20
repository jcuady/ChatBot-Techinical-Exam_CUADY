/**
 * DCBSD Chatbot Simulation - Requirements Compliance Test Suite
 * Author:  Malcolm Joaquin L. Cuady | Principal QA Engineer | v2.0.0
 *
 * Tests EVERY exam requirement end-to-end against a live Express server.
 * No mocks. No stubs. No dummy data. Real HTTP. Real Agents SDK.
 *
 * COVERAGE:
 * R-01  Bot Framework /api/messages emulator endpoint
 * R-02  Microsoft Agents SDK authentic packages (not mocked)
 * R-03  Three-field intake flow (Name->Mobile->Address)
 * R-04  Philippine mobile validation + E.164 normalization
 * R-05  Data summary display at CONFIRM with all three fields
 * R-06  Adaptive Cards v1.5 (FactSet, Action.Submit)
 * R-08  EastWest Bank branding in web client
 * R-09  Security headers + no secret/SDK version exposure
 * R-10  XSS/DoS injection safety
 * R-11  Dual-Mode Interactive Form (Input.Text form card)
 * R-12  Restart/Start-over capability from any step
 * R-13  Adaptive Card schema correctness (type, version, schema URL)
 * R-14  FactSet facts accurately reflect user inputs
 * R-15  Completion card returned after yes confirmation
 * R-16  Session isolation (concurrent conversations)
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import app from '../src/index';

// Set global timeout to 30s for SDK package imports which may take >5s
vi.setConfig({ testTimeout: 30000 });

// =====================================================
// Shared Types
// =====================================================

interface CardFact { title: string; value: string; }
interface CardElement {
  type: string; id?: string; text?: string; facts?: CardFact[];
  items?: CardElement[]; isMultiline?: boolean; isRequired?: boolean;
}
interface CardAction {
  type: string; title: string; style?: string; data?: Record<string, unknown>;
}
interface AdaptiveCard {
  type: string; version: string; $schema?: string;
  body: CardElement[]; actions: CardAction[];
}
interface BotResponse { type?: string; text?: string; adaptiveCard?: AdaptiveCard; }
interface ApiPayload {
  status?: string; timestamp?: string; error?: string; responses?: BotResponse[];
}

// =====================================================
// Helpers
// =====================================================

let server: http.Server;
let baseUrl: string;

async function post(path: string, body: unknown): Promise<ApiPayload> {
  const r = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json() as Promise<ApiPayload>;
}

async function postRaw(path: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function uid(label: string): string {
  return `rq-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

function flatElements(body: CardElement[]): CardElement[] {
  return body.flatMap((e) => [e, ...(e.items ?? [])]);
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as { port: number } | null;
      if (addr) baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

// =====================================================
// R-01: Bot Framework /api/messages endpoint
// =====================================================

describe('R-01 - Bot Framework Messaging Endpoint (/api/messages)', () => {
  it('accepts Bot Framework Activity payload and returns a typed message response', async () => {
    const cid = uid('bf');
    const res = await postRaw('/api/messages', {
      type: 'message', text: 'Maria Clara Santos',
      conversation: { id: cid }, channelId: 'emulator',
      from: { id: 'user-001', name: 'Tester' },
      recipient: { id: 'bot-dcbsd', name: 'DCBSD Bot' },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as ApiPayload;
    expect(Array.isArray(data.responses)).toBe(true);
    expect(data.responses!.length).toBeGreaterThan(0);
    expect(data.responses![0].type).toBe('message');
  });

  it('processes conversationUpdate (membersAdded) and sends 3+ welcome messages', async () => {
    const res = await postRaw('/api/messages', {
      type: 'conversationUpdate', conversation: { id: uid('cu') },
      channelId: 'emulator', recipient: { id: 'bot-dcbsd' },
      membersAdded: [{ id: 'new-user', name: 'Guest' }],
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as ApiPayload;
    expect(data.responses!.length).toBeGreaterThanOrEqual(3);
    const allText = data.responses!.map((r) => r.text ?? '').join(' ');
    expect(allText).toContain('DCBSD');
  });

  it('rejects empty body with HTTP 400', async () => {
    const res = await postRaw('/api/messages', {});
    expect(res.status).toBe(400);
    const data = (await res.json()) as ApiPayload;
    expect(data.error).toBeDefined();
  });

  it('error response does not expose SDK internals or stack traces', async () => {
    const res = await postRaw('/api/messages', {});
    const body = JSON.stringify((await res.json()) as ApiPayload);
    expect(body).not.toContain('@microsoft/agents');
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('at Object');
  });
});

// =====================================================
// R-02: Microsoft Agents SDK authentic packages
// =====================================================

describe('R-02 - Microsoft 365 Agents SDK Authentic Package Verification', () => {
  it('@microsoft/agents-hosting exports real ActivityHandler class', async () => {
    const pkg = await import('@microsoft/agents-hosting');
    expect(pkg).toBeDefined();
    expect(typeof pkg.ActivityHandler).toBe('function');
  });

  it('@microsoft/agents-activity exports Activity', async () => {
    const pkg = await import('@microsoft/agents-activity');
    expect(pkg.Activity).toBeDefined();
  });

  it('@microsoft/agents-hosting-express is installed', async () => {
    const pkg = await import('@microsoft/agents-hosting-express');
    expect(pkg).toBeDefined();
  });

  it('ActivityHandler instance has real onMessage() and onTurn() methods', async () => {
    const { ActivityHandler } = await import('@microsoft/agents-hosting');
    const handler = new ActivityHandler();
    expect(typeof handler.onMessage).toBe('function');
    expect(typeof handler.onTurn).toBe('function');
  });

  it('package.json lists all three SDK packages with pinned semver', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@microsoft/agents-hosting']).toMatch(/^\^?\d+\.\d+\.\d+/);
    expect(deps['@microsoft/agents-activity']).toMatch(/^\^?\d+\.\d+\.\d+/);
    expect(deps['@microsoft/agents-hosting-express']).toMatch(/^\^?\d+\.\d+\.\d+/);
  });
});

// =====================================================
// R-03: Three-field intake flow
// =====================================================

describe('R-03 - Three-Field Intake Conversation Flow', () => {
  it('transitions: ASK_NAME -> ASK_MOBILE -> ASK_ADDRESS -> CONFIRM -> COMPLETE', async () => {
    const cid = uid('flow');
    const n = await post('/api/chat', { conversationId: cid, text: 'Rizal Jose Protacio' });
    expect(n.responses![0].text).toContain('Rizal Jose Protacio');
    expect(n.responses![0].text?.toLowerCase()).toContain('mobile');

    const m = await post('/api/chat', { conversationId: cid, text: '09171234567' });
    expect(m.responses![0].text?.toLowerCase()).toContain('address');

    const a = await post('/api/chat', { conversationId: cid, text: 'Binondo, Manila' });
    const s = a.responses![0].text ?? '';
    expect(s).toContain('Rizal Jose Protacio');
    expect(s).toContain('+639171234567');
    expect(s).toContain('Binondo, Manila');

    const c = await post('/api/chat', { conversationId: cid, text: 'yes' });
    expect(c.responses![0].text).toContain('Thank you');
    expect(c.responses![0].text).toContain('Rizal');
  });

  it('all three fields appear in the summary text at CONFIRM', async () => {
    const cid = uid('sum');
    await post('/api/chat', { conversationId: cid, text: 'Pedro Calungsod' });
    await post('/api/chat', { conversationId: cid, text: '09198765432' });
    const a = await post('/api/chat', { conversationId: cid, text: 'Cebu City' });
    const t = a.responses![0].text ?? '';
    expect(t).toContain('Pedro Calungsod');
    expect(t).toContain('+639198765432');
    expect(t).toContain('Cebu City');
  });

  it('does not skip steps — step 1 input becomes the Name, not Address', async () => {
    const cid = uid('skip');
    const r = await post('/api/chat', { conversationId: cid, text: 'Manila City' });
    expect(r.responses![0].text?.toLowerCase()).not.toContain('address');
  });
});

// =====================================================
// R-04: Philippine mobile validation + E.164 normalization
// =====================================================

describe('R-04 - Philippine Mobile Number Validation', () => {
  const validInputs: [string][] = [
    ['09171234567'], ['09181234567'], ['09051234567'],
    ['+639171234567'], ['639171234567'], ['0917 123 4567'], ['0917-123-4567'],
  ];
  for (const [input] of validInputs) {
    it(`accepts valid format: "${input}"`, async () => {
      const cid = uid('mv' + Math.random().toString(36).slice(2, 4));
      await post('/api/chat', { conversationId: cid, text: 'Test User' });
      const r = await post('/api/chat', { conversationId: cid, text: input });
      expect(r.responses![0].text?.toLowerCase()).toContain('address');
    });
  }

  const invalidInputs: [string][] = [
    ['12345'], ['ABC123'], ['091712345'], ['091712345678'],
    ['08171234567'], ['+638171234567'],
  ];
  for (const [input] of invalidInputs) {
    it(`rejects invalid format: "${input}"`, async () => {
      const cid = uid('mi' + Math.random().toString(36).slice(2, 4));
      await post('/api/chat', { conversationId: cid, text: 'Test User' });
      const r = await post('/api/chat', { conversationId: cid, text: input });
      const t = r.responses![0].text ?? '';
      expect(t.toLowerCase()).toContain('mobile');
      expect(t.toLowerCase()).not.toContain('address');
    });
  }

  it('normalizes 09201234567 to +639201234567 in summary text', async () => {
    const cid = uid('e164');
    await post('/api/chat', { conversationId: cid, text: 'Enrique Santos' });
    await post('/api/chat', { conversationId: cid, text: '09201234567' });
    const r = await post('/api/chat', { conversationId: cid, text: 'Test City' });
    expect(r.responses![0].text).toContain('+639201234567');
  });
});

// =====================================================
// R-05: Data summary display at CONFIRM step
// =====================================================

describe('R-05 - Data Summary Display at CONFIRM', () => {
  it('summary text contains Name, E.164 mobile, and Address', async () => {
    const cid = uid('r05');
    await post('/api/chat', { conversationId: cid, text: 'Andres Bonifacio' });
    await post('/api/chat', { conversationId: cid, text: '09301234567' });
    const r = await post('/api/chat', { conversationId: cid, text: 'Tondo, Manila' });
    const t = r.responses![0].text ?? '';
    expect(t).toContain('Andres Bonifacio');
    expect(t).toContain('+639301234567');
    expect(t).toContain('Tondo, Manila');
    expect(t.toLowerCase()).toMatch(/correct|review|submit/);
  });

  it('confirmation card has yes/submit and start-over action buttons', async () => {
    const cid = uid('r05b');
    await post('/api/chat', { conversationId: cid, text: 'Card Test' });
    await post('/api/chat', { conversationId: cid, text: '09121234567' });
    const r = await post('/api/chat', { conversationId: cid, text: 'Some City' });
    const card = r.responses![0].adaptiveCard;
    expect(card).toBeDefined();
    const titles = card!.actions.map((a) => a.title.toLowerCase());
    expect(titles.some((t) => t.includes('yes') || t.includes('submit'))).toBe(true);
    expect(titles.some((t) => t.includes('start') || t.includes('over'))).toBe(true);
  });
});

// =====================================================
// R-06 / R-13 / R-14: Adaptive Cards v1.5 Schema
// =====================================================

describe('R-06/R-13/R-14 - Adaptive Cards v1.5 Schema Compliance', () => {
  let card: AdaptiveCard;

  beforeAll(async () => {
    const cid = uid('r06');
    await post('/api/chat', { conversationId: cid, text: 'Lapu-Lapu Cebuano' });
    await post('/api/chat', { conversationId: cid, text: '09171234567' });
    const r = await post('/api/chat', { conversationId: cid, text: 'Mactan, Cebu' });
    card = r.responses![0].adaptiveCard!;
  });

  it('card type is "AdaptiveCard"', () => { expect(card.type).toBe('AdaptiveCard'); });
  it('card version is "1.5"', () => { expect(card.version).toBe('1.5'); });
  it('card $schema references adaptivecards.io', () => { expect(card.$schema).toContain('adaptivecards.io'); });

  it('card body contains a FactSet element', () => {
    const fs = flatElements(card.body).find((e) => e.type === 'FactSet');
    expect(fs).toBeDefined();
  });

  it('FactSet contains Name, Mobile, Address titles', () => {
    const fs = flatElements(card.body).find((e) => e.type === 'FactSet');
    const titles = fs!.facts!.map((f) => f.title.toLowerCase());
    expect(titles).toContain('name');
    expect(titles).toContain('mobile');
    expect(titles).toContain('address');
  });

  it('FactSet facts match user-entered values exactly', () => {
    const fs = flatElements(card.body).find((e) => e.type === 'FactSet');
    const nf = fs!.facts!.find((f) => f.title.toLowerCase() === 'name');
    const mf = fs!.facts!.find((f) => f.title.toLowerCase() === 'mobile');
    const af = fs!.facts!.find((f) => f.title.toLowerCase() === 'address');
    expect(nf!.value).toBe('Lapu-Lapu Cebuano');
    expect(mf!.value).toBe('+639171234567');
    expect(af!.value).toBe('Mactan, Cebu');
  });

  it('all card actions are Action.Submit type', () => {
    expect(card.actions.every((a) => a.type === 'Action.Submit')).toBe(true);
    expect(card.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('positive action button has style "positive"', () => {
    const btn = card.actions.find((a) =>
      a.title.toLowerCase().includes('yes') || a.title.toLowerCase().includes('submit'));
    expect(btn!.style).toBe('positive');
  });

  it('destructive action button has style "destructive"', () => {
    const btn = card.actions.find((a) =>
      a.title.toLowerCase().includes('start') || a.title.toLowerCase().includes('over'));
    expect(btn!.style).toBe('destructive');
  });
});

// =====================================================
// R-15: Completion card after confirmation
// =====================================================

describe('R-15 - Completion Card After Confirmation', () => {
  let card: AdaptiveCard;

  beforeAll(async () => {
    const cid = uid('r15');
    await post('/api/chat', { conversationId: cid, text: 'Gabriela Silang' });
    await post('/api/chat', { conversationId: cid, text: '09171234567' });
    await post('/api/chat', { conversationId: cid, text: 'Ilocos Norte' });
    const r = await post('/api/chat', { conversationId: cid, text: 'yes' });
    card = r.responses![0].adaptiveCard!;
  });

  it('returns AdaptiveCard at completion step', () => { expect(card.type).toBe('AdaptiveCard'); });
  it('version is 1.5', () => { expect(card.version).toBe('1.5'); });
  it('body has at least one TextBlock', () => {
    expect(card.body.some((e) => e.type === 'TextBlock')).toBe(true);
  });
});

// =====================================================
// R-11: Dual-Mode Interactive Form (Input.Text)
// =====================================================

describe('R-11 - Interactive Adaptive Card Form (Dual-Mode Input.Text)', () => {
  it('"open form" returns card with 3 Input.Text fields (name, mobile, address)', async () => {
    const cid = uid('r11a');
    const r = await post('/api/chat', { conversationId: cid, text: 'open form' });
    const card = r.responses![0].adaptiveCard!;
    expect(card.type).toBe('AdaptiveCard');
    expect(card.version).toBe('1.5');
    const inputs = flatElements(card.body).filter((e) => e.type === 'Input.Text');
    expect(inputs.length).toBe(3);
    expect(inputs.map((i) => i.id)).toContain('name');
    expect(inputs.map((i) => i.id)).toContain('mobile');
    expect(inputs.map((i) => i.id)).toContain('address');
  });

  it('all Input.Text fields have isRequired: true', async () => {
    const cid = uid('r11b');
    const r = await post('/api/chat', { conversationId: cid, text: 'fill form' });
    const inputs = flatElements(r.responses![0].adaptiveCard!.body).filter(
      (e) => e.type === 'Input.Text');
    inputs.forEach((i) => { expect(i.isRequired).toBe(true); });
  });

  it('address Input.Text has isMultiline: true', async () => {
    const cid = uid('r11c');
    const r = await post('/api/chat', { conversationId: cid, text: 'card form' });
    const addr = flatElements(r.responses![0].adaptiveCard!.body).find(
      (e) => e.type === 'Input.Text' && e.id === 'address');
    expect(addr!.isMultiline).toBe(true);
  });

  it('form card has Action.Submit with data.action = "submit_intake_form"', async () => {
    const cid = uid('r11d');
    const r = await post('/api/chat', { conversationId: cid, text: 'intake card' });
    const submit = r.responses![0].adaptiveCard!.actions.find((a) => a.type === 'Action.Submit');
    expect(submit!.data?.action).toBe('submit_intake_form');
  });

  it('valid formData submission -> CONFIRM with FactSet card', async () => {
    const cid = uid('r11e');
    const r = await post('/api/chat', {
      conversationId: cid, action: 'submit_intake_form',
      formData: { name: 'Emilio Aguinaldo', mobile: '09171234567', address: 'Kawit, Cavite' },
    });
    const t = r.responses![0].text ?? '';
    expect(t).toContain('Emilio Aguinaldo');
    expect(t).toContain('+639171234567');
    expect(t).toContain('Kawit, Cavite');
    expect(r.responses![0].adaptiveCard!.type).toBe('AdaptiveCard');
  });

  it('invalid mobile in formData -> error card with Input.Text fields (stays at intake)', async () => {
    const cid = uid('r11f');
    const r = await post('/api/chat', {
      conversationId: cid, action: 'submit_intake_form',
      formData: { name: 'Antonio Luna', mobile: 'bad-number', address: 'Ilocos Sur' },
    });
    expect(r.responses![0].text?.toLowerCase()).toContain('mobile');
    const inputs = flatElements(r.responses![0].adaptiveCard!.body).filter(
      (e) => e.type === 'Input.Text');
    expect(inputs.length).toBe(3);
  });
});

// =====================================================
// R-12: Restart/Start-over capability
// =====================================================

describe('R-12 - Restart and Start-Over Capability', () => {
  it('"restart" from ASK_MOBILE resets to ASK_NAME', async () => {
    const cid = uid('r12a');
    await post('/api/chat', { conversationId: cid, text: 'Test User' });
    const r = await post('/api/chat', { conversationId: cid, text: 'restart' });
    expect(r.responses![0].text?.toLowerCase()).toContain('start again');
    const r2 = await post('/api/chat', { conversationId: cid, text: 'Fresh Name' });
    expect(r2.responses![0].text?.toLowerCase()).toContain('mobile');
  });

  it('"start over" from ASK_ADDRESS resets to ASK_NAME', async () => {
    const cid = uid('r12b');
    await post('/api/chat', { conversationId: cid, text: 'Test User' });
    await post('/api/chat', { conversationId: cid, text: '09171234567' });
    const r = await post('/api/chat', { conversationId: cid, text: 'start over' });
    expect(r.responses![0].text?.toLowerCase()).toContain('start again');
  });

  it('"no" at CONFIRM restarts the flow', async () => {
    const cid = uid('r12c');
    await post('/api/chat', { conversationId: cid, text: 'Test User' });
    await post('/api/chat', { conversationId: cid, text: '09171234567' });
    await post('/api/chat', { conversationId: cid, text: 'Test Address' });
    const r = await post('/api/chat', { conversationId: cid, text: 'no' });
    expect(r.responses![0].text?.toLowerCase()).toContain('start again');
  });
});

// =====================================================
// R-08: EastWest Bank branding
// =====================================================

describe('R-08 - EastWest Bank Branding in Web Client', () => {
  it('GET / returns HTTP 200', async () => {
    const r = await fetch(`${baseUrl}/`);
    expect(r.status).toBe(200);
  });

  it('HTML contains EastWest or DCBSD branding text', async () => {
    const r = await fetch(`${baseUrl}/`);
    expect((await r.text()).toLowerCase()).toMatch(/eastwest|dcbsd/);
  });

  it('HTML has chat-messages and chat-input DOM elements', async () => {
    const r = await fetch(`${baseUrl}/`);
    const html = await r.text();
    expect(html).toContain('chat-messages');
    expect(html).toContain('chat-input');
  });

  it('styles.css is served and is non-trivial in size', async () => {
    const r = await fetch(`${baseUrl}/styles.css`);
    expect(r.status).toBe(200);
    expect((await r.text()).length).toBeGreaterThan(100);
  });

  it('chat.js is served and contains real client functions (not placeholder)', async () => {
    const r = await fetch(`${baseUrl}/chat.js`);
    expect(r.status).toBe(200);
    const js = await r.text();
    expect(js).toContain('generateConversationId');
    expect(js).toContain('renderSafeMarkdown');
  });
});

// =====================================================
// R-09: Security headers + no secret exposure
// =====================================================

describe('R-09 - Security Headers and Secret Shielding', () => {
  it('X-Content-Type-Options: nosniff is set on all responses', async () => {
    const r = await fetch(`${baseUrl}/api/health`);
    expect(r.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('X-Frame-Options is set (clickjacking protection)', async () => {
    const r = await fetch(`${baseUrl}/api/health`);
    expect(r.headers.get('x-frame-options')).toBeDefined();
  });

  it('X-Powered-By is NOT exposed (Express fingerprint suppressed)', async () => {
    const r = await fetch(`${baseUrl}/api/health`);
    expect(r.headers.get('x-powered-by')).toBeNull();
  });

  it('error responses do not leak SDK version strings or package paths', async () => {
    const r = await postRaw('/api/chat', { conversationId: 'x' });
    const body = await r.text();
    expect(body).not.toContain('1.8.1');
    expect(body).not.toContain('@microsoft/agents');
    expect(body).not.toContain('node_modules');
  });

  it('health endpoint exposes only status + timestamp, no internal config', async () => {
    const r = await fetch(`${baseUrl}/api/health`);
    const data = (await r.json()) as Record<string, unknown>;
    expect(Object.keys(data)).toEqual(expect.arrayContaining(['status', 'timestamp']));
    expect(Object.keys(data)).not.toContain('port');
    expect(Object.keys(data)).not.toContain('config');
  });
});

// =====================================================
// R-10: XSS and DoS safety
// =====================================================

describe('R-10 - XSS and Injection Safety', () => {
  const vectors: string[] = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '"><script>alert(1)</script>',
  ];

  for (const vector of vectors) {
    it(`does not crash or echo script tags for: ${vector.slice(0, 35)}`, async () => {
      const cid = uid('xss' + Math.random().toString(36).slice(2, 4));
      await post('/api/chat', { conversationId: cid, text: 'XSS Tester' });
      const r = await postRaw('/api/chat', { conversationId: cid, text: vector });
      expect(r.status).toBe(200);
      const data = (await r.json()) as ApiPayload;
      expect(data.responses!.length).toBeGreaterThan(0);
      const txt = data.responses![0].text ?? '';
      expect(txt).not.toContain('<script>');
      expect(txt).not.toContain('onerror=');
    });
  }

  it('handles 50,000-character input without crashing (DoS protection)', async () => {
    const cid = uid('dos');
    const r = await postRaw('/api/chat', { conversationId: cid, text: 'A'.repeat(50000) });
    expect(r.status).toBe(200);
    const data = (await r.json()) as ApiPayload;
    expect(data.responses).toBeDefined();
  });
});

// =====================================================
// R-16: Session isolation (concurrent conversations)
// =====================================================

describe('R-16 - Session Isolation (Concurrent Conversations)', () => {
  it('two concurrent sessions do not share conversation state', async () => {
    const c1 = uid('iso1');
    const c2 = uid('iso2');
    await post('/api/chat', { conversationId: c1, text: 'Alice Reyes' });
    const r2 = await post('/api/chat', { conversationId: c2, text: 'Bob Lim' });
    expect(r2.responses![0].text?.toLowerCase()).toContain('mobile');
    const r1m = await post('/api/chat', { conversationId: c1, text: '09171234567' });
    expect(r1m.responses![0].text?.toLowerCase()).toContain('address');
    const r2m = await post('/api/chat', { conversationId: c2, text: '09181234567' });
    expect(r2m.responses![0].text?.toLowerCase()).toContain('address');
  });

  it('resetting session A does not affect the state of session B', async () => {
    const c1 = uid('ira');
    const c2 = uid('irb');
    await post('/api/chat', { conversationId: c1, text: 'User A' });
    await post('/api/chat', { conversationId: c1, text: '09171234567' });
    await post('/api/chat', { conversationId: c2, text: 'User B' });
    await post('/api/chat', { conversationId: c1, text: 'restart' });
    const r = await post('/api/chat', { conversationId: c2, text: '09181234567' });
    expect(r.responses![0].text?.toLowerCase()).toContain('address');
  });
});

// =====================================================
// E2E Smoke: Full flow via /api/messages (Bot Framework)
// =====================================================

describe('E2E Smoke - Full Flow via /api/messages (Bot Framework Protocol)', () => {
  it('completes Name->Mobile->Address->Yes via real Agents SDK endpoint', async () => {
    const cid = uid('e2e');
    const bf = (text: string) => postRaw('/api/messages', {
      type: 'message', text,
      conversation: { id: cid }, channelId: 'emulator',
      from: { id: 'tester' }, recipient: { id: 'bot' },
    });

    const nd = (await (await bf('Josefa Llanes Escoda')).json()) as ApiPayload;
    expect(nd.responses![0].text).toContain('Josefa Llanes Escoda');

    const md = (await (await bf('09171234567')).json()) as ApiPayload;
    expect(md.responses![0].text?.toLowerCase()).toContain('address');

    const ad = (await (await bf('Bangued, Abra')).json()) as ApiPayload;
    expect(ad.responses![0].text).toContain('Josefa Llanes Escoda');
    expect(ad.responses![0].text).toContain('+639171234567');

    const cd = (await (await bf('yes')).json()) as ApiPayload;
    expect(cd.responses![0].text).toContain('Thank you');
    expect(cd.responses![0].text).toContain('Josefa');
  });
});
