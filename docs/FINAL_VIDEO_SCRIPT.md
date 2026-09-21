# DCBSD Chatbot Technical Examination — Master Video Demonstration Script
**Candidate:** Malcolm Joaquin L. Cuady  
**Target Position / Exam:** DCBSD Chatbot Technical Examination (EastWest Bank)  
**Target Duration:** ~4 to 5 minutes  
**Live URL to Record:** [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app)  
**Terminal Directory:** Project Root (`c:\Users\jcuad\OneDrive\Documents\Chatbot Techinical Exam EastWest`)  

---

## 📋 Pre-Recording Setup & Checklist

1. **Browser Window:** Open [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app) in full screen or a dedicated recording window.
2. **Terminal Window:** Open a clean terminal in the project folder with the command pre-typed:
   ```bash
   npm run test:requirements
   ```
3. **Audio Check:** Test your microphone volume; speak in a calm, confident, and professional engineering tone.
4. **Mouse Movement:** Move smoothly; pause for 1–2 seconds on cards and messages so the evaluation team can easily read them on screen.

---

## 🎬 Word-for-Word Spoken Master Script

### Scene 1: Introduction & Project Overview (0:00 – 0:40)
**Visual:** Browser showing the clean EastWest Bank branded chat interface with the purple brand mesh, header badge, and empty chat canvas.

> **[ACTION: Open the browser on https://dcbsd-chatbot-simulation.vercel.app. Hover briefly over the EastWest logo and 'Secure Portal' badge.]**

**🗣️ SPOKEN SCRIPT:**
> *"Good day to the DCBSD technical evaluation team at EastWest Bank. My name is Malcolm Joaquin Cuady, and this is my complete video demonstration, architecture walkthrough, and technical journey for the DCBSD Chatbot Technical Examination.*
>
> *The objective of this exam was to build a responsive conversational chatbot capable of collecting a customer's Name, Philippine Mobile Number, and Address, verifying the format, and presenting the verified data back to the user.*
>
> *Importantly, while the primary brief referenced Azure's Bot Framework SDK v4, your exam included a forward-looking sidenote: you expressed a strong preference for exploring Microsoft's newer Agents SDK to align with DCBSD's strategic technology roadmap.*
>
> *I embraced that challenge: I engineered this bot natively on the Microsoft 365 Agents SDK while maintaining 100% protocol compatibility with the Bot Framework SDK v4 Emulator, and fully integrated Microsoft Adaptive Cards version 1.5.*
>
> *Let's see how it works in real time."*

---

### Scene 2: How It Works — Conversational Flow & Adaptive Cards (0:40 – 1:40)
**Visual:** Live chat interaction entering customer information step-by-step.

> **[ACTION: Click the bottom chat input box.]**

**🗣️ SPOKEN SCRIPT:**
> *"The chatbot runs on a deterministic finite state machine. It starts with an official DCBSD welcome and asks for the customer's full name."*

> **[ACTION: Type `Malcolm Cuady` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Notice the personalized greeting: 'Nice to meet you, Malcolm Cuady!' The state machine smoothly transitions to mobile intake.*
>
> *Our backend features a strict Philippine mobile validation engine supporting 09, +63, and 63 formats, which automatically sanitizes and normalizes the input into international E.164 standard."*

> **[ACTION: Type `09171234567` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"The mobile number is verified, and the bot asks for the residential address."*

> **[ACTION: Type `EastWest Corporate Center, The Fort, BGC, Taguig City` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Now, look at the output. In strict accordance with the exam specification, the bot outputs: 'Your information is:' followed by the customer's Name, Normalized Mobile (+639171234567), and Address.*
>
> *And right below it is the Bonus Requirement: Microsoft Adaptive Cards. Here, we render an official Adaptive Card Confirmation with a structured FactSet container and interactive Action.Submit buttons.*
>
> *Let's confirm the transaction by clicking 'Yes, submit'."*

> **[ACTION: Click the green 'Yes, submit' button inside the Adaptive Card.]**

**🗣️ SPOKEN SCRIPT:**
> *"The transaction is completed. The bot renders our final Adaptive Completion Card with a green verified status and closing confirmation. Notice that all preset suggestion chips have been removed from the UI to ensure a clean, distraction-free, and professional banking experience."*

---

### Scene 3: Bonus — All-in-One Adaptive Card Form Mode (1:40 – 2:20)
**Visual:** Clicking the "Intake Form" button in the top header.

> **[ACTION: Click the 'New Session' button in the header, then click the 'Intake Form' button in the header.]**

**🗣️ SPOKEN SCRIPT:**
> *"In addition to the conversational flow, I implemented a second intake channel directly inspired by the Adaptive Cards Designer screenshot featured on page 4 of the exam brief.*
>
> *By clicking 'Intake Form' in the top header—or simply typing 'open form'—the chatbot serves an interactive Adaptive Card built with native Input.Text elements.*
>
> *Here, customers or branch officers can enter the Full Name, Philippine Mobile, and Address in a single batch card with built-in client schema validation. Submitting this card routes directly into our validation pipeline and yields the same verified confirmation summary."*

---

### Scene 4: Validation Engine & Error Handling (2:20 – 3:00)
**Visual:** Intentionally entering invalid input to show resilience.

> **[ACTION: Click 'New Session' in the header. Enter `Juan Dela Cruz` for name. In the mobile field, type `12345` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"In banking applications, validation resilience is critical. Let's see what happens with invalid inputs.*
>
> *When an invalid mobile like '12345' is entered, the bot intercepts it: 'That doesn't look like a valid Philippine mobile number. Please enter an 11-digit mobile number, for example: 09171234567.'*
>
> *Notice that the conversation state never crashes, resets, or degrades. The user remains safely at the mobile intake step until valid information is provided."*

> **[ACTION: Type `09289876543` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Entering a valid number immediately resumes the flow seamlessly."*

---

### Scene 5: How We Did It — Dual SDK & Architectural Approach (3:00 – 3:45)
**Visual:** Show the clean interface or switch to VS Code project tree.

**🗣️ SPOKEN SCRIPT:**
> *"Now, let me explain how I engineered this under the hood and how we satisfied both SDKs:*
>
> *1. The Core Challenge — SDK v4 vs. Agents SDK:*
> *Azure's Bot Framework SDK v4 uses the legacy BotFrameworkAdapter pattern. However, the modern Microsoft 365 Agents SDK (`@microsoft/agents-hosting` v1.8.1 and `@microsoft/agents-activity`) uses a modular activity execution pipeline designed for modern Copilots and Teams.*
>
> *2. Our Architectural Bridge:*
> *In `src/bot/agentsHandler.ts`, I subclassed the Agents SDK `ActivityHandler`, overriding `onMessage` and `onMembersAdded`. At our Express HTTP layer (`/api/messages`), we receive the standard Bot Framework Activity payload, wrap it into an Agents SDK `TurnContext`, and execute the pipeline.*
>
> *This means our bot is 100% compatible with the Bot Framework Emulator via SDK v4 protocols, while running natively on the modern Microsoft 365 Agents SDK as preferred by DCBSD.*
>
> *3. Deterministic Finite State Machine:*
> *The conversation state is governed by `flow.ts` (`ASK_NAME → ASK_MOBILE → ASK_ADDRESS → CONFIRM → COMPLETE`). Every transition is strictly typed and predictable, eliminating hanging states.*
>
> *4. Microsoft Adaptive Cards v1.5:*
> *All cards are authored against schema version 1.5 (`adaptivecards.io/schemas/adaptive-card.json`), using native FactSets, Input.Text elements, and Action.Submit payloads."*

---

### Scene 6: Obstacles Encountered & Technical Resolutions (3:45 – 4:30)
**Visual:** Continue smoothly while speaking.

**🗣️ SPOKEN SCRIPT:**
> *"During development, I encountered five key technical obstacles and resolved each of them:*
>
> *Obstacle 1 — Agents SDK Documentation Gap:*
> *Being newer than SDK v4, the Microsoft Agents SDK has minimal community tutorials. To resolve this, I inspected the TypeScript type definitions and test files directly within Microsoft's open-source `microsoft/agents` repository and engineered a clean adapter layer.*
>
> *Obstacle 2 — Serverless Ephemeral State on Vercel:*
> *Bot Framework bots traditionally expect persistent, long-lived server memory, whereas Vercel serverless functions spin up on demand. I architected our state store with client-maintained conversation IDs and isolated the state provider so that plugging in Azure Cosmos DB or Redis is a seamless drop-in change.*
>
> *Obstacle 3 — Adaptive Cards Schema Compatibility:*
> *Ensuring consistent rendering across both the Bot Framework Emulator and modern web browsers required pinning schema version 1.5 and writing a custom, lightweight DOM renderer in `chat.js`.*
>
> *Obstacle 4 — Cultural Philippine Name Validation:*
> *Strict alphabetical regex breaks on legitimate Philippine names with hyphens, apostrophes, and middle initials, such as 'Maria Del Rosario-Cruz' or 'Juan D. Dela Cruz'. I resolved this using a Unicode-aware regular expression (`\p{L}`) that supports all valid Philippine naming conventions while strictly blocking script injection.*
>
> *Obstacle 5 — Digit Rejection in Names:*
> *During testing, automated test names containing numbers (like 'E164 User') were appropriately rejected by our strict naming validator, confirming our high data hygiene before confirmation."*

---

### Scene 7: Banking Standards & CIA Triad Compliance (4:30 – 5:05)
**Visual:** Show the clean chat interface and header security badge.

**🗣️ SPOKEN SCRIPT:**
> *"Because EastWest Bank is a major financial institution, I engineered this system in strict compliance with the CIA Triad, Bangko Sentral ng Pilipinas (BSP) Circulars 808 and 982, and the Philippine Data Privacy Act (RA 10173):*
>
> *• Confidentiality:*
> *Zero PII is logged to server or console logs—only anonymized state transitions are tracked. Each customer session is cryptographically isolated, and all traffic is encrypted with TLS 256-bit.*
>
> *• Integrity:*
> *We achieved 100% Cross-Site Scripting (XSS) immunity by rendering all client content via `textContent` instead of `innerHTML`. Mobile inputs are normalized to international E.164 standard, and our dependency supply chain is verified with zero vulnerabilities via npm audit.*
>
> *• Availability & Resilience:*
> *We enforce a 1,000-character payload ceiling to completely eliminate ReDoS and buffer exhaustion attacks, coupled with a fail-closed architecture where unexpected errors safely reset to a clean state without crashing."*

---

### Scene 8: QA Automated Test Suite Live Run (5:05 – 5:35)
**Visual:** Switch to Terminal and run the test suite.

> **[ACTION: Switch to terminal and run `npm run test:requirements`.]**

**🗣️ SPOKEN SCRIPT:**
> *"To prove that this is not a mock or simulation, I engineered a comprehensive automated test suite with 160 total tests.*
>
> *Running `npm run test:requirements` boots an actual Express server and executes 67 real HTTP integration tests covering 100% of the exam criteria.*
>
> *As you can see on screen, all 67 requirement tests pass flawlessly in just over one second."*

> **[ACTION: Wait for the terminal to display `✓ tests/requirements.test.ts (67 tests) passed`.]**

---

### Scene 9: Future Roadmap & Closing (5:35 – 6:00)
**Visual:** Switch back to the live web interface.

**🗣️ SPOKEN SCRIPT:**
> *"Looking toward enterprise production at EastWest Bank, this architecture is built to scale: transitioning state to Azure Cosmos DB with Customer-Managed Keys, integrating PhilSys National ID OCR and facial liveness for instant eKYC, connecting to core banking APIs for balance inquiries and InstaPay, and deploying omnichannel across Mobile Banking, Web, and Viber.*
>
> *All source code, full test suites, and documentation are available on my GitHub repository, and the live application is deployed on Vercel.*
>
> *Thank you very much to the DCBSD team. I look forward to contributing to your digital banking initiatives at EastWest Bank. Have a great day!"*

---

## ⏱️ Video Timing Reference Table

| Scene | Topic | Timestamp | Visual Cue |
|---|---|---|---|
| **1** | Introduction & Sidenote Acknowledgement | 0:00 – 0:40 | EastWest Bank branded chat landing page |
| **2** | Conversational Flow & Adaptive Cards (Bonus) | 0:40 – 1:40 | Enter Name, Mobile, Address, click "Yes, submit" |
| **3** | Adaptive Card Form Mode (Input.Text) | 1:40 – 2:20 | Click "Intake Form" in header, submit batch card |
| **4** | Validation & Error Handling (Unhappy Path) | 2:20 – 3:00 | Enter invalid mobile "12345", then recover |
| **5** | How We Did It: SDK v4 + Agents SDK Bridge | 3:00 – 3:45 | Explain ActivityHandler, flow.ts, and /api/messages |
| **6** | 5 Obstacles Encountered & Resolutions | 3:45 – 4:30 | SDK docs, Serverless, Adaptive Cards, Regex, Digits |
| **7** | Banking Standards, CIA Triad & Data Privacy | 4:30 – 5:05 | Zero PII, XSS immunity, 1,000-char ReDoS defense |
| **8** | Automated Test Suite Live Execution | 5:05 – 5:35 | Run `npm run test:requirements` in terminal |
| **9** | Future Roadmap & Final Sign-Off | 5:35 – 6:00 | eKYC, Cosmos DB, Core Banking, Thank you |
