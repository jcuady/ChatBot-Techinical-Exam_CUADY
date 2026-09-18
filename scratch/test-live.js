const baseUrl = 'https://dcbsd-chatbot-simulation.vercel.app';

async function runQA() {
  console.log('=== STARTING LIVE VERCEL QA VERIFICATION ===\n');

  // 1. Health check
  console.log('1. Testing GET /api/health...');
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.log(`Status: ${healthRes.status}`);
    const healthData = await healthRes.json();
    console.log('Response:', JSON.stringify(healthData));
    if (healthRes.status !== 200 || healthData.status !== 'healthy') {
      throw new Error('Health check failed');
    }
    console.log('PASS: Health check is healthy!\n');
  } catch (err) {
    console.error('FAIL: Health check failed:', err);
    process.exit(1);
  }

  // 2. Chat start
  console.log('2. Testing POST /api/chat/start...');
  const convId = 'live-test-' + Date.now();
  try {
    const startRes = await fetch(`${baseUrl}/api/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId })
    });
    console.log(`Status: ${startRes.status}`);
    const startData = await startRes.json();
    console.log('Response:', JSON.stringify(startData, null, 2));
    if (startRes.status !== 200 || !startData.responses || startData.responses.length < 3) {
      throw new Error('Start failed');
    }
    console.log('PASS: Welcome messages returned correctly!\n');
  } catch (err) {
    console.error('FAIL: Start failed:', err);
    process.exit(1);
  }

  // Helper for sending a message
  async function send(text) {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: convId, text })
    });
    return await res.json();
  }

  // 3. Step 1: Send Name
  console.log('3. Testing Step 1: Send Name "Maria Santos"...');
  const nameRes = await send('Maria Santos');
  console.log('Bot Responses:', JSON.stringify(nameRes, null, 2));
  const askedMobile = nameRes.responses.some(r => r.text && r.text.includes('mobile'));
  if (!askedMobile) throw new Error('Expected bot to ask for mobile number');
  console.log('PASS: Successfully asked for mobile number!\n');

  // 4. Step 2a: Send Invalid Mobile
  console.log('4. Testing Step 2a: Send Invalid Mobile "12345"...');
  const badMobileRes = await send('12345');
  console.log('Bot Responses:', JSON.stringify(badMobileRes, null, 2));
  const repromptedMobile = badMobileRes.responses.some(r => r.text && r.text.includes('valid Philippine mobile number'));
  if (!repromptedMobile) throw new Error('Expected invalid mobile validation error');
  console.log('PASS: Successfully rejected invalid mobile with clear error guidance!\n');

  // 5. Step 2b: Send Valid Mobile (+63 917 123 4567)
  console.log('5. Testing Step 2b: Send Valid Mobile "+63 917 123 4567"...');
  const goodMobileRes = await send('+63 917 123 4567');
  console.log('Bot Responses:', JSON.stringify(goodMobileRes, null, 2));
  const askedAddress = goodMobileRes.responses.some(r => r.text && r.text.includes('address'));
  if (!askedAddress) throw new Error('Expected bot to ask for address');
  console.log('PASS: Successfully validated PH mobile and asked for address!\n');

  // 6. Step 3: Send Address
  console.log('6. Testing Step 3: Send Address "Unit 1204, Tower B, Makati City"...');
  const addrRes = await send('Unit 1204, Tower B, Makati City');
  console.log('Bot Responses:', JSON.stringify(addrRes, null, 2));
  const hasCard = addrRes.responses.some(r => r.adaptiveCard);
  const askedConfirm = addrRes.responses.some(r => r.text && (r.text.toLowerCase().includes('confirm') || r.text.toLowerCase().includes('correct')));
  if (!hasCard || !askedConfirm) throw new Error('Expected confirmation prompt and Adaptive Card');
  console.log('PASS: Successfully presented confirmation prompt and Adaptive Card summary!\n');

  // 7. Step 4: Confirm "Yes"
  console.log('7. Testing Step 4: Confirm "Yes"...');
  const confirmRes = await send('Yes');
  console.log('Bot Responses:', JSON.stringify(confirmRes, null, 2));
  const hasCompleteCard = confirmRes.responses.some(r => r.adaptiveCard);
  const completed = confirmRes.responses.some(r => r.text && r.text.includes('Thank you'));
  if (!hasCompleteCard || !completed) throw new Error('Expected completion card and thank you message');
  console.log('PASS: Successfully confirmed, saved details, and displayed completion card!\n');

  // 8. Step 5: Test restart flow
  console.log('8. Testing restart flow from completed state...');
  const restartRes = await send('restart');
  console.log('Bot Responses:', JSON.stringify(restartRes, null, 2));
  const restarted = restartRes.responses.some(r => r.text && (r.text.toLowerCase().includes('name') || r.text.toLowerCase().includes('start again')));
  if (!restarted) throw new Error('Expected restart flow');
  console.log('PASS: Successfully restarted flow!\n');

  console.log('====================================================');
  console.log('ALL LIVE VERCEL QA TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runQA().catch(err => {
  console.error('QA FAILED:', err);
  process.exit(1);
});
