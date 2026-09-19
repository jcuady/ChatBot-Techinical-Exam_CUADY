/**
 * DCBSD Chatbot Simulation — Automated End-to-End Test Suite
 * Author: Malcolm Joaquin L. Cuady
 *
 * Executes automated end-to-end regression and smoke testing across all
 * conversational states, validation rules, adaptive cards, and health endpoints.
 *
 * Usage:
 *   node scripts/test-e2e.js                    # Tests deployed production URL
 *   node scripts/test-e2e.js http://localhost:3978 # Tests local server
 */

const targetUrl = process.argv[2] || process.env.TARGET_URL || 'https://dcbsd-chatbot-simulation.vercel.app';

console.log('========================================================================');
console.log('       DCBSD CHATBOT SIMULATION — AUTOMATED E2E TEST RUNNER             ');
console.log('       Author: Malcolm Joaquin L. Cuady                                 ');
console.log('========================================================================');
console.log(`Target Host: ${targetUrl}`);
console.log(`Timestamp:   ${new Date().toISOString()}\n`);

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
    throw new Error(message);
  }
  console.log(`  ✅ PASS: ${message}`);
  passedCount++;
}

async function runSuite() {
  const startTime = Date.now();
  const convId = 'e2e-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  // Helper for sending user messages
  async function sendMessage(text) {
    const res = await fetch(`${targetUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, text })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  }

  // 1. Health Check
  console.log('1. Verifying System Health Endpoint (GET /api/health)...');
  const healthRes = await fetch(`${targetUrl}/api/health`);
  assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200 OK');
  const healthData = await healthRes.json();
  assert(healthData.status === 'healthy', 'Health payload status equals "healthy"');
  assert(typeof healthData.timestamp === 'string', 'Health payload includes valid ISO timestamp');
  console.log('');

  // 2. Session Initialization
  console.log('2. Verifying Conversation Initialization (POST /api/chat/start)...');
  const startRes = await fetch(`${targetUrl}/api/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: convId })
  });
  assert(startRes.status === 200, 'Session initialization returns HTTP 200 OK');
  const startData = await startRes.json();
  assert(Array.isArray(startData.responses) && startData.responses.length >= 3, 'Returns 3-part structured welcome sequence');
  assert(startData.responses[2].text.toLowerCase().includes('name'), 'Final welcome prompt asks for user name');
  console.log('');

  // 3. Name Collection
  console.log('3. Verifying Name Input & Personalized Greeting (Step 1)...');
  const testName = 'Juan Dela Cruz';
  const nameRes = await sendMessage(testName);
  assert(Array.isArray(nameRes.responses) && nameRes.responses.length > 0, 'Bot returns response to name input');
  const nameGreeting = nameRes.responses[0].text || '';
  assert(nameGreeting.includes(testName), `Response includes personalized greeting with "${testName}"`);
  assert(nameGreeting.toLowerCase().includes('mobile'), 'Bot prompts for mobile number next');
  console.log('');

  // 4. Invalid Mobile Handling
  console.log('4. Verifying Invalid Mobile Validation & Guidance (Step 2a)...');
  const badMobileRes = await sendMessage('0912345'); // Invalid length
  const badMobileText = badMobileRes.responses[0].text || '';
  assert(badMobileText.toLowerCase().includes('valid philippine mobile number'), 'Bot rejects invalid mobile number');
  assert(badMobileText.includes('09171234567'), 'Bot provides format example (09171234567)');
  console.log('');

  // 5. Valid Philippine Mobile Acceptance
  console.log('5. Verifying Valid Philippine Mobile Acceptance (Step 2b)...');
  const goodMobileRes = await sendMessage('+63 917 123 4567');
  const addressPrompt = goodMobileRes.responses[0].text || '';
  assert(addressPrompt.toLowerCase().includes('address'), 'Bot accepts valid PH mobile and prompts for address');
  console.log('');

  // 6. Address Collection & Adaptive Card Summary
  console.log('6. Verifying Address Collection & Adaptive Card Summary (Step 3)...');
  const testAddress = 'Unit 502, BGC Corporate Center, Taguig City';
  const addrRes = await sendMessage(testAddress);
  const addrResponse = addrRes.responses[0];
  assert(Boolean(addrResponse.adaptiveCard), 'Response includes Microsoft Adaptive Card JSON payload');
  assert(addrResponse.adaptiveCard.type === 'AdaptiveCard', 'Card type is "AdaptiveCard"');
  assert(addrResponse.adaptiveCard.version === '1.5', 'Card version is 1.5');
  
  // Verify FactSet data in card
  const cardBody = addrResponse.adaptiveCard.body || [];
  const container = cardBody.find(b => b.type === 'Container');
  const factSet = container && container.items ? container.items.find(i => i.type === 'FactSet') : null;
  assert(Boolean(factSet), 'Adaptive Card contains FactSet container');
  
  const facts = factSet ? factSet.facts : [];
  const nameFact = facts.find(f => f.title === 'Name');
  const mobileFact = facts.find(f => f.title === 'Mobile');
  const addrFact = facts.find(f => f.title === 'Address');
  assert(nameFact && nameFact.value === testName, `Card correctly reflects Name: "${testName}"`);
  assert(mobileFact && mobileFact.value === '+639171234567', 'Card correctly reflects normalized Mobile: "+639171234567"');
  assert(addrFact && addrFact.value === testAddress, `Card correctly reflects Address: "${testAddress}"`);
  console.log('');

  // 7. Confirmation Submission & Completion Card
  console.log('7. Verifying Confirmation & Completion Card Display (Step 4)...');
  const confirmRes = await sendMessage('Yes, submit');
  const confirmResponse = confirmRes.responses[0];
  assert(Boolean(confirmResponse.adaptiveCard), 'Completion response contains completion Adaptive Card');
  assert(confirmResponse.text.toLowerCase().includes('thank you'), 'Bot issues thank you completion confirmation');
  console.log('');

  // 8. Restart Flow
  console.log('8. Verifying Session Restart & State Reset (Step 5)...');
  const restartRes = await sendMessage('restart');
  const restartText = restartRes.responses[0].text || '';
  assert(restartText.toLowerCase().includes('start again') || restartText.toLowerCase().includes('name'), 'Bot acknowledges restart and reprompts for name');
  console.log('');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('========================================================================');
  console.log(`E2E SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (${duration}s)`);
  console.log('STATUS: 100% REGRESSION & SMOKE TESTS PASSED');
  console.log('========================================================================\n');
}

runSuite().catch(err => {
  console.error('\n❌ E2E SUITE EXECUTION FAILED:', err.message);
  process.exit(1);
});
