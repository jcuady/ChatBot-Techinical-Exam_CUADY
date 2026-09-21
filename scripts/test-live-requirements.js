#!/usr/bin/env node
/**
 * DCBSD Chatbot Simulation — Live Requirements Verification Script
 * ================================================================
 * Author:  Malcolm Joaquin L. Cuady
 * Role:    Principal QA Engineer
 * Version: 1.0.0
 *
 * PURPOSE
 * -------
 * Hits the LIVE production deployment (or a local server) and proves
 * every DCBSD exam requirement is working end-to-end with real HTTP.
 * No mocks. No Vitest. Pure fetch() against a running server.
 *
 * USAGE
 * -----
 *   node scripts/test-live-requirements.js
 *     -> Tests the production URL (https://dcbsd-chatbot-simulation.vercel.app)
 *
 *   node scripts/test-live-requirements.js http://localhost:3978
 *     -> Tests your locally-running dev server
 *
 *   TARGET_URL=http://localhost:3978 node scripts/test-live-requirements.js
 *     -> Via environment variable
 */

const TARGET = process.argv[2] || process.env.TARGET_URL || 'https://dcbsd-chatbot-simulation.vercel.app';
const TIMEOUT_MS = 15000;

let passed = 0, failed = 0, skipped = 0;
const results = [];

console.log('');
console.log('='.repeat(72));
console.log('  DCBSD CHATBOT — LIVE REQUIREMENTS VERIFICATION');
console.log('  Author: Malcolm Joaquin L. Cuady');
console.log('='.repeat(72));
console.log(`  Target: ${TARGET}`);
console.log(`  Time:   ${new Date().toISOString()}`);
console.log('='.repeat(72));
console.log('');

async function check(label, fn) {
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    console.log(`  \u2705  PASS  [${ms}ms]  ${label}`);
    results.push({ label, pass: true, ms });
    passed++;
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`  \u274C  FAIL  [${ms}ms]  ${label}`);
    console.log(`         \u2514 ${err.message}`);
    results.push({ label, pass: false, ms, error: err.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchJSON(path, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${TARGET}${path}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    const data = await r.json();
    return { status: r.status, headers: r.headers, data };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${TARGET}${path}`, { signal: controller.signal });
    const text = await r.text();
    return { status: r.status, headers: r.headers, text };
  } finally {
    clearTimeout(timer);
  }
}

async function chat(convId, text) {
  return fetchJSON('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ conversationId: convId, text }),
  });
}

async function chatForm(convId, formData) {
  return fetchJSON('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ conversationId: convId, action: 'submit_intake_form', formData }),
  });
}

async function messages(convId, text, value) {
  const payload = {
    type: 'message',
    conversation: { id: convId },
    channelId: 'emulator',
    from: { id: 'qa-tester', name: 'QA Tester' },
    recipient: { id: 'bot-dcbsd', name: 'DCBSD Bot' },
  };
  if (text !== undefined) payload.text = text;
  if (value !== undefined) payload.value = value;
  return fetchJSON('/api/messages', { method: 'POST', body: JSON.stringify(payload) });
}

function uid(label) {
  return `live-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

function flatElements(body) {
  return body.flatMap((e) => [e, ...(e.items ?? [])]);
}

// ============================================================
async function runAll() {
  const startTime = Date.now();

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-01 ] Bot Framework Messaging Endpoint (/api/messages)\n');
  // ──────────────────────────────────────────────────────────

  await check('R-01a: Health endpoint returns HTTP 200 with "healthy" status', async () => {
    const { status, data } = await fetchJSON('/api/health');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.status === 'healthy', `Expected healthy, got ${data.status}`);
    assert(typeof data.timestamp === 'string', 'Missing timestamp field');
  });

  await check('R-01b: /api/messages accepts Bot Framework message Activity', async () => {
    const cid = uid('bf');
    const { status, data } = await messages(cid, 'Maria Clara Santos');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(data.responses), 'responses must be an array');
    assert(data.responses.length > 0, 'Must return at least one response');
    assert(data.responses[0].type === 'message', `Expected type "message", got "${data.responses[0].type}"`);
  });

  await check('R-01c: /api/messages processes conversationUpdate + membersAdded (welcome)', async () => {
    const { status, data } = await fetchJSON('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        type: 'conversationUpdate',
        conversation: { id: uid('cu') },
        channelId: 'emulator',
        recipient: { id: 'bot-dcbsd' },
        membersAdded: [{ id: 'new-user', name: 'Guest' }],
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.responses.length >= 3, `Expected 3+ welcome messages, got ${data.responses.length}`);
    const allText = data.responses.map((r) => r.text ?? '').join(' ');
    assert(allText.includes('DCBSD'), 'Welcome must mention DCBSD');
  });

  await check('R-01d: /api/messages rejects empty body with HTTP 400', async () => {
    const { status, data } = await fetchJSON('/api/messages', {
      method: 'POST', body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
    assert(data.error, 'Must return error field');
  });

  await check('R-01e: Error response does not expose SDK internals', async () => {
    const { data } = await fetchJSON('/api/messages', {
      method: 'POST', body: JSON.stringify({}),
    });
    const body = JSON.stringify(data);
    assert(!body.includes('@microsoft/agents'), 'Must not expose @microsoft/agents');
    assert(!body.includes('node_modules'), 'Must not expose node_modules path');
    assert(!body.includes('at Object'), 'Must not expose stack trace');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-03 ] Three-Field Intake Conversation Flow\n');
  // ──────────────────────────────────────────────────────────

  let fullFlowConvId = uid('fullflow');

  await check('R-03a: Step 1 — Name accepted, prompts for mobile', async () => {
    const { data } = await chat(fullFlowConvId, 'Jose Rizal');
    assert(data.responses[0].text.includes('Jose Rizal'), 'Response must echo the name');
    assert(data.responses[0].text.toLowerCase().includes('mobile'), 'Must ask for mobile after name');
  });

  await check('R-03b: Step 2 — Valid mobile accepted, prompts for address', async () => {
    const { data } = await chat(fullFlowConvId, '09171234567');
    assert(data.responses[0].text.toLowerCase().includes('address'), 'Must ask for address after mobile');
  });

  await check('R-03c: Step 3 — Address accepted, summary shows all 3 fields', async () => {
    const { data } = await chat(fullFlowConvId, 'Calamba, Laguna');
    const t = data.responses[0].text;
    assert(t.includes('Jose Rizal'), 'Summary must include name');
    assert(t.includes('+639171234567'), 'Summary must include E.164 mobile');
    assert(t.includes('Calamba, Laguna'), 'Summary must include address');
    assert(/correct|review|submit/i.test(t), 'Summary must ask for confirmation');
  });

  await check('R-03d: Step 4 — "yes" confirmation triggers completion', async () => {
    const { data } = await chat(fullFlowConvId, 'yes');
    assert(data.responses[0].text.includes('Thank you'), 'Must say Thank you');
    assert(data.responses[0].text.includes('Jose'), 'Must include user name in completion');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-04 ] Philippine Mobile Number Validation\n');
  // ──────────────────────────────────────────────────────────

  const validMobiles = ['09171234567', '+639171234567', '639171234567', '0917 123 4567', '09051234567'];
  for (const mobile of validMobiles) {
    await check(`R-04a: Accepts valid mobile format: "${mobile}"`, async () => {
      const cid = uid('vm' + Math.random().toString(36).slice(2, 4));
      await chat(cid, 'Test User');
      const { data } = await chat(cid, mobile);
      assert(data.responses[0].text.toLowerCase().includes('address'),
        `Expected address prompt, got: ${data.responses[0].text.slice(0, 80)}`);
    });
  }

  const invalidMobiles = ['12345', 'ABC123', '091712345', '08171234567'];
  for (const mobile of invalidMobiles) {
    await check(`R-04b: Rejects invalid mobile: "${mobile}"`, async () => {
      const cid = uid('im' + Math.random().toString(36).slice(2, 4));
      await chat(cid, 'Test User');
      const { data } = await chat(cid, mobile);
      const t = data.responses[0].text ?? '';
      assert(t.toLowerCase().includes('mobile'), `Must re-prompt for mobile, got: ${t.slice(0, 80)}`);
      assert(!t.toLowerCase().includes('address'), 'Must NOT advance to address step');
    });
  }

  await check('R-04c: Mobile stored as E.164 (+63...) format in summary', async () => {
    const cid = uid('e164');
    await chat(cid, 'Enrique Santos');
    await chat(cid, '09201234567');
    const { data } = await chat(cid, 'Test City');
    assert(data.responses[0].text.includes('+639201234567'),
      'Summary must contain E.164 format, not raw 092...');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-06/R-13/R-14 ] Adaptive Cards v1.5 Schema\n');
  // ──────────────────────────────────────────────────────────

  let confirmCard;
  const cardConvId = uid('cardtest');

  await check('R-06a: Confirmation step returns an AdaptiveCard', async () => {
    await chat(cardConvId, 'Lapu-Lapu Hero');
    await chat(cardConvId, '09171234567');
    const { data } = await chat(cardConvId, 'Mactan, Cebu');
    confirmCard = data.responses[0].adaptiveCard;
    assert(confirmCard, 'adaptiveCard must be present in response');
    assert(confirmCard.type === 'AdaptiveCard', `Expected AdaptiveCard, got ${confirmCard.type}`);
  });

  await check('R-06b: Card version is "1.5"', async () => {
    assert(confirmCard.version === '1.5', `Expected 1.5, got ${confirmCard.version}`);
  });

  await check('R-06c: Card $schema references adaptivecards.io', async () => {
    assert(confirmCard.$schema?.includes('adaptivecards.io'),
      `Invalid schema: ${confirmCard.$schema}`);
  });

  await check('R-14a: FactSet element exists in card body', async () => {
    const factSet = flatElements(confirmCard.body).find((e) => e.type === 'FactSet');
    assert(factSet, 'No FactSet found in card body');
  });

  await check('R-14b: FactSet has Name, Mobile, Address fact titles', async () => {
    const factSet = flatElements(confirmCard.body).find((e) => e.type === 'FactSet');
    const titles = factSet.facts.map((f) => f.title.toLowerCase());
    assert(titles.includes('name'), `Missing "name" fact. Got: ${titles.join(', ')}`);
    assert(titles.includes('mobile'), `Missing "mobile" fact. Got: ${titles.join(', ')}`);
    assert(titles.includes('address'), `Missing "address" fact. Got: ${titles.join(', ')}`);
  });

  await check('R-14c: FactSet fact values match exactly what user entered', async () => {
    const factSet = flatElements(confirmCard.body).find((e) => e.type === 'FactSet');
    const nf = factSet.facts.find((f) => f.title.toLowerCase() === 'name');
    const mf = factSet.facts.find((f) => f.title.toLowerCase() === 'mobile');
    const af = factSet.facts.find((f) => f.title.toLowerCase() === 'address');
    assert(nf.value === 'Lapu-Lapu Hero', `Name mismatch: ${nf.value}`);
    assert(mf.value === '+639171234567', `Mobile mismatch: ${mf.value}`);
    assert(af.value === 'Mactan, Cebu', `Address mismatch: ${af.value}`);
  });

  await check('R-06d: All card actions are Action.Submit (not Action.OpenUrl)', async () => {
    assert(confirmCard.actions.every((a) => a.type === 'Action.Submit'),
      'All actions must be Action.Submit');
    assert(confirmCard.actions.length >= 2, `Expected at least 2 buttons, got ${confirmCard.actions.length}`);
  });

  await check('R-06e: Positive action has style "positive"', async () => {
    const yes = confirmCard.actions.find((a) =>
      a.title.toLowerCase().includes('yes') || a.title.toLowerCase().includes('submit'));
    assert(yes, 'No yes/submit button found');
    assert(yes.style === 'positive', `Expected positive style, got ${yes.style}`);
  });

  await check('R-06f: Destructive action has style "destructive"', async () => {
    const no = confirmCard.actions.find((a) =>
      a.title.toLowerCase().includes('start') || a.title.toLowerCase().includes('over'));
    assert(no, 'No start-over button found');
    assert(no.style === 'destructive', `Expected destructive style, got ${no.style}`);
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-15 ] Completion Card\n');
  // ──────────────────────────────────────────────────────────

  await check('R-15: Completion card returned after "yes" confirmation', async () => {
    const { data } = await chat(cardConvId, 'yes');
    const card = data.responses[0].adaptiveCard;
    assert(card, 'adaptiveCard must be present in completion response');
    assert(card.type === 'AdaptiveCard', `Expected AdaptiveCard, got ${card.type}`);
    assert(card.version === '1.5', `Expected version 1.5, got ${card.version}`);
    assert(card.body.some((e) => e.type === 'TextBlock'), 'Completion card must have TextBlock');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-11 ] Dual-Mode Interactive Form (Input.Text)\n');
  // ──────────────────────────────────────────────────────────

  await check('R-11a: "open form" command returns card with 3 Input.Text fields', async () => {
    const cid = uid('form');
    const { data } = await chat(cid, 'open form');
    const card = data.responses[0].adaptiveCard;
    assert(card, 'adaptiveCard must be present');
    assert(card.type === 'AdaptiveCard', `Expected AdaptiveCard, got ${card.type}`);
    assert(card.version === '1.5', `Expected v1.5, got ${card.version}`);
    const inputs = flatElements(card.body).filter((e) => e.type === 'Input.Text');
    assert(inputs.length === 3, `Expected 3 Input.Text, got ${inputs.length}`);
    const ids = inputs.map((i) => i.id);
    assert(ids.includes('name'), `Missing "name" input. Got: ${ids.join(', ')}`);
    assert(ids.includes('mobile'), `Missing "mobile" input. Got: ${ids.join(', ')}`);
    assert(ids.includes('address'), `Missing "address" input. Got: ${ids.join(', ')}`);
  });

  await check('R-11b: All Input.Text fields are isRequired: true', async () => {
    const cid = uid('formr');
    const { data } = await chat(cid, 'fill form');
    const inputs = flatElements(data.responses[0].adaptiveCard.body).filter(
      (e) => e.type === 'Input.Text');
    inputs.forEach((i) => {
      assert(i.isRequired === true, `Input "${i.id}" must be isRequired: true`);
    });
  });

  await check('R-11c: Address Input.Text has isMultiline: true', async () => {
    const cid = uid('formml');
    const { data } = await chat(cid, 'card form');
    const addr = flatElements(data.responses[0].adaptiveCard.body).find(
      (e) => e.type === 'Input.Text' && e.id === 'address');
    assert(addr, 'No address Input.Text found');
    assert(addr.isMultiline === true, 'Address input must be isMultiline: true');
  });

  await check('R-11d: Form Action.Submit has data.action = "submit_intake_form"', async () => {
    const cid = uid('formsub');
    const { data } = await chat(cid, 'intake card');
    const submit = data.responses[0].adaptiveCard.actions.find(
      (a) => a.type === 'Action.Submit');
    assert(submit, 'No Action.Submit found');
    assert(submit.data?.action === 'submit_intake_form',
      `Expected submit_intake_form, got ${submit.data?.action}`);
  });

  await check('R-11e: Valid formData submission -> CONFIRM with FactSet card', async () => {
    const cid = uid('formvalid');
    const { data } = await chatForm(cid, {
      name: 'Emilio Aguinaldo', mobile: '09171234567', address: 'Kawit, Cavite',
    });
    const t = data.responses[0].text ?? '';
    assert(t.includes('Emilio Aguinaldo'), 'Summary must include name');
    assert(t.includes('+639171234567'), 'Summary must include E.164 mobile');
    assert(t.includes('Kawit, Cavite'), 'Summary must include address');
    assert(data.responses[0].adaptiveCard?.type === 'AdaptiveCard', 'Must return confirmation card');
  });

  await check('R-11f: Invalid mobile in formData -> error card with Input.Text (not CONFIRM)', async () => {
    const cid = uid('forminv');
    const { data } = await chatForm(cid, {
      name: 'Antonio Luna', mobile: 'bad-number', address: 'Ilocos Sur',
    });
    assert(data.responses[0].text?.toLowerCase().includes('mobile'),
      'Error message must mention mobile');
    const inputs = flatElements(data.responses[0].adaptiveCard.body).filter(
      (e) => e.type === 'Input.Text');
    assert(inputs.length === 3, `Must re-show form card with 3 inputs, got ${inputs.length}`);
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-12 ] Restart / Start-Over Capability\n');
  // ──────────────────────────────────────────────────────────

  await check('R-12a: "restart" from ASK_MOBILE resets to ASK_NAME', async () => {
    const cid = uid('restart');
    await chat(cid, 'Test User');
    const { data } = await chat(cid, 'restart');
    assert(data.responses[0].text.toLowerCase().includes('start again'),
      `Expected "start again", got: ${data.responses[0].text}`);
    const r2 = await chat(cid, 'Fresh Name');
    assert(r2.data.responses[0].text.toLowerCase().includes('mobile'),
      'After restart, should ask for name then mobile');
  });

  await check('R-12b: "no" at CONFIRM step restarts the flow', async () => {
    const cid = uid('no');
    await chat(cid, 'Test User');
    await chat(cid, '09171234567');
    await chat(cid, 'Test Address');
    const { data } = await chat(cid, 'no');
    assert(data.responses[0].text.toLowerCase().includes('start again'),
      `Expected "start again", got: ${data.responses[0].text}`);
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-08 ] EastWest Bank Branding\n');
  // ──────────────────────────────────────────────────────────

  await check('R-08a: GET / returns HTTP 200', async () => {
    const { status } = await fetchText('/');
    assert(status === 200, `Expected 200, got ${status}`);
  });

  await check('R-08b: HTML contains EastWest or DCBSD branding', async () => {
    const { text } = await fetchText('/');
    assert(/eastwest|dcbsd/i.test(text), 'HTML must contain EastWest or DCBSD brand text');
  });

  await check('R-08c: HTML has chat-messages and chat-input elements', async () => {
    const { text } = await fetchText('/');
    assert(text.includes('chat-messages'), 'HTML must contain chat-messages element');
    assert(text.includes('chat-input'), 'HTML must contain chat-input element');
  });

  await check('R-08d: styles.css is served and non-empty', async () => {
    const { status, text } = await fetchText('/styles.css');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(text.length > 100, `CSS too small: ${text.length} bytes`);
  });

  await check('R-08e: chat.js contains renderSafeMarkdown (real client, not placeholder)', async () => {
    const { status, text } = await fetchText('/chat.js');
    assert(status === 200, `Expected 200, got ${status}`);
    assert(text.includes('renderSafeMarkdown'), 'Must contain renderSafeMarkdown');
    assert(text.includes('generateConversationId'), 'Must contain generateConversationId');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-09 ] Security Headers + Secret Shielding\n');
  // ──────────────────────────────────────────────────────────

  await check('R-09a: X-Content-Type-Options: nosniff is set', async () => {
    const { headers } = await fetchJSON('/api/health');
    assert(headers.get('x-content-type-options') === 'nosniff',
      `Expected nosniff, got ${headers.get('x-content-type-options')}`);
  });

  await check('R-09b: X-Frame-Options is present (clickjacking protection)', async () => {
    const { headers } = await fetchJSON('/api/health');
    assert(headers.get('x-frame-options') !== null, 'X-Frame-Options header missing');
  });

  await check('R-09c: X-Powered-By is NOT exposed (Express fingerprint removed)', async () => {
    const { headers } = await fetchJSON('/api/health');
    assert(headers.get('x-powered-by') === null,
      `X-Powered-By should not be present, got: ${headers.get('x-powered-by')}`);
  });

  await check('R-09d: Error response does not leak SDK version or package paths', async () => {
    const { data } = await fetchJSON('/api/chat', {
      method: 'POST', body: JSON.stringify({ conversationId: 'x' }),
    });
    const body = JSON.stringify(data);
    assert(!body.includes('1.8.1'), 'Must not expose SDK version 1.8.1');
    assert(!body.includes('@microsoft/agents'), 'Must not expose @microsoft/agents');
    assert(!body.includes('node_modules'), 'Must not expose node_modules path');
  });

  await check('R-09e: Health endpoint exposes only status + timestamp (no port/config)', async () => {
    const { data } = await fetchJSON('/api/health');
    assert(data.status === 'healthy', 'Must have status=healthy');
    assert(typeof data.timestamp === 'string', 'Must have timestamp');
    assert(!('port' in data), 'Must NOT expose port');
    assert(!('config' in data), 'Must NOT expose config');
    assert(!('env' in data), 'Must NOT expose env');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-10 ] XSS / Injection Safety\n');
  // ──────────────────────────────────────────────────────────

  const xssVectors = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
  ];

  for (const vector of xssVectors) {
    await check(`R-10a: Handles XSS vector without crash: ${vector.slice(0, 35)}`, async () => {
      const cid = uid('xss' + Math.random().toString(36).slice(2, 4));
      await chat(cid, 'XSS Tester');
      const { status, data } = await fetchJSON('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ conversationId: cid, text: vector }),
      });
      assert(status === 200, `Expected 200, got ${status}`);
      assert(Array.isArray(data.responses) && data.responses.length > 0, 'Must have responses');
      const txt = data.responses[0].text ?? '';
      assert(!txt.includes('<script>'), 'Must not echo raw <script> tags');
      assert(!txt.includes('onerror='), 'Must not echo raw onerror= payloads');
    });
  }

  await check('R-10b: Handles 50,000-char DoS input without crashing (HTTP 200)', async () => {
    const cid = uid('dos');
    const { status, data } = await fetchJSON('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ conversationId: cid, text: 'A'.repeat(50000) }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(data.responses, 'Must return responses');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ R-16 ] Session Isolation\n');
  // ──────────────────────────────────────────────────────────

  await check('R-16a: Two concurrent sessions do not share conversation state', async () => {
    const c1 = uid('iso1');
    const c2 = uid('iso2');
    await chat(c1, 'Alice Reyes');
    const r2 = await chat(c2, 'Bob Lim');
    assert(r2.data.responses[0].text.toLowerCase().includes('mobile'),
      'Session 2 must be at ASK_NAME -> ASK_MOBILE');
    const r1m = await chat(c1, '09171234567');
    assert(r1m.data.responses[0].text.toLowerCase().includes('address'),
      'Session 1 must advance to ASK_ADDRESS');
    const r2m = await chat(c2, '09181234567');
    assert(r2m.data.responses[0].text.toLowerCase().includes('address'),
      'Session 2 must also advance to ASK_ADDRESS independently');
  });

  await check('R-16b: Resetting session A does not affect session B', async () => {
    const c1 = uid('ira');
    const c2 = uid('irb');
    await chat(c1, 'User A');
    await chat(c1, '09171234567');
    await chat(c2, 'User B');
    await chat(c1, 'restart');
    const r = await chat(c2, '09181234567');
    assert(r.data.responses[0].text.toLowerCase().includes('address'),
      'Session B must be unaffected by session A reset');
  });

  // ──────────────────────────────────────────────────────────
  console.log('\n[ E2E Smoke ] Full Flow via /api/messages\n');
  // ──────────────────────────────────────────────────────────

  await check('E2E: Full Name->Mobile->Address->Yes flow via Bot Framework endpoint', async () => {
    const cid = uid('e2e');
    const n = await messages(cid, 'Josefa Llanes Escoda');
    assert(n.data.responses[0].text.includes('Josefa Llanes Escoda'),
      'Must echo name');
    const m = await messages(cid, '09171234567');
    assert(m.data.responses[0].text.toLowerCase().includes('address'),
      'Must ask for address after mobile');
    const a = await messages(cid, 'Bangued, Abra');
    assert(a.data.responses[0].text.includes('Josefa Llanes Escoda'), 'Summary must show name');
    assert(a.data.responses[0].text.includes('+639171234567'), 'Summary must show E.164 mobile');
    const c = await messages(cid, 'yes');
    assert(c.data.responses[0].text.includes('Thank you'), 'Must confirm completion');
    assert(c.data.responses[0].text.includes('Josefa'), 'Must address user by name');
  });

  // ──────────────────────────────────────────────────────────
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const total = passed + failed + skipped;

  console.log('');
  console.log('='.repeat(72));
  console.log('  RESULTS SUMMARY');
  console.log('='.repeat(72));
  console.log(`  Total Checks : ${total}`);
  console.log(`  Passed       : ${passed} \u2705`);
  console.log(`  Failed       : ${failed} ${failed > 0 ? '\u274C' : ''}`);
  console.log(`  Duration     : ${duration}s`);
  console.log('='.repeat(72));

  if (failed === 0) {
    console.log('');
    console.log('  \u2713 ALL REQUIREMENTS VERIFIED \u2014 READY FOR SUBMISSION');
    console.log('');
  } else {
    console.log('');
    console.log('  \u2717 SOME REQUIREMENTS FAILED \u2014 Review logs above');
    console.log('');
    process.exitCode = 1;
  }

  // Save JSON report
  const report = {
    target: TARGET,
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    summary: { total, passed, failed },
    results,
  };
  const reportPath = `live-requirements-report-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  Report saved: ${reportPath}`);
}

runAll().catch((err) => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(2);
});
