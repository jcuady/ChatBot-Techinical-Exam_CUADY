# DCBSD Chatbot Technical Examination — Video Demonstration Script
**Author:** Malcolm Joaquin L. Cuady  
**Candidate for:** DCBSD Chatbot Technical Examination (EastWest Bank)  
**Target Duration:** ~3 to 4 minutes  
**Live URL to record:** [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app)  
**Recording Mode:** Full Screen or Browser Window + Microphone  

---

## Quick Recording Checklist Before You Press Record

1. Open browser tab with: `https://dcbsd-chatbot-simulation.vercel.app`
2. Open terminal tab at project directory: `npm run test:requirements` (ready to run)
3. Set your mic volume, clear throat, and breathe normally.
4. Keep mouse cursor smooth and deliberate.

---

## 🎬 Master Teleprompter Script (Word-for-Word)

### Scene 1: Introduction & Project Overview
**Duration:** ~35 seconds  
**Visual:** Browser showing the EastWest Bank branded DCBSD Chatbot homepage.

> **[ON SCREEN: Show the landing page with the EastWest Bank logo, chatbot header, and clean chat box.]**

**🗣️ SPOKEN SCRIPT:**
> *"Hello! Good day to the DCBSD technical evaluation team. My name is Malcolm Joaquin Cuady, and this is my video demonstration and technical walkthrough for the DCBSD Chatbot Technical Examination.*
>
> *For this exam, I built an enterprise-grade conversational intake chatbot tailored for DCBSD and EastWest Bank clients. Following your sidenote preference, I developed this using the modern Microsoft 365 Agents SDK alongside Bot Framework Activity protocol standards, coupled with Microsoft Adaptive Cards version 1.5.*
>
> *Let me walk you through how it works, how I built it, and how I resolved the technical obstacles I met."*

---

### Scene 2: Conversational Intake Flow (Happy Path)
**Duration:** ~55 seconds  
**Visual:** Chat interaction typing in the inputs one by one.

> **[ON SCREEN: Click on the chat input at the bottom.]**

**🗣️ SPOKEN SCRIPT:**
> *"First, let's look at the standard conversational intake mode. The bot runs on a deterministic finite state machine.*
>
> *It starts by greeting the user and requesting their full name."*

> **[ON SCREEN: Type `Malcolm Cuady` and press Enter / Click Send.]**

**🗣️ SPOKEN SCRIPT:**
> *"Notice the personalized greeting: 'Nice to meet you, Malcolm Cuady.' The bot now moves to the next state, asking for a Philippine mobile number.*
>
> *Our backend features a strict Philippine mobile validator that supports 09, +63, and 63 prefixes, automatically normalizing them into international E.164 standard format."*

> **[ON SCREEN: Type `09171234567` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"The number is validated and accepted. Next, it prompts for the complete home or delivery address."*

> **[ON SCREEN: Type `EastWest Corporate Center, The Fort, BGC, Taguig City` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Now, here is the bonus integration: Microsoft Adaptive Cards. The bot instantly renders an Adaptive Card Confirmation with a structured FactSet, showing the Name, Normalized Mobile (+639171234567), and Address, accompanied by interactive Action.Submit buttons.*
>
> *Let's confirm by clicking 'Yes, Submit'."*

> **[ON SCREEN: Click the green 'Yes, Submit' button on the Adaptive Card.]**

**🗣️ SPOKEN SCRIPT:**
> *"Upon confirmation, the bot serves our final Adaptive Completion Card, congratulating the user and closing the intake transaction securely."*

---

### Scene 3: Bonus — Adaptive Card Form Mode (1:30 – 2:05)
**Visual:** Clicking the "Intake Form" button in the top header.

> **[ACTION: Click the 'Intake Form' button in the top header, or type 'open form'.]**

**🗣️ SPOKEN SCRIPT:**
> *"In addition to the step-by-step conversational flow, I also implemented an all-in-one intake method using Microsoft Adaptive Cards Input.Text components.*
>
> *When a client prefers batch data entry, they can open the Adaptive Intake Card directly by clicking the 'Intake Form' button in the header, or simply by typing 'open form'. Here, all three fields — Full Name, Philippine Mobile, and Address — are presented in a unified card with native schema validation.*
>
> *Submitting this form immediately feeds into our validation pipeline and generates the same verified confirmation summary."*

---

### Scene 4: Validation & Error Handling (Unhappy Paths)
**Duration:** ~35 seconds  
**Visual:** Triggering validation errors intentionally.

> **[ON SCREEN: Click 'Reset', type a name like `Juan Dela Cruz`, press Enter. Then type an invalid mobile number: `12345` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Reliability and error resilience are essential for banking applications. Let's see how our validation handles bad input.*
>
> *If a user enters an invalid number like '12345', the bot immediately flags it: 'Please enter a valid Philippine mobile number (e.g., 0917 123 4567 or +63 917 123 4567).' The state does not break or get lost; the user remains at the mobile intake step until valid data is provided."*

> **[ON SCREEN: Type `09289876543` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Entering a valid number immediately resumes the flow without any state degradation."*

---

### Scene 5: How I Built It (Architecture, Banking Security & Reliability)
**Duration:** ~50 seconds  
**Visual:** Switch to VS Code or keep showing the clean interface while summarizing architecture.

> **[ON SCREEN: Can stay on the web interface or quickly show the clean project folder in VS Code.]**

**🗣️ SPOKEN SCRIPT:**
> *"Now, let me give you a quick technical overview of how this was engineered with bank-grade standards:*
>
> *1. Runtime & Stack: Built with TypeScript 5.6 and Express.js on Node.js 20+, running serverless on Vercel with zero dependency vulnerabilities.*
>
> *2. Bot SDK: Powered by `@microsoft/agents-hosting` version 1.8.1 and `@microsoft/agents-activity`. Our architecture bridges the modern Agents SDK `ActivityHandler` with the Bot Framework activity protocol so it is fully compatible with both the Bot Framework Emulator and modern web channels.*
>
> *3. State Machine & Reliability: The conversation is governed by a pure deterministic finite state automaton (`flow.ts`). In accordance with BSP IT Risk Management standards, the bot is fail-safe and fail-closed: it enforces strict 1,000-character payload limits to prevent ReDoS, and every state transition is strictly typed and predictable.*
>
> *4. Banking Security & Data Privacy: Following the Philippine Data Privacy Act of 2012 and OWASP 2025 guidelines:
> - Client DOM rendering uses `textContent` exclusively—zero `innerHTML`—giving complete immunity against Cross-Site Scripting (XSS).
> - All telemetry logs are zero-PII: customer names, numbers, and addresses are never written to server logs.
> - HTTP responses enforce strict security headers like X-Content-Type-Options: nosniff, X-Frame-Options: DENY against clickjacking, and X-Powered-By is suppressed to prevent server fingerprinting."*

---

### Scene 6: Obstacles Encountered & Resolutions
**Duration:** ~50 seconds  
**Visual:** Smooth transition talking directly about obstacles.

**🗣️ SPOKEN SCRIPT:**
> *"During development, I encountered several key obstacles. Here is how I resolved each of them:*
>
> *First, the Microsoft Agents SDK is cutting-edge and has sparse community documentation compared to the classic SDK v4. To solve this, I reviewed the TypeScript declarations and test suites directly from Microsoft's open-source repository at `microsoft/agents`, and engineered a clean adapter layer in `src/bot/agentsHandler.ts`.*
>
> *Second, Serverless Statelessness on Vercel: Standard bot frameworks expect persistent long-lived memory, but serverless environments can spin up new instances. I structured our state machine to maintain conversation IDs across calls and isolated the state store so that transitioning to persistent cloud stores like Azure Cosmos DB or Redis is a drop-in change.*
>
> *Third, Adaptive Cards Schema Compatibility: Getting Adaptive Card FactSets and Action buttons to render seamlessly across both Web Chat and Bot Framework Emulator required pinning the schema specifically to version 1.5 and writing an XSS-safe native HTML renderer for the web interface.*
>
> *And fourth, Name Validation Edge Cases: Strict regex often breaks on cultural Philippine names with hyphens, apostrophes, or middle initials like 'Maria Del Rosario-Cruz' or 'Juan D. Dela Cruz'. I resolved this using a Unicode-aware regular expression (`\p{L}`) that supports all legitimate Philippine naming patterns while strictly blocking script injection."*

---

### Scene 7: QA & Verification Suite (Live Demo)
**Duration:** ~30 seconds  
**Visual:** Terminal running tests.

> **[ON SCREEN: Switch to terminal window and run `npm run test:requirements`.]**

**🗣️ SPOKEN SCRIPT:**
> *"Finally, to guarantee absolute correctness, I engineered an automated test suite with 160 tests covering 100% of requirements.*
>
> *Running `npm run test:requirements` starts an actual server and executes 67 real HTTP integration tests—zero mocks, zero simulation. As you can see on screen, all 67 requirement tests pass flawlessly."*

> **[ON SCREEN: Let the terminal finish with all green checkmarks.]**

---

### Scene 8: Future Roadmap — Banking Improvements, Data Security & Integrity
**Duration:** ~45 seconds  
**Visual:** Show the clean chatbot interface or architecture slide/diagram.

> **[ON SCREEN: Navigate back to the chatbot interface or highlight the EastWest Bank header.]**

**🗣️ SPOKEN SCRIPT:**
> *"Looking ahead to enterprise production deployment at EastWest Bank, here is how this chatbot architecture is designed to evolve:*
>
> *1. Enterprise Data Security & Integrity: Transitioning from ephemeral state to Azure Cosmos DB with Customer-Managed Keys (CMK) and AES-256 field-level encryption for customer PII at rest. Additionally, implementing an immutable audit trail for BSP Circular 982 compliance.*
>
> *2. Digital eKYC & Biometrics: Integrating Philippine National ID (PhilSys) OCR scanning and liveness detection directly into Adaptive Cards, automating real-time AML/CFT screening with the Anti-Money Laundering Council.*
>
> *3. Core Banking & Omnichannel Orchestration: Connecting to EastWest core banking APIs via OAuth 2.0 and Step-Up Multi-Factor Authentication (OTP) for account balance inquiries, credit card activations, and InstaPay transfers—with cross-channel continuity across Web Chat, Viber, and the EastWest Mobile App.*
>
> *4. Enterprise RAG & Human-Agent Handoff: Pairing the Agents SDK with Azure OpenAI using strict financial guardrails for product FAQs and branch locators, with seamless context-preserving handoff to live contact center agents when needed."*

---

### Scene 9: Conclusion & Sign-Off
**Duration:** ~20 seconds  
**Visual:** Back to the Live App / EastWest Bank Chatbot header.

**🗣️ SPOKEN SCRIPT:**
> *"All code, comprehensive test suites, and documentation are available on my public GitHub repository, and the live application is deployed on Vercel.*
>
> *Thank you very much to the DCBSD team for this exam. I look forward to the opportunity of contributing to your chatbot and digital banking initiatives at EastWest Bank. Have a great day!"*

---

## ⏱️ Video Timing Summary

| Scene | Section | Duration | Key Action on Screen |
|---|---|---|---|
| **1** | Introduction & Sidenote mention | 0:00 – 0:35 | Show EastWest Bank chat UI |
| **2** | Conversational Intake (Happy Path) | 0:35 – 1:30 | Enter Name, Mobile, Address, Click 'Yes' |
| **3** | Adaptive Card Intake Form | 1:30 – 2:05 | Click '📋 Open Form', submit form |
| **4** | Validation & Error Handling | 2:05 – 2:40 | Enter invalid mobile '12345', then recover |
| **5** | Architecture, Banking Security & Reliability | 2:40 – 3:30 | Overview of TypeScript, Agents SDK, Security, BSP |
| **6** | Obstacles & Resolutions | 3:30 – 4:20 | Agents SDK docs, Serverless, Adaptive Cards, Regex |
| **7** | Automated Test Suite | 4:20 – 4:50 | Run `npm run test:requirements` in terminal |
| **8** | Future Roadmap & Banking Vision | 4:50 – 5:35 | eKYC, Core Banking, Cosmos DB, RAG & Omnichannel |
| **9** | Conclusion & Closing | 5:35 – 5:55 | Thank you & sign-off |

