# DCBSD Chatbot Technical Examination — Master Video Demonstration Script
**Author & Presenter:** Malcolm Joaquin L. Cuady  
**Project:** DCBSD Customer Intake Chatbot (EastWest Bank)  
**Tone:** Professional, conversational, natural, and confident (Spoken dialogue)  
**Target Duration:** ~4 to 5 minutes  
**Live Target URL:** [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app)  

---

## 💡 Quick Tips for Your Recording
* **Tool:** Use OBS Studio, Loom, or Windows Game Bar (`Win + G`).
* **Format:** Full screen with your browser showing the live deployed chatbot, and terminal ready in background.
* **Delivery:** Speak naturally, like you're walking a fellow tech lead through your project over coffee or Zoom.

---

# 🎬 The Complete Spoken Teleprompter Script

---

### Part 1: Welcome & The Project Journey (0:00 – 0:45)
**On Screen:** Full view of the live EastWest Bank branded chatbot at `dcbsd-chatbot-simulation.vercel.app`.

> **[ACTION: Open the browser to the live app. Hover gently over the EastWest logo and the "Secure Portal" badge.]**

**🗣️ WHAT TO SAY:**
> *"Hi everyone! Good day to the DCBSD technical evaluation team at EastWest Bank. My name is Malcolm Joaquin Cuady, and today I’m excited to walk you through my technical exam submission: our DCBSD Customer Intake Chatbot.*
>
> *The core goal was to build a responsive, robust chatbot that collects a customer's Name, Philippine Mobile Number, and Address, validates them, and summarizes them back to the user.*
>
> *Now, the brief mentioned Azure's Bot Framework SDK v4, but had a very interesting sidenote: you preferred exploring the newer Microsoft 365 Agents SDK because that’s where DCBSD is heading. I took that challenge to heart! I engineered this solution natively with the modern Microsoft 365 Agents SDK, while keeping it 100% compatible with the Bot Framework SDK v4 protocol and the Bot Framework Emulator.*
>
> *I also want to share that this was an AI-assisted engineering journey. I paired with advanced AI as an architectural co-pilot to research undocumented SDK internals, stress-test security edge cases, and build a massive test suite. Let me show you how it all came together."*

---

### Part 2: Live Demo — Conversational Intake Flow (0:45 – 1:40)
**On Screen:** Interacting with the chat interface.

> **[ACTION: Click the chat input field at the bottom.]**

**🗣️ WHAT TO SAY:**
> *"Let’s start with the live conversational experience. Our chatbot runs on a deterministic finite state machine, meaning every step is strictly controlled and predictable.*
>
> *The bot greets the user and asks for their full name."*

> **[ACTION: Type `Malcolm Cuady` and hit Enter.]**

**🗣️ WHAT TO SAY:**
> *"It catches the name, greets me personally—'Nice to meet you, Malcolm Cuady!'—and advances to the next step, asking for my mobile number.*
>
> *Here, our backend runs strict Philippine mobile validation. It accepts local formats like 09, +639, or spaces and dashes, and automatically normalizes it to the international E.164 standard."*

> **[ACTION: Type `09171234567` and hit Enter.]**

**🗣️ WHAT TO SAY:**
> *"That was accepted and normalized. Now it asks for my residential or business address."*

> **[ACTION: Type `EastWest Corporate Center, The Fort, BGC, Taguig City` and hit Enter.]**

**🗣️ WHAT TO SAY:**
> *"And here is the confirmation step! As part of the bonus requirement, we integrated Microsoft Adaptive Cards schema version 1.5.*
>
> *Instead of plain raw text, look at this clean Adaptive Card. It uses a structured FactSet showing the Name, Normalized Mobile (+639171234567), and Address, with interactive Action.Submit buttons.*
>
> *Let’s confirm by clicking 'Yes, submit'."*

> **[ACTION: Click the green 'Yes, submit' button on the Adaptive Card.]**

**🗣️ WHAT TO SAY:**
> *"Once submitted, the bot instantly serves our final Adaptive Completion Card, confirming successful registration with green brand accents and closing the intake session safely."*

---

### Part 3: Bonus Feature — All-in-One Adaptive Card Form Mode (1:40 – 2:20)
**On Screen:** Triggering the interactive form card.

> **[ACTION: Click the 'Intake Form' button in the top header, or type `open form` into the chat box.]**

**🗣️ WHAT TO SAY:**
> *"Now, in Image 1 of the exam instructions, the prompt highlighted the Adaptive Cards Designer at adaptivecards.io with `Input.Text` elements. I wanted to fulfill that bonus in a truly useful way.*
>
> *If a customer prefers batch data entry instead of chatting back and forth, they can click 'Intake Form' in the header or type 'open form'.*
>
> *This renders an all-in-one Adaptive Card with native Input.Text components for Name, Mobile, and Address. It has built-in required field validation. When submitted, it feeds directly into the same validation engine and routes straight to confirmation. You get dual-mode flexibility out of the box!"*

---

### Part 4: Validation & The Banking UI Decision (2:20 – 3:05)
**On Screen:** Demonstrating error handling and UI polish.

> **[ACTION: Click 'New Session' in the top header, type `Juan Dela Cruz` for name, hit Enter. Then type `12345` for mobile and hit Enter.]**

**🗣️ WHAT TO SAY:**
> *"In digital banking, reliability and edge-case handling are paramount. Let's see what happens with invalid input.*
>
> *If I type '12345', the bot immediately catches it: 'That doesn't look like a valid Philippine mobile number. Please enter an 11-digit mobile number, for example: 09171234567.'*
>
> *Notice that the application doesn't crash or drop the session. The state machine holds you safely at the mobile step until valid data is provided."*

> **[ACTION: Type `09289876543` and hit Enter.]**

**🗣️ WHAT TO SAY:**
> *"Enter a valid number, and it recovers immediately.*
>
> *You might also notice the interface itself: we deliberately removed generic 'quick suggestion' chips. In a real banking portal, having fake preset names or numbers above the keyboard looks unprofessional and could confuse real clients into thinking someone else's data was cached. We kept it clean, focused, and bank-grade."*

---

### Part 5: Security Architecture & The CIA Triad (3:05 – 3:55)
**On Screen:** Can remain on the chat screen or briefly show `src/index.ts` in VS Code.

**🗣️ WHAT TO SAY:**
> *"Because EastWest is a financial institution, bank-grade security and the CIA Triad were engineered into every layer:*
>
> *1. Confidentiality: Under the Philippine Data Privacy Act of 2012 and BSP Circular 808, customer PII must never leak into logs. In our codebase, telemetry logs only record state transitions and session IDs—never customer names, numbers, or addresses. Furthermore, sessions are strictly isolated per unique conversation ID.*
>
> *2. Integrity: We have complete immunity against Cross-Site Scripting (XSS). In our front-end, all dynamic content is rendered using DOM `textContent`—zero `innerHTML`. If an attacker inputs script tags or image onerror vectors, they are neutralized as harmless text. In addition, names are sanitized with Unicode whitelisting, and mobile numbers are normalized to E.164.*
>
> *3. Availability: To prevent Regular Expression Denial of Service (ReDoS) or memory exhaustion, we enforce a strict 1,000-character payload ceiling. The server runs with hardened security headers like `X-Frame-Options: DENY` against clickjacking, `X-Content-Type-Options: nosniff`, and suppressed `X-Powered-By` headers."*

---

### Part 6: How the SDKs Work & Our AI-Assisted Journey (3:55 – 4:45)
**On Screen:** Show `src/bot/agentsHandler.ts` or stay on the clean web app.

**🗣️ WHAT TO SAY:**
> *"Now, how did we bridge Azure's Bot Framework SDK v4 with the newer Agents SDK, and what was our journey?*
>
> *The challenge was that the Microsoft 365 Agents SDK (`@microsoft/agents-hosting` and `@microsoft/agents-activity`) is cutting-edge, with very few public tutorials compared to the older SDK v4. This is where AI pair-programming became an incredible force multiplier.*
>
> *I used AI to rapidly explore and dissect the TypeScript type definitions and unit tests inside Microsoft’s open-source `microsoft/agents` GitHub repository. Together, we designed an abstraction bridge in `src/bot/agentsHandler.ts`.*
>
> *We subclassed the Agents SDK `ActivityHandler` to manage turn lifecycles—like `onMembersAdded` for welcome events and `onMessage` for chat routing. Then, we wired our Express endpoint at `/api/messages` to deserialize incoming Bot Framework Activity JSON packets. This gave us the best of both worlds: full compatibility with the classic Bot Framework Emulator, while running on Microsoft’s future-proof Agents SDK!*
>
> *We also used AI to stress-test cultural edge cases—like Filipino names with hyphens or apostrophes such as 'Maria Del Rosario-Cruz'—and to verify that test names with numbers were appropriately flagged."*

---

### Part 7: Real Verification — 160 Automated Tests (4:45 – 5:20)
**On Screen:** Switch to the terminal and execute the test command.

> **[ACTION: Open the terminal window and run: `npm run test:requirements`.]**

**🗣️ WHAT TO SAY:**
> *"To ensure there is zero simulation or fake data, I built a comprehensive test suite of 160 automated tests.*
>
> *Let's run `npm run test:requirements`. This boots an actual Express server and executes 67 real HTTP integration tests covering all requirements from R-01 to R-16.*
>
> *As you can see live on my screen, all 67 requirement tests pass with zero failures in just over one second."*

> **[ACTION: Let the terminal finish showing `✓ tests/requirements.test.ts (67 tests) passed`.]**

---

### Part 8: Future Banking Vision & Conclusion (5:20 – 5:50)
**On Screen:** Switch back to the live web interface.

**🗣️ WHAT TO SAY:**
> *"Looking ahead to enterprise deployment at EastWest Bank, this architecture is ready to scale:*
>
> *1. Digital eKYC: Integrating Philippine National ID (PhilSys) OCR scanning and 3D facial liveness verification directly into Adaptive Cards, with automated AMLC sanctions checks.*
> *2. Core Banking APIs: Connecting via OAuth 2.0 and Step-Up OTP for real-time account balances, credit card activations, and InstaPay transfers.*
> *3. Enterprise Storage: Upgrading ephemeral state to Azure Cosmos DB with Customer-Managed Keys and AES-256 field-level PII encryption for BSP Circular 982 compliance.*
>
> *All code, test suites, and documentation are committed and pushed to my public GitHub repository, and the bot is live on Vercel.*
>
> *Thank you very much to the DCBSD team for this technical examination. I look forward to the next steps and the opportunity to help drive digital banking forward at EastWest Bank. Have a great day!"*

---

## ⏱️ Scene-by-Scene Quick Reference

| Scene | Topic | Timestamp | What You Do On Screen |
|:---:|---|:---:|---|
| **1** | Introduction & Exam Journey | 0:00 – 0:45 | Show EastWest Bank chat UI |
| **2** | Conversational Intake (Happy Path) | 0:45 – 1:40 | Type Name, Mobile, Address, Click 'Yes' |
| **3** | Adaptive Card Intake Form | 1:40 – 2:20 | Click 'Intake Form' in header, show Input.Text |
| **4** | Validation & Professional UI | 2:20 – 3:05 | Type '12345', recover with valid mobile |
| **5** | Security Architecture & CIA Triad | 3:05 – 3:55 | Explain Confidentiality, Integrity, Availability |
| **6** | SDK v4 + Agents SDK & AI Pairing | 3:55 – 4:45 | Explain `agentsHandler.ts` & how AI assisted |
| **7** | Automated Test Suite (Live Run) | 4:45 – 5:20 | Run `npm run test:requirements` in terminal |
| **8** | Future Banking Vision & Closing | 5:20 – 5:50 | eKYC, Core Banking, Cosmos DB, Sign-off |
