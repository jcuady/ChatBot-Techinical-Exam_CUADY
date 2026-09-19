/**
 * DCBSD Chatbot Simulation — Automated End-to-End Enterprise Test Suite
 * Author: Malcolm Joaquin L. Cuady
 * Role: Principal QA Engineer
 *
 * Executes comprehensive end-to-end regression, protocol, and smoke testing across:
 *   1. System Health Monitoring (GET /api/health)
 *   2. Session Initialization & Multi-Part Welcome (POST /api/chat/start)
 *   3. REST Intake State Machine: Name -> Invalid Phone -> Valid Phone -> Address (POST /api/chat)
 *   4. Adaptive Card FactSet & Payload Integrity (Step 3 Confirmation Card)
 *   5. Submission & Completion Flow (Step 4 Completion Card)
 *   6. Session Reset & State Machine Re-initialization
 *   7. Microsoft Agents SDK Bot Framework Messaging Protocol (POST /api/messages)
 *   8. Bot Framework Activity Card Action Submission (activity.value.action)
 *   9. Bot Framework Member Joining Event (conversationUpdate + membersAdded)
 *  10. Security & Input Sanitization (XSS and boundary test vectors)
 *
 * Usage:
 *   node scripts/test-e2e.js                         # Tests deployed production URL
 *   node scripts/test-e2e.js http://localhost:3978    # Tests local server
 */

const targetUrl = process.argv[2] || process.env.TARGET_URL || 'https://dcbsd-chatbot-simulation.vercel.app';

console.log('========================================================================');
console.log('       DCBSD CHATBOT SIMULATION — PRINCIPAL QA E2E TEST RUNNER          ');
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

  // Helper for sending user messages via REST API
  async function sendMessage(text) {
    const res = await fetch(`${targetUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, text }),
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
    body: JSON.stringify({ conversationId: convId }),
  });
  assert(startRes.status === 200, 'Session initialization returns HTTP 200 OK');
  const startData = await startRes.json();
  assert(Array.isArray(startData.responses) && startData.responses.length >= 3, 'Returns 3-part structured welcome sequence');
  assert(startData.responses[0].text.includes('DCBSD Chatbot Assistant'), 'First welcome prompt introduces DCBSD Chatbot Assistant');
  assert(startData.responses[startData.responses.length - 1].text.toLowerCase().includes('name'), 'Final welcome prompt asks for user name');
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
  const container = cardBody.find((b) => b.type === 'Container');
  const factSet = container && container.items ? container.items.find((i) => i.type === 'FactSet') : null;
  assert(Boolean(factSet), 'Adaptive Card contains FactSet container');

  const facts = factSet ? factSet.facts : [];
  const nameFact = facts.find((f) => f.title === 'Name');
  const mobileFact = facts.find((f) => f.title === 'Mobile');
  const addrFact = facts.find((f) => f.title === 'Address');
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

  // 9. Bot Framework / Microsoft Agents SDK Protocol Messaging (POST /api/messages)
  console.log('9. Verifying Microsoft Agents SDK Protocol Messaging (POST /api/messages)...');
  const bfConvId = 'bf-e2e-' + Date.now();
  const bfMessageRes = await fetch(`${targetUrl}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'message',
      text: 'Dr. Jose Rizal',
      conversation: { id: bfConvId },
      channelId: 'emulator',
      from: { id: 'e2e-user', name: 'User' },
      recipient: { id: 'bot-dcbsd', name: 'DCBSD Bot' },
    }),
  });
  assert(bfMessageRes.status === 200, 'POST /api/messages returns HTTP 200 OK');
  const bfMessageData = await bfMessageRes.json();
  assert(Array.isArray(bfMessageData.responses), 'Response contains responses array');
  assert(bfMessageData.responses.length > 0, 'Agent returns at least one response Activity');
  assert(bfMessageData.responses[0].type === 'message', 'Returned activity is type "message"');
  assert(bfMessageData.responses[0].text.includes('Dr. Jose Rizal'), 'Activity text contains personalized greeting');
  console.log('');

  // 10. Adaptive Card Action.Submit via Bot Framework Protocol
  console.log('10. Verifying Adaptive Card Action Submit via Protocol (POST /api/messages)...');
  // Complete flow up to CONFIRM step
  await fetch(`${targetUrl}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'message',
      text: '09181234567',
      conversation: { id: bfConvId },
    }),
  });
  await fetch(`${targetUrl}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'message',
      text: 'Calamba, Laguna',
      conversation: { id: bfConvId },
    }),
  });
  // Submit via Adaptive Card button payload (activity.value.action)
  const submitRes = await fetch(`${targetUrl}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'message',
      conversation: { id: bfConvId },
      value: { action: 'submit' },
    }),
  });
  assert(submitRes.status === 200, 'Card submit activity returns HTTP 200 OK');
  const submitData = await submitRes.json();
  assert(submitData.responses.length > 0, 'Card submit returns response activity');
  const cardSubmitText = submitData.responses[0].text || '';
  assert(cardSubmitText.includes('Thank you'), 'Card submit triggers completion message with "Thank you"');
  assert(cardSubmitText.includes('Jose'), 'Card submit completion greets client by name');
  console.log('');

  // 11. Conversation Update / Member Added Event Handling
  console.log('11. Verifying ConversationUpdate / Member Join Event (POST /api/messages)...');
  const joinConvId = 'join-e2e-' + Date.now();
  const joinRes = await fetch(`${targetUrl}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'conversationUpdate',
      conversation: { id: joinConvId },
      channelId: 'emulator',
      recipient: { id: 'bot-dcbsd' },
      membersAdded: [
        { id: 'client-vip', name: 'VIP Guest' },
      ],
    }),
  });
  assert(joinRes.status === 200, 'Member join activity returns HTTP 200 OK');
  const joinData = await joinRes.json();
  assert(Array.isArray(joinData.responses) && joinData.responses.length >= 3, 'Dispatches welcome sequence upon member join');
  console.log('');

  // 12. Security & Input Sanitization
  console.log('12. Verifying Security & Sanitization Immunity...');
  const xssConvId = 'sec-e2e-' + Date.now();
  const xssRes = await fetch(`${targetUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: xssConvId,
      text: '<script>alert("XSS")</script> Maria Clara',
    }),
  });
  assert(xssRes.status === 200, 'Accepts text with HTML tags safely');
  const xssData = await xssRes.json();
  assert(!xssData.responses[0].text.includes('<script>'), 'Dangerous <script> tag is completely neutralized/sanitized');
  console.log('');

  // 13. Interactive Adaptive Card Form Intake (Input.Text elements)
  console.log('13. Verifying Interactive Adaptive Card Form Intake (Input.Text elements)...');
  const formConvId = 'form-e2e-' + Date.now();
  const formReqRes = await fetch(`${targetUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: formConvId,
      text: 'open form',
    }),
  });
  assert(formReqRes.status === 200, 'Form request returns HTTP 200 OK');
  const formReqData = await formReqRes.json();
  assert(formReqData.responses[0].adaptiveCard, 'Form request returns Adaptive Card');
  const formCard = formReqData.responses[0].adaptiveCard;
  assert(formCard.type === 'AdaptiveCard', 'Card type is "AdaptiveCard"');
  const formContainer = formCard.body.find(el => el.type === 'Container');
  assert(formContainer && formContainer.items.some(el => el.type === 'Input.Text' && el.id === 'name'), 'Contains Input.Text for name');
  assert(formContainer.items.some(el => el.type === 'Input.Text' && el.id === 'mobile'), 'Contains Input.Text for mobile');
  assert(formContainer.items.some(el => el.type === 'Input.Text' && el.id === 'address'), 'Contains Input.Text for address');

  // Submit the form card
  const formSubmitRes = await fetch(`${targetUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: formConvId,
      action: 'submit_intake_form',
      formData: {
        name: 'Lea Salonga',
        mobile: '09179876543',
        address: 'Greenhills, San Juan City',
      },
    }),
  });
  assert(formSubmitRes.status === 200, 'Form submission returns HTTP 200 OK');
  const formSubmitData = await formSubmitRes.json();
  assert(formSubmitData.responses[0].adaptiveCard, 'Form submission returns confirmation Adaptive Card');
  assert(formSubmitData.responses[0].text.includes('Lea Salonga'), 'Confirmation reflects submitted name');
  assert(formSubmitData.responses[0].text.includes('+639179876543'), 'Confirmation reflects normalized mobile');
  console.log('');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('========================================================================');
  console.log(`E2E SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (${duration}s)`);
  console.log('STATUS: 100% REGRESSION, INTEGRATION & PROTOCOL TESTS PASSED');
  console.log('========================================================================\n');
}

runSuite().catch((err) => {
  console.error('\n❌ E2E SUITE EXECUTION FAILED:', err.message);
  process.exit(1);
});
