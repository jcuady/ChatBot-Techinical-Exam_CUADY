# DCBSD Chatbot Technical Examination — Master Video Demonstration Script
**Candidate:** Malcolm Joaquin L. Cuady  
**Evaluation:** DCBSD Chatbot Technical Examination (EastWest Bank)  
**Tone:** Confident, professional, clear, and natural (human-to-human)  
**Target Time:** ~4 to 5 minutes  
**Live Demo:** [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app)  

---

## 🎧 Quick Setup Before Recording

1. **Browser:** Open [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app) in Chrome/Edge.
2. **Terminal:** Have your terminal open in the project folder with this command typed and ready:  
   `npm run test:requirements`
3. **Pacing Tip:** Take a breath between scenes. Speak at a steady, natural conversational pace.

---

## 🎬 Master Teleprompter Script (Word-for-Word)

---

### Scene 1: Introduction & The Sidenote Choice
⏱️ **Time:** ~40 seconds  
🖥️ **On Screen:** Showing the EastWest Bank branded chat portal with the "Secure Portal" badge.

> **[ACTION: Have the live web portal on screen. Mouse cursor idle.]**

**🗣️ WHAT TO SAY:**
> *"Hi everyone! Good day to the DCBSD technical evaluation team at EastWest Bank. My name is Malcolm Joaquin Cuady, and today I’m excited to present my video walkthrough for the DCBSD Chatbot Technical Examination.*
>
> *The goal here was to build a clean, reliable, and secure chatbot that gathers three customer data points—Name, Philippine Mobile Number, and Address—validates them properly, and reflects that information back to the user.*
>
> *Now, the brief mentioned Azure’s Bot Framework SDK v4, but it included a specific sidenote expressing a preference for Microsoft’s newer Agents SDK. Taking that recommendation to heart, I engineered this chatbot natively using the modern Microsoft 365 Agents SDK, while ensuring 100% protocol compatibility with SDK v4 and the Bot Framework Emulator, along with Microsoft Adaptive Cards.*
>
> *Let me take you through a live demonstration of how it works, how it’s built, and how we applied bank-grade security throughout the system."*

---

### Scene 2: Live Demo — Conversational Flow (Happy Path)
⏱️ **Time:** ~55 seconds  
🖥️ **On Screen:** Interacting with the chatbox.

> **[ACTION: Click the message box at the bottom.]**

**🗣️ WHAT TO SAY:**
> *"First, let’s look at the conversational experience. The chat runs on a deterministic finite state machine, so every transition is predictable and controlled.*
>
> *The bot starts by introducing itself and asking for my full name."*

> **[ACTION: Type `Malcolm Cuady` and press Enter.]**

**🗣️ WHAT TO SAY:**
> *"It greets me personally—'Nice to meet you, Malcolm Cuady'—and transitions cleanly to asking for my Philippine mobile number.*
>
> *Under the hood, we built a dedicated Philippine mobile validator that accepts 09, +63, or 63 formats, and automatically normalizes them into the international E.164 banking standard."*

> **[ACTION: Type `09171234567` and press Enter.]**

**🗣️ WHAT TO SAY:**
> *"The number is verified, and the bot asks for my address."*

> **[ACTION: Type `EastWest Corporate Center, The Fort, BGC, Taguig City` and press Enter.]**

**🗣️ WHAT TO SAY:**
> *"Now, for the confirmation step: to fulfill the bonus requirement, rather than just returning plain text, the bot renders an official Microsoft Adaptive Card.*
>
> *You can see a clean FactSet presenting the Name, the Normalized Mobile (+639171234567), and the Address, complete with interactive Action.Submit buttons.*
>
> *Let’s confirm by clicking 'Yes, submit'."*

> **[ACTION: Click the green 'Yes, submit' button on the card.]**

**🗣️ WHAT TO SAY:**
> *"Once clicked, the bot returns a Completion Card confirming that the intake record has been submitted securely."*

---

### Scene 3: Bonus — All-in-One Adaptive Card Form
⏱️ **Time:** ~35 seconds  
🖥️ **On Screen:** Showing the top header button.

> **[ACTION: Click the 'Intake Form' button in the top-right header.]**

**🗣️ WHAT TO SAY:**
> *"In addition to the conversational chat, I also implemented an all-in-one form mode using Microsoft Adaptive Cards.*
>
> *In Image 1 of the exam instructions, you shared a screenshot of the Adaptive Cards Designer featuring `Input.Text` elements. To implement that directly, clicking the 'Intake Form' button in the header—or simply typing 'open form'—renders this interactive intake card.*
>
> *It presents all three fields in one place with native schema validation. When submitted, it routes straight into our validation pipeline and takes the user right to the verified confirmation card."*

---

### Scene 4: Validation, Error Recovery & Clean Banking UI
⏱️ **Time:** ~40 seconds  
🖥️ **On Screen:** Testing bad input and recovering.

> **[ACTION: Click 'New Session' in the header. Type `Juan Dela Cruz`, press Enter. Then type `12345` and press Enter.]**

**🗣️ WHAT TO SAY:**
> *"In banking systems, reliability and data hygiene are essential. Let’s see what happens when bad data is entered.*
>
> *If a user enters an invalid number like '12345', the bot immediately catches it: 'That doesn't look like a valid Philippine mobile number,' and gives clear examples like 0917 or +63.*
>
> *Notice that the application doesn't crash or lose state. The user remains safely at the mobile step until valid input is provided."*

> **[ACTION: Type `09289876543` and press Enter.]**

**🗣️ WHAT TO SAY:**
> *"Once a valid number is supplied, it resumes seamlessly.*
>
> *You’ll also notice that we keep the interface clean and distraction-free: no casual suggestion chips that could confuse banking clients into thinking canned samples are real account data."*

---

### Scene 5: How I Built It — SDK v4, Agents SDK & The CIA Triad
⏱️ **Time:** ~60 seconds  
🖥️ **On Screen:** Web portal or brief glance at VS Code (`src/bot/agentsHandler.ts`).

> **[ACTION: Stay on web portal or display `src/bot/agentsHandler.ts` in VS Code.]**

**🗣️ WHAT TO SAY:**
> *"Now, let’s talk about how this was engineered from a full-stack and security perspective.*
>
> *1. Framework & SDKs:*
> *To balance DCBSD’s current SDK v4 infrastructure with your long-term Agents SDK preference, I built an adapter layer in `src/bot/agentsHandler.ts` using `@microsoft/agents-hosting` version 1.8.1 and `@microsoft/agents-activity`.*
> *We subclassed the Agents SDK `ActivityHandler`, handling `onMembersAdded` for initial onboarding and `onMessage` for conversation turns. Simultaneously, our `/api/messages` endpoint accepts standard Bot Framework Activity payloads, making it fully compatible with the Bot Framework Emulator.*
>
> *2. Bank Security & The CIA Triad:*
> *Working in a banking context, I designed this following the CIA Triad and BSP Circular 808 standards:*
>
> *- Confidentiality: In line with the Philippine Data Privacy Act of 2012, zero customer PII is stored in console logs or telemetry. We only log state transition events, never names, mobile numbers, or addresses. Furthermore, sessions are strictly isolated so users can never see each other's data.*
>
> *- Integrity: Complete XSS immunity. In our client code, all rendering uses DOM `textContent` instead of `innerHTML`. Malicious script tags or image injection vectors are treated as plain, harmless text.*
>
> *- Availability: We implemented a 1,000-character payload ceiling to guard against ReDoS and buffer exhaustion attacks, and configured hardened security headers—like `X-Frame-Options: DENY` against clickjacking and removing `X-Powered-By` to prevent server fingerprinting."*

---

### Scene 6: Obstacles & Resolutions
⏱️ **Time:** ~50 seconds  
🖥️ **On Screen:** Natural, confident delivery.

**🗣️ WHAT TO SAY:**
> *"During the build, I encountered five main obstacles:*
>
> *First, the Agents SDK Documentation Gap: Because the Agents SDK is relatively new, there are fewer community examples than SDK v4. I resolved this by reviewing Microsoft's open-source TypeScript source code and test files directly at `microsoft/agents`, which gave me the exact patterns to build our `DCBSDAgentHandler`.*
>
> *Second, Serverless Statelessness on Vercel: Standard bot frameworks often assume persistent memory. On Vercel, serverless instances can be ephemeral. I solved this by decoupling the state store with client-side conversation continuity, designing it so that dropping in Azure Cosmos DB or Redis for full production is seamless.*
>
> *Third, Adaptive Cards Schema Pinning: Different platforms render cards differently. Pinned all cards to schema version 1.5 and wrote a safe native renderer for the web client.*
>
> *Fourth, Philippine Name Nuances: Strict alphabetical rules often break on legitimate cultural names with hyphens, apostrophes, or middle initials like 'Maria Del Rosario-Cruz' or 'Juan D. Dela Cruz'. I solved this using Unicode-aware regular expressions (`\p{L}`) that support valid Philippine names while strictly blocking HTML injection.*
>
> *And fifth, Digit Isolation in Names: During QA, we confirmed that inputs containing numbers were correctly flagged by the name validator, ensuring high data hygiene before anything touches core banking systems."*

---

### Scene 7: Automated Test Suite (Real Proof)
⏱️ **Time:** ~30 seconds  
🖥️ **On Screen:** Terminal window.

> **[ACTION: Switch to your terminal window. Run `npm run test:requirements`.]**

**🗣️ WHAT TO SAY:**
> *"To verify every requirement without mocks or dummy shortcuts, I built an automated suite of 160 tests.*
>
> *Running `npm run test:requirements` boots a live local Express server and fires 67 real HTTP integration tests covering all requirements from R-01 to R-16.*
>
> *As you can see live on the terminal, all 67 requirement tests pass cleanly in just about one second."*

> **[ACTION: Let the terminal show all green checkmarks.]**

---

### Scene 8: Future Roadmap & Closing
⏱️ **Time:** ~35 seconds  
🖥️ **On Screen:** Switch back to the live web portal.

> **[ACTION: Switch back to the web portal showing the EastWest Bank header.]**

**🗣️ WHAT TO SAY:**
> *"Looking ahead to enterprise production at EastWest Bank, this architecture is positioned to expand into:*
> *- Digital eKYC with PhilSys National ID OCR and facial liveness checks,*
> *- Core Banking API integration for balance inquiries and InstaPay transfers via OAuth 2.0 with OTP, and*
> *- Full Azure Cosmos DB persistence with AES-256 field-level encryption for BSP Circular 982 compliance.*
>
> *The entire codebase, tests, and documentation are available on my GitHub repository, and the bot is live on Vercel.*
>
> *Thank you very much to the DCBSD team for your time and consideration. I look forward to the next steps!"*

---

## ⏱️ Scene Timing Cheat-Sheet

| Scene | What You Are Doing | Target Time |
|:---:|---|:---:|
| **1** | Welcome & Sidenote Agents SDK mention | 0:00 – 0:40 |
| **2** | Live Conversational Flow (Name → Mobile → Address → Card) | 0:40 – 1:35 |
| **3** | Adaptive Card Intake Form (Header button) | 1:35 – 2:10 |
| **4** | Validation Error & Recovery ('12345' → valid) | 2:10 – 2:50 |
| **5** | Architecture, SDKs & CIA Triad | 2:50 – 3:50 |
| **6** | 5 Obstacles & Resolutions | 3:50 – 4:40 |
| **7** | Terminal: `npm run test:requirements` live | 4:40 – 5:10 |
| **8** | Future Roadmap & Thank You | 5:10 – 5:45 |
