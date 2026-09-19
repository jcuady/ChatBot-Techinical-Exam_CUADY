# Security & Data Protection Whitepaper

**Author:** Malcolm Joaquin L. Cuady  
**Role:** Principal Full-Stack Engineer / QA Engineer  
**Project:** DCBSD Chatbot Simulation — Technical Examination  
**Organization:** EastWest Bank (DCBSD)  

---

## Overview

This document describes the security controls and OWASP Top 10 mitigations implemented in the DCBSD Chatbot Simulation. While this is a technical examination project, it demonstrates banking-grade security awareness appropriate to an enterprise digital channels environment.

---

## Data Classification

The following data is treated as **personal information (PII)**:

| Field | Classification | Handling |
|-------|---------------|----------|
| Name | Personal | Validated, stored transiently, never logged |
| Mobile Number | Personal | Validated, normalized, stored transiently, never logged |
| Address | Personal | Validated, stored transiently, never logged |

---

## Data Minimization

Only the three fields required by the examination are collected:
- Name
- Mobile Number
- Address

The chatbot **never** collects:
- Passwords, PINs, or OTPs
- Credit/debit card numbers or CVVs
- Bank account numbers
- Government IDs
- Dates of birth
- Online banking credentials
- Security questions

---

## No Credential Collection

The chatbot is explicitly designed to **never** ask for or accept:
- Passwords
- One-Time Passwords (OTP)
- PINs
- CVV/CVC codes
- Card numbers
- Online banking credentials
- Security question answers

---

## Secrets Management

- **No secrets in source code** — No API keys, tokens, passwords, or connection strings are hardcoded
- **Environment variables** — Configuration is loaded from `.env` files
- **`.env` excluded from Git** — The `.gitignore` prevents `.env` from being committed
- **`.env.example` provided** — Template shows required variables without real values

---

## PII Logging Policy

### What IS logged (safe diagnostic data):
```
conversation_started      conversation=abc-123
conversation_state_transition  from=ASK_MOBILE to=ASK_ADDRESS
validation_failed         field=mobile
conversation_completed    conversation=abc-123
conversation_restarted    conversation=abc-123
```

### What is NEVER logged:
```
Full name
Full mobile number
Full address
Tokens or API keys
Environment secrets
User input content
```

---

## Input Validation

All user input is treated as **untrusted** and processed through:

1. **Sanitization** — `sanitizeInput()` trims whitespace and enforces maximum length (1000 chars)
2. **Type validation** — Name, mobile, and address each have specific validators
3. **Format validation** — Mobile numbers are validated against Philippine format patterns
4. **Length limits** — Name (100 chars), Address (500 chars), Raw input (1000 chars)

---

## XSS Protection

- **Web Client** — User text is rendered via `textContent`, never `innerHTML`
- **Bot messages** — Server-controlled text is HTML-escaped before limited markdown rendering
- **Adaptive Cards** — Card content is server-generated JSON, not user-controlled HTML
- **No `dangerouslySetInnerHTML`** — The client does not use any unsafe HTML injection

---

## Error Handling

### User-facing errors:
```
Something went wrong while processing your request.
Please try again.
```

### What is NEVER exposed to users:
- Stack traces
- Internal file paths
- Environment variables
- SDK internals
- Database connection details
- Server implementation details

### Developer logs:
Safe diagnostic context without PII:
```
[timestamp] message_handler_error: [error category]
[timestamp] request_error: [error category]
```

---

## Dependency Security

- Dependencies are reviewed for necessity before installation
- `npm audit` is run after installation
- Only production-critical packages are in `dependencies`
- Development tools are in `devDependencies`
- No unnecessary external services or APIs required

---

## Data Retention

**This implementation intentionally uses transient state for the technical examination.**

- Conversation state exists only in server memory
- State is cleared when the user restarts or completes the conversation
- All state is lost on server restart
- No persistent storage mechanism is used

---

## Production Considerations

A production banking deployment would additionally require:

- **Identity & Access Management** — Integration with the organization's approved IAM system
- **Secure Secret Management** — Azure Key Vault, HashiCorp Vault, or equivalent
- **Encryption** — TLS for transit, encryption at rest for any persistent data
- **Centralized Audit Logging** — Enterprise logging with tamper-proof storage
- **Application Monitoring** — APM, health checks, alerting
- **Vulnerability Management** — Regular dependency scanning, SAST/DAST
- **Security Testing** — Penetration testing, security reviews
- **Data Retention Policies** — Defined retention periods, automated cleanup
- **Incident Response** — Documented procedures for security incidents
- **Change Management** — Formal review and approval for production changes
- **Environment Segregation** — Separate dev, staging, and production environments
- **HTTPS Enforcement** — All traffic encrypted in transit
- **Rate Limiting** — Protection against abuse and DoS
- **CORS Configuration** — Restrict allowed origins in production

These controls were intentionally excluded because they are outside the examination requirement. Their absence does not indicate unawareness — it indicates appropriate scoping.
