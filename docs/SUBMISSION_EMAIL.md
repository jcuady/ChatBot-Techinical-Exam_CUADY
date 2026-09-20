# DCBSD Chatbot Technical Examination — Submission Email Script
**Author:** Malcolm Joaquin L. Cuady
**Date:** September 2025

---

## Email Draft

> **Subject:** DCBSD Chatbot Technical Examination — Video Demonstration & Development Summary (Malcolm Joaquin L. Cuady)

---

Dear DCBSD Team,

Thank you for the opportunity to participate in the technical examination. Please find attached the video demonstration of my chatbot implementation, along with a brief summary of my development journey, technical decisions, and obstacles I encountered along the way.

---

## 1. Project Overview

I built a **deterministic conversational intake chatbot** designed for DCBSD's internal use case, implementing both the **Microsoft Bot Framework SDK v4 protocol** and the newer **Microsoft 365 Agents SDK** (as the preferred option outlined in the exam brief).

The bot collects three pieces of information from users — their **name**, **Philippine mobile number**, and **home address** — and presents a confirmation summary before final submission.

**Live Deployment:** https://dcbsd-chatbot-simulation.vercel.app
**Repository:** https://github.com/jcuady/ChatBot-Techinical-Exam_CUADY

---

## 2. How I Built It

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ / TypeScript 5.6 |
| Bot SDK | `@microsoft/agents-hosting` v1.8.1 (preferred Agents SDK) |
| Bot Protocol | `@microsoft/agents-activity` (Bot Framework Activity schema) |
| Web Framework | Express.js v4 |
| Deployment | Vercel (serverless) |
| Test Framework | Vitest |
| UI | Vanilla HTML/CSS/JS with EastWest Bank branding |

### Architecture Decisions

**Dual-Mode Intake:** I implemented two distinct ways for users to submit their information:
1. **Conversational mode** — step-by-step prompts through a state machine (Name → Mobile → Address → Confirm)
2. **Adaptive Card form** — a single all-in-one `Input.Text` form card that lets the user fill all three fields at once

This dual mode gives users the choice that best fits their interaction preference.

**State Machine:** The conversation flow is powered by a deterministic finite-state automaton (`src/conversation/flow.ts`) with states: `ASK_NAME → ASK_MOBILE → ASK_ADDRESS → CONFIRM → COMPLETE`. Each state only accepts specific input, rejects invalid input gracefully, and can be reset at any time.

**Microsoft Adaptive Cards (Bonus):** Fully integrated per the bonus requirement:
- Intake card with `Input.Text` (name, mobile, address), `isRequired: true`, and `Action.Submit`
- Confirmation card with `FactSet` displaying the three collected values and two `Action.Submit` buttons (yes/start over)
- Completion card with a congratulatory `TextBlock`
- All cards use schema v1.5 (`https://adaptivecards.io/schemas/adaptive-card.json`)

**Security-First Design:** All responses use `textContent` for dynamic content (not innerHTML), preventing XSS. Security headers (X-Content-Type-Options, X-Frame-Options) are set globally. No SDK versions, package paths, or environment variables are exposed in responses.

**Philippine Mobile Validation:** The validator normalizes all common formats (09XX, +639XX, 639XX, with spaces/dashes) to E.164 (+63XXXXXXXXXX) and validates the prefix is a recognized Philippine mobile prefix.

---

## 3. Obstacles Encountered & Their Resolutions

### Obstacle 1: Microsoft Agents SDK Documentation Gap
**Problem:** The Microsoft 365 Agents SDK (`@microsoft/agents-hosting`) is newer than Bot Framework SDK v4 and has significantly less documentation and community examples. The activity processing pipeline and middleware architecture differs from the familiar `BotFrameworkAdapter` pattern in SDK v4.

**Resolution:** I studied the SDK's TypeScript source directly via the npm package (`node_modules/@microsoft/agents-hosting/dist`), read the GitHub repository's test files at `microsoft/agents` for usage patterns, and built an abstraction layer (`src/bot/agentsHandler.ts`) that bridges the Agents SDK's `ActivityHandler` class with our Express.js routes while remaining compatible with the Bot Framework Emulator's Activity protocol.

---

### Obstacle 2: Vercel Serverless Deployment Constraints
**Problem:** The Bot Framework Emulator connects to a bot endpoint via a persistent WebSocket/HTTP session. Vercel's serverless functions are stateless and timeout after 10s on the free tier. The in-memory conversation state would be lost between requests on Vercel's distributed edge network.

**Resolution:** I designed the state store (`src/state/conversationState.ts`) as an in-process Map (suitable for the examination context), and added clear documentation that a production deployment would use Azure Cosmos DB, Redis, or another persistent store. For the Vercel deployment, I configured the `api/` folder as serverless functions and ensured each request carries its own `conversationId` so the client maintains continuity. The `/api/messages` endpoint (for the Bot Framework Emulator) is tested against the deployed production URL.

---

### Obstacle 3: Adaptive Cards v1.5 Schema Compatibility
**Problem:** Different Adaptive Card hosts render cards differently. The Bot Framework Emulator supports an older schema, while the web client renders via the `adaptivecards` npm package. Getting `FactSet`, `Input.Text`, and action styles (`positive`, `destructive`) to render consistently required careful version pinning.

**Resolution:** Pinned all cards to `version: "1.5"` and verified the schema URL (`https://adaptivecards.io/schemas/adaptive-card.json`). I tested card rendering in both the Emulator and the web client. For the web client, I implemented a lightweight card renderer that maps the Adaptive Card JSON to native HTML elements (for XSS safety, avoiding the official SDK's innerHTML rendering).

---

### Obstacle 4: Name Validation vs. Cultural Edge Cases
**Problem:** Strict name validation (only A-Z characters) would fail for valid Filipino names that include periods (e.g., "Juan D. Cruz"), apostrophes (e.g., "O'Brien"), or hyphens (e.g., "Mary-Jane").

**Resolution:** The name validator uses a Unicode-aware regex (`/^[\p{L}\s'\-.]+$/u`) that allows letters (including Unicode accented characters), spaces, hyphens, apostrophes, and periods. This covers the vast majority of Filipino and international names while still rejecting injected HTML/script content.

---

### Obstacle 5: Security — Preventing Digit-Containing Inputs from Bypassing Name Validation
**Problem:** During QA testing, I discovered that test names like "E164 Test" (which contain digits for clarity) were correctly rejected by the name validator since digits are not part of valid name characters. This caused a test failure where the bot correctly enforced the validation rule.

**Resolution:** Updated tests to use digit-free names (e.g., "Enrique Santos" instead of "E164 Test"). This also led to discovering and documenting the validation rule clearly: names must contain only Unicode letters, spaces, hyphens, apostrophes, and periods.

---

## 4. Video Demonstration Script

### What to Record

**Recommended screen recording tool:** OBS Studio, Loom, or Windows Game Bar (Win+G)

**Target URL:** https://dcbsd-chatbot-simulation.vercel.app

### Scene 1: Introduction (0:00 — 0:30)
- Open the browser to the live deployment URL
- Show the EastWest Bank branded chat interface
- Note: "This is a DCBSD Chatbot built using the Microsoft 365 Agents SDK"

### Scene 2: Conversational Mode — Happy Path (0:30 — 1:30)
1. Type your name and press Enter (e.g., "Malcolm Cuady")
2. Show the bot's response greeting you by name and asking for mobile
3. Type a Philippine mobile number (e.g., "09171234567")
4. Show the bot advancing to ask for address
5. Type an address (e.g., "BGC, Taguig City")
6. Show the Adaptive Card Confirmation (FactSet with all 3 fields)
7. Click "Yes, Submit" on the Adaptive Card
8. Show the Completion Card

### Scene 3: Adaptive Card Form Mode (1:30 — 2:00)
1. Click the "📋 Open Form" button
2. Show the multi-field Input.Text form card
3. Fill all three fields
4. Click Submit
5. Show the confirmation card

### Scene 4: Validation & Error Handling (2:00 — 2:30)
1. Start a new conversation (click Reset)
2. Enter your name
3. Type an invalid mobile (e.g., "12345")
4. Show the validation error message
5. Type a valid mobile to recover

### Scene 5: Bot Framework Emulator (Optional — 2:30 — 3:00)
1. Open Bot Framework Emulator
2. Connect to http://localhost:3978/api/messages
3. Start a conversation via the Emulator
4. Show the same flow working via the SDK protocol

### Scene 6: Test Suite (3:00 — 3:30)
1. Open a terminal in the project directory
2. Run: `npm run test:requirements`
3. Show all 67 tests passing
4. Optionally run: `npm run test:live` to hit the production URL

---

## 5. Test Suite Commands Reference

```bash
# Run all unit + integration tests (93 tests)
npm test

# Run only the requirements compliance suite (67 tests — one per exam requirement)
npm run test:requirements

# Run the live production E2E requirements check (no Vitest, raw HTTP)
npm run test:live

# Run the live requirements check against your local dev server
npm run test:live:local

# Run the end-to-end test suite (uses the production URL)
npm run test:e2e

# Run with SDK deep verification
npm run test:all
```

---

## 6. Repository Structure Summary

```
.
├── src/
│   ├── index.ts                  # Express app entry + route wiring
│   ├── bot/
│   │   └── agentsHandler.ts      # Microsoft Agents SDK integration
│   ├── cards/
│   │   ├── intakeCard.ts         # Input.Text form Adaptive Card
│   │   └── confirmationCard.ts   # FactSet + Action.Submit card
│   ├── conversation/
│   │   ├── flow.ts               # Deterministic state machine
│   │   └── prompts.ts            # All user-facing text (centralized)
│   ├── state/
│   │   └── conversationState.ts  # In-process state store
│   └── validation/
│       ├── mobile.ts             # Philippine mobile + E.164
│       ├── input.ts              # Name + address validators
│       └── constants.ts          # Length limits
├── public/
│   ├── index.html                # EastWest Bank branded chat UI
│   ├── chat.js                   # Secure client (no innerHTML)
│   └── styles.css                # Premium UI styling
├── tests/
│   ├── requirements.test.ts      # 67-test requirements compliance suite
│   ├── conversation.test.ts      # State machine unit tests
│   ├── api-integration.test.ts   # API protocol tests
│   ├── mobile.test.ts            # Mobile validation tests
│   ├── security.test.ts          # XSS + security tests
│   └── sdk-agent.test.ts         # SDK package verification
└── scripts/
    ├── test-live-requirements.js # Live production requirements check
    ├── test-e2e.js               # E2E integration runner
    └── verify-sdk-deep.js        # SDK authenticity verifier
```

---

## 7. Key Links

| Item | URL |
|------|-----|
| Live Demo | https://dcbsd-chatbot-simulation.vercel.app |
| GitHub Repository | https://github.com/jcuady/ChatBot-Techinical-Exam_CUADY |
| Microsoft Agents SDK | https://github.com/microsoft/agents |
| Adaptive Cards Designer | https://adaptivecards.io/designer/ |
| Adaptive Cards Schema | https://adaptivecards.io/schemas/adaptive-card.json |

---

Thank you for reviewing my submission. I look forward to discussing my implementation choices in more detail.

Best regards,
**Malcolm Joaquin L. Cuady**
