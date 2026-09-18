# Testing

## Overview

The DCBSD Chatbot has a comprehensive test suite covering validation, conversation flow, and security. All tests run offline without external services.

---

## Test Framework

- **Vitest** — Fast TypeScript-native test runner
- **Zero external dependencies** — No mocking libraries needed; the architecture supports direct unit testing

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (re-runs on file changes)
npm run test:watch

# Run a specific test file
npx vitest run tests/mobile.test.ts
```

---

## Test Suites

### 1. Mobile Validation (`tests/mobile.test.ts`)

Tests the Philippine mobile number validator in isolation.

| Category | Test Cases |
|----------|-----------|
| **Valid numbers** | `09171234567`, `09181234567`, `09201234567`, `+639171234567`, `639171234567`, numbers with spaces/dashes |
| **Invalid numbers** | Empty, whitespace, `12345`, `ABC123`, `091712345` (too short), `091712345678` (too long), `08171234567` (wrong prefix) |
| **Edge cases** | Special characters, very long strings, null/undefined input, wrong starting digits |
| **Normalization** | Verifies all valid formats normalize to `+63XXXXXXXXXX` |

### 2. Input Validation (`tests/validation.test.ts`)

Tests name and address validators.

| Category | Test Cases |
|----------|-----------|
| **Valid names** | Normal names, hyphenated, apostrophes, periods |
| **Invalid names** | Empty, whitespace, numbers, special characters, too long |
| **Valid addresses** | Normal addresses, special characters, unit numbers |
| **Invalid addresses** | Empty, whitespace, too long |
| **Sanitization** | Whitespace trimming, max length truncation |

### 3. Conversation Flow (`tests/conversation.test.ts`)

Tests the complete state machine end-to-end.

| Scenario | Description |
|----------|-------------|
| **Happy path** | START → Name → Mobile → Address → Confirm (Yes) → Complete |
| **Restart flow** | Name → Mobile → Address → Confirm (No) → Back to ASK_NAME |
| **Invalid mobile retry** | Invalid → re-prompt → valid → advance |
| **Unexpected confirm input** | Random text at CONFIRM → re-prompt with options |
| **Restart command** | "restart" from ASK_MOBILE and ASK_ADDRESS |
| **Text variants** | "yes, submit", "start over" accepted at confirmation |
| **Adaptive Cards** | Cards present at confirmation and completion |

### 4. Security Tests (`tests/security.test.ts`)

Tests defensive behavior against malicious input.

| Category | Test Cases |
|----------|-----------|
| **XSS payloads** | `<script>alert(1)</script>`, `<img onerror>` |
| **SQL injection** | `' OR '1'='1`, `'; DROP TABLE users;` |
| **Oversized input** | 10,000+ character strings for name, mobile, address |
| **Special encoding** | Unicode characters, emoji, null bytes |
| **State safety** | Rapid-fire random inputs never crash; post-completion recovery |

---

## Test Results

```
 ✓ tests/mobile.test.ts (20+ tests)
 ✓ tests/validation.test.ts (15+ tests)
 ✓ tests/conversation.test.ts (10+ tests)
 ✓ tests/security.test.ts (14+ tests)

 Test Files  4 passed (4)
      Tests  68 passed (68)
```

---

## Quality Checks

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run typecheck` | ✅ Zero errors |
| ESLint | `npm run lint` | ✅ Zero errors |
| Tests | `npm test` | ✅ 68/68 passed |
| Build | `npm run build` | ✅ Clean build |
| Audit | `npm audit` | ✅ 0 vulnerabilities |
