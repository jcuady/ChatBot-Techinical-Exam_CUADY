# DCBSD Chatbot Simulation

A deterministic conversational intake chatbot built for the DCBSD Technical Examination. Collects Name, Mobile Number (Philippine format), and Address from the user, validates input, displays a confirmation summary, and supports restart functionality.

---

## Project Overview

This chatbot demonstrates a professional engineering approach to building a conversational application within a banking technology context. It uses Microsoft's current **Agents SDK** direction with **TypeScript** and **Express**, implementing a state-driven conversation flow with:

- Input validation (especially Philippine mobile number format)
- Adaptive Cards integration (bonus requirement)
- Responsive web client
- Comprehensive testing
- Security-conscious design

---

## 🚀 Live Deployments

- **Live Production Web Application**: [https://dcbsd-chatbot-simulation.vercel.app](https://dcbsd-chatbot-simulation.vercel.app)
- **GitHub Repository**: [https://github.com/jcuady/ChatBot-Techinical-Exam_CUADY](https://github.com/jcuady/ChatBot-Techinical-Exam_CUADY)
- **API Health Check**: [https://dcbsd-chatbot-simulation.vercel.app/api/health](https://dcbsd-chatbot-simulation.vercel.app/api/health)
- **Bot Activity Endpoint**: `https://dcbsd-chatbot-simulation.vercel.app/api/messages`

---

## Exam Requirements

> **Original Requirement:** Set up an emulator and create a simple Chatbot that takes in Name, Mobile, and Address as inputs, then displays all the taken inputs back to the user. Program must verify mobile number format and have validation if information does not look valid.

> **Bonus:** Integrate Microsoft Adaptive Cards ✅

---

## Features

| Feature | Status |
|---------|--------|
| Name collection with validation | ✅ |
| Philippine mobile number validation & normalization | ✅ |
| Address collection with validation | ✅ |
| Confirmation summary display | ✅ |
| Restart / Start over flow | ✅ |
| Adaptive Cards (bonus) | ✅ |
| Responsive web client | ✅ |
| Bot Framework Emulator compatible endpoint | ✅ |
| Comprehensive test suite | ✅ |

---

## Technology

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 25.4.0 |
| Language | TypeScript | 5.6+ (strict mode) |
| Agent SDK | @microsoft/agents-hosting | 1.8.1 |
| Express integration | @microsoft/agents-hosting-express | 1.8.1 |
| Activity types | @microsoft/agents-activity | 1.8.1 |
| Web server | Express | 4.21+ |
| Test framework | Vitest | 4.x |
| Linter | ESLint + @typescript-eslint | 8.x |

---

## Architecture

The chatbot uses an explicit state machine with the following conversation flow:

```
START → ASK_NAME → ASK_MOBILE → ASK_ADDRESS → CONFIRM → COMPLETE
                       ↑                          │
                   (invalid)                  (reject → ASK_NAME)
```

Key architectural decisions:
- **Deterministic flow** — no AI/LLM; the workflow is intentionally predictable
- **Isolated validation** — mobile validator is independently testable
- **Transient state** — in-memory conversation state (not persistent)
- **PII-safe logging** — state transitions are logged, but never personal data

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

---

## Setup

### Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0

### Installation

```bash
# Clone or navigate to the project directory
cd "Chatbot Techinical Exam EastWest"

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

---

## Configuration

Edit `.env` (or use the defaults):

```env
NODE_ENV=development
PORT=3978
```

No external API keys or cloud services are required. The chatbot runs entirely locally.

---

## Run

### Development (with hot reload)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

The server starts at **http://localhost:3978**.

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Test Coverage

| Test Suite | Tests | Focus |
|-----------|-------|-------|
| mobile.test.ts | 20+ | Philippine mobile number validation |
| validation.test.ts | 15+ | Name & address validation |
| conversation.test.ts | 10+ | Full conversation flow state machine |
| security.test.ts | 14+ | XSS, SQL injection, oversized input |

---

## Local Testing / Emulator

### Web Client (Recommended)

1. Start the server: `npm run dev`
2. Open **http://localhost:3978** in your browser
3. The chatbot starts automatically with a welcome message

### Bot Framework Emulator

1. Start the server: `npm run dev`
2. Open Bot Framework Emulator
3. Connect to: **http://localhost:3978/api/messages**
4. No App ID or Password required (development mode)

---

## Security

| Control | Implementation |
|---------|---------------|
| Data minimization | Only Name, Mobile, Address collected |
| No credential collection | Never asks for passwords, PINs, OTPs |
| No secrets in source | Environment variables via `.env` |
| PII-safe logging | State transitions logged, PII never logged |
| Input validation | All inputs validated and length-limited |
| Safe rendering | No raw HTML injection; textContent for user input |
| Safe error messages | User sees generic messages; no stack traces |
| Transient state | No persistent storage of personal data |

See [docs/SECURITY.md](docs/SECURITY.md) for the complete security document.

---

## Development Journey

See [docs/DEVELOPMENT-JOURNEY.md](docs/DEVELOPMENT-JOURNEY.md) for the full development narrative, including requirement analysis, technology decisions, obstacles encountered, and lessons learned.

---

## Known Limitations

1. **In-memory state** — Conversation state is lost on server restart. This is intentional for the exam scope.
2. **No authentication** — Intentionally excluded; production would integrate with organizational IAM.
3. **No persistent storage** — No database; data exists only during the conversation.
4. **Philippine mobile only** — Validates PH mobile formats per exam requirements, not international numbers.
5. **Single server** — No horizontal scaling or load balancing.

---

## Project Structure

```
├── src/
│   ├── agents/          # Agent handler (SDK integration)
│   ├── cards/           # Adaptive Card templates
│   ├── config/          # Environment configuration
│   ├── conversation/    # State machine, prompts, flow engine
│   ├── state/           # In-memory conversation state store
│   ├── validation/      # Input validators (mobile, name, address)
│   └── index.ts         # Application entry point
├── tests/               # Test suites
├── public/              # Web client (HTML/CSS/JS)
├── docs/                # Documentation
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
├── package.json         # Project manifest
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

---

## License

This project was created as a technical examination submission and is not licensed for redistribution.
