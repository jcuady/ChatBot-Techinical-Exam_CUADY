# Demo Script

**Target duration:** 3–5 minutes

---

## Demo 1 — Introduction (30 seconds)

> "This is the DCBSD Chatbot Simulation, built for the technical examination."
>
> "I built this as a **deterministic conversational intake workflow** using the Microsoft 365 Agents SDK with TypeScript and Express."
>
> "The bot collects three pieces of information — Name, Mobile Number, and Address — and validates the mobile number against Philippine format before allowing the conversation to continue."
>
> "Let me walk you through it."

---

## Demo 2 — Normal Flow (1 minute)

Start the chatbot and demonstrate the happy path:

1. **Bot sends welcome:** "Hello! I'm the DCBSD Chatbot Assistant..."
2. **Enter name:** `Juan Dela Cruz`
3. **Bot confirms name:** "Nice to meet you, Juan Dela Cruz!"
4. **Enter mobile:** `09171234567`
5. **Bot acknowledges:** "Thanks! What is your address?"
6. **Enter address:** `Quezon City, Metro Manila`
7. **Bot shows summary** — Point out the **Adaptive Card** with Name, Mobile (normalized to +63 format), and Address
8. **Click "Yes, submit"**
9. **Bot confirms:** "Thank you, Juan! Your information has been successfully submitted."

> "Notice the mobile number was normalized from 09171234567 to the international +639171234567 format."

---

## Demo 3 — Invalid Mobile Validation (45 seconds)

Start a new conversation (or refresh):

1. **Enter name:** `Maria Santos`
2. **Enter invalid mobile:** `12345`
3. **Bot rejects:** "That doesn't look like a valid Philippine mobile number..."
4. **Show that the bot stays in ASK_MOBILE** — it does not advance
5. **Enter valid mobile:** `09171234567`
6. **Bot advances to address**

> "The validation rejects short numbers, alphabetic characters, wrong prefixes, and numbers that don't match Philippine mobile format. It gives clear guidance on the expected format."

---

## Demo 4 — Restart Flow (30 seconds)

Complete the conversation to the confirmation step:

1. **At confirmation, click "Start over"** (or type "no")
2. **Bot resets:** "No problem. Let's start again. What is your name?"
3. **Show that previous data is cleared** — the bot asks for name again from scratch

> "When the user rejects at confirmation, all previously collected PII is cleared from memory and the conversation restarts from the beginning."

---

## Demo 5 — Architecture (45 seconds)

Show the code briefly:

1. **State machine** — `src/conversation/states.ts` (enum with 5 states)
2. **Conversation flow** — `src/conversation/flow.ts` (switch-based state machine)
3. **Validation module** — `src/validation/mobile.ts` (isolated, testable)
4. **Adaptive Cards** — `src/cards/confirmationCard.ts`
5. **Tests** — `tests/` directory (68 tests, all passing)

> "The architecture separates concerns: state definitions, conversation logic, validation, and Adaptive Card templates are all independent modules."

---

## Demo 6 — Security (30 seconds)

> "I deliberately designed this with banking security principles:"
>
> - "**No PII logging** — state transitions are logged, but never names, numbers, or addresses"
> - "**No credential collection** — the bot never asks for passwords, PINs, or OTPs"
> - "**Secrets stay outside source code** — configuration uses environment variables"
> - "**All input is validated** — length limits, format checks, and safe rendering"
> - "**No persistent storage** — data exists only during the conversation, appropriate for this exam scope"
> - "**68 tests pass** including XSS and injection payloads"

---

## Closing

> "This project demonstrates that I can take a requirement, investigate the appropriate Microsoft technology, design a clear architecture, implement a working solution, validate user input, consider security and privacy, test the system, and document my decisions."

---

## Quick Reference

| Action | How |
|--------|-----|
| Start the bot | `npm run dev` |
| Open web client | http://localhost:3978 |
| Connect Emulator | http://localhost:3978/api/messages |
| Run tests | `npm test` |
| Valid test mobile | `09171234567` |
| Invalid test mobile | `12345` |
