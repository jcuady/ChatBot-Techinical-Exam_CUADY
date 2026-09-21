# DCBSD Chatbot Technical Examination — Master Video Demonstration Script
**Candidate:** Malcolm Joaquin L. Cuady  
**Position / Subject:** DCBSD Chatbot Technical Examination (EastWest Bank)  
**Target Duration:** ~4 to 5 minutes  
**Live URL to Record:** [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app)  
**Recording Mode:** Full Screen or Browser Window + Terminal + Microphone  

---

## 📋 Pre-Recording Checklist

1. **Browser Tab:** Open [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app). Ensure the screen is centered and zoom is at 100%.
2. **Terminal Tab:** Open your terminal in the project directory with command pre-typed:  
   `npm run test:requirements`
3. **Audio:** Test microphone input and clear background noise.
4. **Pacing:** Speak calmly, clearly, and authoritatively as a Principal Full-Stack Engineer.

---

## 🎬 Word-for-Word Spoken Teleprompter Script

---

### Scene 1: Introduction & Exam Overview (0:00 – 0:40)
**Visual:** Browser displaying the EastWest Bank branded DCBSD Customer Assistant chat interface.

> **[ACTION: Display the clean web portal showing the EastWest Bank logo, purple brand gradient, "Secure Portal" badge, and welcoming chat bubble.]**

**🗣️ SPOKEN SCRIPT:**
> *"Hello and good day to the DCBSD technical evaluation team at EastWest Bank. My name is Malcolm Joaquin Cuady, and this is my official video demonstration, architecture walkthrough, and technical journey for the DCBSD Chatbot Technical Examination.*
>
> *The objective of this exam was to build a responsive, enterprise-grade conversational chatbot that collects three key customer details—Name, Philippine Mobile Number, and Address—validates them strictly, and displays the collected information back to the user.*
>
> *While the baseline exam prerequisites specify Azure’s Bot Framework SDK v4, the evaluation prompt noted a strong preference for exploring the newer Microsoft 365 Agents SDK. I am pleased to share that I have implemented this chatbot natively using the modern Microsoft 365 Agents SDK, while retaining 100% protocol compatibility with the Bot Framework SDK v4 and the Bot Framework Emulator, coupled with Microsoft Adaptive Cards version 1.5.*
>
> *Let me demonstrate how the chatbot works in real-time, how it was engineered, and the obstacles I overcame along the way."*

---

### Scene 2: Live Demonstration — Happy Path Conversational Intake (0:40 – 1:40)
**Visual:** Live chat interaction entering customer information step-by-step.

> **[ACTION: Click inside the message input box at the bottom.]**

**🗣️ SPOKEN SCRIPT:**
> *"First, let’s look at the conversational intake mode. The conversation is powered by a pure deterministic finite state automaton.*
>
> *On launch, the bot initiates the session and prompts for the customer's full name."*

> **[ACTION: Type `Malcolm Cuady` and press Enter / Send.]**

**🗣️ SPOKEN SCRIPT:**
> *"The bot transitions to the second state, greeting me with a personalized message: 'Nice to meet you, Malcolm Cuady!' and requesting my Philippine mobile number.*
>
> *Our backend features a strict Philippine mobile validation engine that accepts local 09, +63, and 63 formats, and automatically normalizes them into the international E.164 standard."*

> **[ACTION: Type `09171234567` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"The number is validated, formatted, and stored. The bot now requests the complete residential or business address."*

> **[ACTION: Type `EastWest Corporate Center, The Fort, BGC, Taguig City` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Now, we arrive at the confirmation step. As part of the exam's bonus requirement, rather than displaying plain unformatted text, the bot renders an official Microsoft Adaptive Card confirmation.*
>
> *Notice the structured FactSet showing the Name, Normalized Mobile (+639171234567), and Address, accompanied by interactive Action.Submit buttons.*
>
> *Let's confirm the details by clicking the 'Yes, submit' button directly on the Adaptive Card."*

> **[ACTION: Click the green 'Yes, submit' button on the Adaptive Card.]**

**🗣️ SPOKEN SCRIPT:**
> *"Upon confirmation, the bot serves our final Adaptive Completion Card, confirming successful registration with green brand styling and closing the intake transaction securely."*

---

### Scene 3: Bonus Integration — All-in-One Adaptive Card Form Mode (1:40 – 2:20)
**Visual:** Demonstrating the all-in-one form card from the Adaptive Cards Designer.

> **[ACTION: Click the 'Intake Form' button in the top header, or type `open form` into the chat box.]**

**🗣️ SPOKEN SCRIPT:**
> *"In addition to the conversational flow, I also fulfilled the bonus requirement by integrating Microsoft Adaptive Cards for batch data entry.*
>
> *In Image 1 of the exam instructions, the specification highlights the Adaptive Cards Designer at adaptivecards.io featuring `Input.Text` elements. To address this directly, I created an Adaptive Intake Form Card.*
>
> *By clicking the 'Intake Form' button in the header or typing 'open form', the user is presented with an all-in-one form card containing three Input.Text components for Full Name, Mobile, and Address, complete with placeholder text and required-field schema enforcement.*
>
> *Submitting this form feeds directly into the same validation engine and routes seamlessly to our verified confirmation card."*

---

### Scene 4: Input Validation, Resilience & Unhappy Paths (2:20 – 3:00)
**Visual:** Demonstrating validation error handling and state preservation.

> **[ACTION: Click the 'New Session' button in the top header, type `Juan Dela Cruz`, press Enter. Then type an invalid mobile number: `12345` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"In digital banking, data integrity and error handling are critical. Let’s observe how the bot handles invalid input.*
>
> *When an invalid number like '12345' is submitted, the bot immediately flags it: 'That doesn't look like a valid Philippine mobile number. Please enter an 11-digit mobile number, for example: 09171234567. You can also use the +63 format.'*
>
> *Notice that the application does not crash, nor does it reset your session. The finite state machine stays safely at the mobile intake step until valid data is supplied."*

> **[ACTION: Type `09289876543` and press Enter.]**

**🗣️ SPOKEN SCRIPT:**
> *"Entering a valid number immediately resumes the flow without any state degradation.*
>
> *Also notice the user interface: following institutional banking standards, we deliberately removed casual preset suggestion chips, providing a clean, distraction-free environment that protects real banking clients from confusing canned samples with genuine account data."*

---

### Scene 5: How I Did It — Bot Framework SDK v4 & Agents SDK Architecture (3:00 – 3:55)
**Visual:** Switch to VS Code showing `src/bot/agentsHandler.ts` or keep showing the clean interface.

> **[ACTION: Can show `src/bot/agentsHandler.ts` in VS Code or stay on the web interface.]**

**🗣️ SPOKEN SCRIPT:**
> *"Now, let me share the technical architecture and how the SDKs were implemented:*
>
> *1. The SDK Architecture: DCBSD’s existing systems utilize Azure Bot Framework SDK v4, while the exam sidenote requested exploring the newer Microsoft 365 Agents SDK. To achieve both, I engineered an abstraction bridge in `src/bot/agentsHandler.ts` using `@microsoft/agents-hosting` version 1.8.1 and `@microsoft/agents-activity`.*
>
> *I subclassed the Agents SDK `ActivityHandler` to manage the turn lifecycle—handling `onMembersAdded` for initial greetings and `onMessage` for conversation routing. Simultaneously, the endpoint at `/api/messages` translates incoming Bot Framework Activity JSON payloads, making the bot 100% compatible with both the Bot Framework Emulator and modern web channels.*
>
> *2. Microsoft Adaptive Cards: Built using the official schema version 1.5 from `adaptivecards.io/designer`. The cards use native `FactSet`, `Input.Text`, and `Action.Submit` components.*
>
> *3. Bank-Grade Security & CIA Triad:*
> - *Confidentiality: Following the Philippine Data Privacy Act of 2012, zero customer PII is recorded in server logs or telemetry. Only anonymized state transitions are logged.*
> - *Integrity: Complete XSS immunity. All front-end rendering in `chat.js` uses DOM `textContent` exclusively—zero `innerHTML`. Injected scripts or HTML tags are neutralized as inert strings.*
> - *Availability: Enforces a 1,000-character payload ceiling to eliminate ReDoS attacks, and runs on a hardened Express server with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and suppressed server headers."*

---

### Scene 6: Obstacles Encountered & Their Resolutions (3:55 – 4:45)
**Visual:** Smooth narration walking through the key engineering hurdles.

**🗣️ SPOKEN SCRIPT:**
> *"During development, I encountered five notable obstacles and engineered solutions for each:*
>
> *First, the Microsoft 365 Agents SDK Documentation Gap: The Agents SDK is relatively new and has significantly fewer community tutorials than SDK v4. To resolve this, I inspected the TypeScript source code directly within the npm package and reviewed Microsoft's open-source test suites at `microsoft/agents`, successfully constructing our custom `DCBSDAgentHandler` adapter.*
>
> *Second, Serverless Statelessness on Vercel: Traditional Bot Framework bots assume a persistent, long-lived server process. On Vercel's serverless edge, container instances are ephemeral. I resolved this by isolating state access behind a clean state manager with client-side conversation continuity, while architecting the state store so that transitioning to Azure Cosmos DB or Redis is a drop-in change for production.*
>
> *Third, Adaptive Cards Schema Pinning: Different card renderers handle versions inconsistently. I pinned all cards strictly to schema version 1.5 and engineered a safe native HTML card renderer for the browser client.*
>
> *Fourth, Philippine Cultural Name Validation: Strict alphabetical regex fails on legitimate Filipino names with hyphens, apostrophes, or middle initials like 'Maria Del Rosario-Cruz' or 'Juan D. Dela Cruz'. I resolved this using Unicode-aware regular expressions (`\p{L}`) that accept legitimate cultural naming conventions while strictly filtering code injection.*
>
> *And fifth, Digit Isolation in Name Fields: During QA, we discovered that test inputs containing numbers were correctly rejected by our name validator, confirming that our strict data hygiene rules protect core banking systems from corrupted inputs."*

---

### Scene 7: Automated Test Suite & Real Verification (4:45 – 5:15)
**Visual:** Switch to Terminal and execute the requirements test command.

> **[ACTION: Open terminal window and execute: `npm run test:requirements`.]**

**🗣️ SPOKEN SCRIPT:**
> *"To ensure that every requirement was met without simulation or dummy data, I engineered a comprehensive automated test suite with 160 tests.*
>
> *Running `npm run test:requirements` boots an actual Express server and executes 67 real HTTP integration tests covering all requirements from R-01 to R-16.*
>
> *As you can see live on the terminal screen, all 67 requirement tests pass with zero failures in just over one second."*

> **[ACTION: Allow the terminal to display `✓ tests/requirements.test.ts (67 tests) passed`.]**

---

### Scene 8: Future Roadmap & Enterprise Banking Vision (5:15 – 5:50)
**Visual:** Switch back to the live web interface.

**🗣️ SPOKEN SCRIPT:**
> *"Looking ahead to full enterprise deployment within EastWest Bank, here is how this architecture can scale:*
>
> *1. Digital eKYC: Embedding Philippine National ID (PhilSys) OCR scanning and 3D facial liveness verification directly into Adaptive Cards, automating real-time AML/CFT screening with the Anti-Money Laundering Council.*
>
> *2. Core Banking Integration: Connecting to EastWest core APIs via OAuth 2.0 and Step-Up OTP for balance inquiries, credit card activations, and InstaPay transfers.*
>
> *3. Enterprise Data Security: Transitioning conversation persistence to Azure Cosmos DB with Customer-Managed Keys (CMK) and AES-256 field-level PII encryption for full BSP Circular 982 compliance.*
>
> *4. Omnichannel Continuity: Deploying the identical Agents SDK logic across Web Chat, Viber, and the EastWest Mobile Banking App with synchronized customer context."*

---

### Scene 9: Conclusion & Sign-Off (5:50 – 6:10)
**Visual:** Showing the live EastWest Bank portal header and repository links.

**🗣️ SPOKEN SCRIPT:**
> *"In summary: the chatbot is fully functional, deployed live on Vercel, tested with 160 automated tests, built natively with the Microsoft 365 Agents SDK and Bot Framework protocol, and enriched with Microsoft Adaptive Cards.*
>
> *All code and documentation are available on my GitHub repository. Thank you very much to the DCBSD team for this opportunity, and I look forward to contributing to digital banking innovation at EastWest Bank. Have a great day!"*

---

## ⏱️ Video Timing Reference Table

| Scene | Topic | Target Time | Key On-Screen Action |
|:---:|---|:---:|---|
| **1** | Introduction & Sidenote mention | 0:00 – 0:40 | Display EastWest chat UI |
| **2** | Conversational Intake (Happy Path) | 0:40 – 1:40 | Enter Name, Mobile, Address, Click 'Yes' |
| **3** | Adaptive Card Intake Form | 1:40 – 2:20 | Click 'Intake Form' in header, show Input.Text |
| **4** | Validation & Error Handling | 2:20 – 3:00 | Enter '12345', recover with valid mobile |
| **5** | Architecture: SDK v4, Agents SDK & Security | 3:00 – 3:55 | Technical breakdown of `agentsHandler.ts` & CIA |
| **6** | Obstacles & Resolutions (5 hurdles) | 3:55 – 4:45 | Explain docs gap, serverless, regex, cards |
| **7** | Automated Test Suite Demo | 4:45 – 5:15 | Run `npm run test:requirements` live |
| **8** | Future Roadmap & Banking Vision | 5:15 – 5:50 | eKYC, Core Banking, Cosmos DB, Omnichannel |
| **9** | Conclusion & Sign-Off | 5:50 – 6:10 | Thank you & repository link |
