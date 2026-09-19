# Development Journey

**Author:** Malcolm Joaquin L. Cuady  
**Role:** Principal Full-Stack Engineer / QA Engineer  
**Project:** DCBSD Chatbot Simulation — Technical Examination  
**Organization:** EastWest Bank (DCBSD)  

---

## Overview

This document describes the actual development process for the DCBSD Chatbot Simulation, from requirement analysis through implementation, testing, and final verification.

---

## 1. Requirement Analysis

The DCBSD technical examination requested a chatbot that:

1. Collects **Name**, **Mobile Number**, and **Address**
2. Validates the mobile number format
3. Displays all collected information back to the user
4. Works with a local emulator/testing tool
5. (Bonus) Integrates Microsoft Adaptive Cards

The requirement was broken down into these work streams:

| Stream | Deliverable |
|--------|-------------|
| **Conversation** | State machine with deterministic flow |
| **Validation** | Philippine mobile number validator |
| **State** | In-memory conversation state management |
| **UI** | Responsive web chat client |
| **Testing** | Unit, conversation, and security tests |
| **Local Tooling** | Web client + Bot Framework Emulator endpoint |
| **Documentation** | README, Architecture, Security, Demo Script |

---

## 2. Technology Investigation

### Original Requirement
The exam references the **Azure Bot Framework SDK v4** and its [GitHub repository](https://github.com/microsoft/botframework-sdk).

### Current Microsoft Direction
The exam also explicitly states a preference for the **Microsoft Agents SDK** (https://github.com/microsoft/agents).

**Key finding:** The Bot Framework SDK v4 and Bot Framework Emulator were **archived on December 31, 2025**. Microsoft's current recommended approach is the **Microsoft 365 Agents SDK**.

### Decision
Use the **Microsoft 365 Agents SDK** (`@microsoft/agents-hosting` v1.8.1) with TypeScript and Express:

- It is the current Microsoft-recommended platform
- It aligns with the exam's stated preference
- The `@microsoft/agents-hosting-express` package provides a clean Express integration
- The `/api/messages` endpoint remains compatible with the Bot Framework Emulator for evaluators who have it installed
- A custom web client provides the responsive experience required by the exam

---

## 3. Architecture Decision

An **explicit state machine** was selected because:

> The chatbot has a small, deterministic workflow. Explicit states make the expected conversation path easy to reason about, test, maintain, and prevent invalid transitions.

Alternatives considered and rejected:
- **Dialog trees / Waterfall dialogs** — More complex than needed for 5 states
- **Free-form NLU** — The exam requires deterministic behavior, not AI interpretation
- **Nested conditionals** — Harder to test and maintain

The state machine uses a TypeScript `enum` (`ConversationStep`) to prevent arbitrary string states and a `switch` statement for explicit transitions.

---

## 4. Validation Decision

> Mobile validation is isolated from the chatbot flow so that it can be tested independently.

The `validateMobileNumber()` function lives in its own module (`src/validation/mobile.ts`) with:
- No dependencies on conversation state
- A clean return type: `{ valid: boolean; normalized?: string; message?: string }`
- Comprehensive test coverage (20+ test cases)

Philippine mobile number formats supported:
- `09XXXXXXXXX` (11 digits)
- `+639XXXXXXXXX` (international format)
- `639XXXXXXXXX` (without plus)
- Numbers with spaces or dashes are cleaned and validated

All valid numbers are normalized to `+63XXXXXXXXX` format for consistent storage.

---

## 5. Security Decisions

Given the banking context, several security measures were implemented:

| Decision | Rationale |
|----------|-----------|
| No PII logging | Banking standard — never log customer data |
| Input length limits | Prevent DoS through oversized payloads |
| Safe error messages | Never expose stack traces or internals |
| Environment variables for config | No secrets in source code |
| textContent rendering | Prevent XSS from user input |
| Transient state only | No unnecessary data persistence |
| No credential collection | Never ask for passwords, PINs, OTPs |
| Input sanitization | Treat all user input as untrusted |

---

## 6. UX Decisions

| Decision | Rationale |
|----------|-----------|
| Responsive CSS (mobile-first) | Exam requires responsive chatbot |
| Navy/white color palette | Banking-appropriate, trustworthy |
| Inter font | Modern, professional, highly legible |
| Typing indicator | Natural conversation feel |
| Adaptive Cards for confirmation | Visual data summary, bonus requirement |
| Clear validation messages | Specific error guidance with examples |
| Restart command support | User control over conversation |
| Keyboard accessibility | WCAG compliance, semantic HTML |

---

## 7. Testing

### Test Suites Created

| Suite | Tests | Focus |
|-------|-------|-------|
| `mobile.test.ts` | 20+ | Valid/invalid/edge mobile numbers |
| `validation.test.ts` | 15+ | Name and address validation |
| `conversation.test.ts` | 10+ | Full state machine flow |
| `security.test.ts` | 14+ | XSS, SQLi, oversized input |

### Test Results
All 68 tests pass. Zero failures.

### Commands
```bash
npm test            # All tests pass
npm run typecheck   # Zero TypeScript errors
npm run lint        # Zero lint errors
npm run build       # Clean production build
npm audit           # Zero vulnerabilities
```

---

## 8. Problems Encountered & Engineering Resolutions

### 1. Bot Framework SDK v4 Deprecation
The original Bot Framework SDK v4 repository was archived in late 2025.
**Resolution**: Transitioned directly to Microsoft's current enterprise platform: the **Microsoft 365 Agents SDK** (`@microsoft/agents-hosting` v1.8.1), fully implementing `ActivityHandler`, `TurnContext`, `CardFactory`, and `MessageFactory`.

### 2. Upstream Adaptive Cards Designer 404 & Dual-Mode Integration
When clicking the exam link `https://adaptivecards.io/designer/`, Microsoft's domain 301-redirects to `https://adaptivecards.microsoft.com/designer/`, where Microsoft's Azure Blob storage static website endpoint encounters a temporary `404 WebContentNotFound` error.
Furthermore, the exam mockup highlighted `Input.Text elements` from the designer gallery.
**Resolution**: Rather than limiting Adaptive Cards to just output review (`FactSet`), we engineered **Dual-Mode Adaptive Cards**:
- **Interactive Form Intake Card**: Uses `Input.Text` elements for Full Name, Philippine Mobile, and Address, complete with client-side container harvesting and `Action.Submit` data transmission.
- **Review Summary Card**: Uses `FactSet`, styled containers, and dual action buttons (*"Yes, submit"*, *"Start over"*).
- **Completion Card**: Uses status badges and verified data confirmation.

### 3. Serverless Lambda Module Resolution
Directly bundling heavy OpenTelemetry and internal Node HTTP adapter dependencies in Vercel serverless functions caused module resolution crashes.
**Resolution**: Architected an intentional decoupling layer: serverless HTTP routes use pure Bot Framework Activity protocol serialization, while the full Agents SDK execution pipeline is maintained in `src/agents/agentSdk.ts` for enterprise channel deployment. Zero peer dependency failures in cloud runtimes.

---

## 9. Future Improvements

If this project were to move to production in a banking environment:

| Enhancement | Purpose |
|-------------|---------|
| Persistent conversation state | Survive server restarts |
| Centralized telemetry | Application performance monitoring |
| Enterprise identity integration | SSO / RBAC |
| Approved data retention policies | Compliance with data protection regulations |
| Azure deployment | Cloud hosting with auto-scaling |
| Automated CI/CD | Build, test, deploy pipeline |
| Security scanning | SAST, DAST, dependency scanning |
| Multilingual support | Support for Filipino and other languages |
| CRM integration | Connect collected data to customer systems |
| HTTPS enforcement | Encrypted transport |
| Rate limiting | Prevent abuse |

These were intentionally not implemented because the exam does not require them.
