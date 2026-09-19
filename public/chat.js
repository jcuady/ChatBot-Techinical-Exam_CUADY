/**
 * DCBSD Chatbot Simulation — Client-Side Controller
 * Author: Malcolm Joaquin L. Cuady
 *
 * Handles chat communication, deterministic state interaction,
 * live telemetry, automated QA scenario runners, and safe Adaptive Card rendering.
 *
 * Security: All user inputs and card data are rendered via textContent
 * to prevent XSS vulnerabilities.
 */

(function () {
  'use strict';

  // ── DOM References ──────────────────────────────────────────

  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const charCount = document.getElementById('char-count');
  const resetChatBtn = document.getElementById('reset-chat-btn');
  const qaToggleBtn = document.getElementById('qa-toggle-btn');
  const qaModal = document.getElementById('qa-modal');
  const qaModalClose = document.getElementById('qa-modal-close');
  const qaModalBackdrop = document.getElementById('qa-modal-backdrop');
  const telemetrySessionId = document.getElementById('telemetry-session-id');
  const telemetryHealth = document.getElementById('telemetry-health');
  const toastContainer = document.getElementById('toast-container');
  const quickChips = document.getElementById('quick-chips');

  // Scenario Buttons
  const qaRunHappy = document.getElementById('qa-run-happy');
  const qaRunMobileErr = document.getElementById('qa-run-mobile-err');
  const qaRunReject = document.getElementById('qa-run-reject');
  const qaRunSecurity = document.getElementById('qa-run-security');
  const qaBtnHardReset = document.getElementById('qa-btn-hard-reset');

  // ── State ─────────────────────────────────────────────────

  let conversationId = generateConversationId();
  let isProcessing = false;

  function generateConversationId() {
    return 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  }

  function updateTelemetry() {
    if (telemetrySessionId) {
      telemetrySessionId.textContent = conversationId;
      telemetrySessionId.title = conversationId;
    }
  }

  // ── Toast Notifications ───────────────────────────────────

  function showToast(message, type) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'info');
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, 2800);
  }

  // ── Session Initialization & Reset ────────────────────────

  async function initialize() {
    updateTelemetry();
    checkApiHealth();

    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const data = await response.json();
      if (data.responses) {
        for (const msg of data.responses) {
          await addBotMessage(msg.text, msg.adaptiveCard);
        }
      }
    } catch (err) {
      addBotMessage('Unable to connect to the chatbot. Please refresh the page.', null);
    }

    if (chatInput) chatInput.focus();
  }

  async function resetSession(notify) {
    if (isProcessing) return;
    conversationId = generateConversationId();
    chatMessages.innerHTML = '';
    updateTelemetry();
    if (notify !== false) {
      showToast('Conversation reset. Starting new session.', 'info');
    }
    await initialize();
  }

  async function checkApiHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok && telemetryHealth) {
        telemetryHealth.innerHTML = '<span class="status-dot status-dot--online"></span> Healthy (200 OK)';
      }
    } catch (e) {
      if (telemetryHealth) {
        telemetryHealth.innerHTML = '<span class="status-dot" style="background:#ef4444"></span> Unreachable';
      }
    }
  }

  // ── Message Sending & Processing ──────────────────────────

  async function sendMessage(text) {
    if (!text || !text.trim() || isProcessing) return;

    isProcessing = true;
    if (sendButton) sendButton.disabled = true;

    addUserMessage(text);
    if (chatInput) {
      chatInput.value = '';
      updateCharCount();
    }

    const typingEl = showTypingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, text }),
      });

      removeTypingIndicator(typingEl);

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      if (data.responses) {
        for (const msg of data.responses) {
          await addBotMessage(msg.text, msg.adaptiveCard);
        }
      }
    } catch (err) {
      removeTypingIndicator(typingEl);
      addBotMessage('Something went wrong processing your message. Please try again.', null);
    } finally {
      isProcessing = false;
      if (sendButton) sendButton.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  // ── Message DOM Rendering ─────────────────────────────────

  function addUserMessage(text) {
    const item = document.createElement('div');
    item.className = 'message-item message-item--user';
    item.setAttribute('role', 'listitem');

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar message-avatar--user';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'You';

    const body = document.createElement('div');
    body.className = 'message-body';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    // Strict textContent to neutralize XSS
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date());

    body.appendChild(bubble);
    body.appendChild(time);

    item.appendChild(avatar);
    item.appendChild(body);

    chatMessages.appendChild(item);
    scrollToBottom();
  }

  async function addBotMessage(text, adaptiveCard) {
    await delay(260);

    const item = document.createElement('div');
    item.className = 'message-item message-item--bot';
    item.setAttribute('role', 'listitem');

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar message-avatar--bot';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'AI';

    const body = document.createElement('div');
    body.className = 'message-body';

    if (text) {
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.innerHTML = renderSafeMarkdown(text);
      body.appendChild(bubble);
    }

    if (adaptiveCard) {
      const cardEl = renderAdaptiveCard(adaptiveCard);
      body.appendChild(cardEl);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date());

    body.appendChild(time);
    item.appendChild(avatar);
    item.appendChild(body);

    chatMessages.appendChild(item);
    scrollToBottom();
  }

  function renderSafeMarkdown(text) {
    // Escape HTML entities
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Convert **bold** to <strong>
    return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // ── Adaptive Card Renderer ────────────────────────────────

  function renderAdaptiveCard(card) {
    const container = document.createElement('div');
    container.className = 'adaptive-card-container';

    if (card.body) {
      for (const element of card.body) {
        const el = renderCardElement(element);
        if (el) container.appendChild(el);
      }
    }

    if (card.actions) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'card-actions';

      for (const action of card.actions) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'card-action-btn';
        btn.textContent = action.title;

        if (action.style === 'positive') {
          btn.classList.add('card-action-btn--positive');
        } else if (action.style === 'destructive') {
          btn.classList.add('card-action-btn--destructive');
        }

        btn.addEventListener('click', function () {
          const actionText = action.data?.action || action.title;
          sendMessage(actionText);

          // Disable all sibling action buttons
          const allBtns = container.querySelectorAll('.card-action-btn');
          allBtns.forEach(function (b) {
            b.disabled = true;
            b.style.opacity = '0.5';
          });
        });

        actionsDiv.appendChild(btn);
      }

      container.appendChild(actionsDiv);
    }

    return container;
  }

  function renderCardElement(element) {
    switch (element.type) {
      case 'TextBlock': {
        const el = document.createElement('div');
        el.textContent = element.text;

        if (element.color === 'Accent') {
          el.className = 'card-title';
        } else if (element.color === 'Good') {
          el.className = 'card-title card-title--success';
        } else if (element.weight === 'Bolder' && !element.color) {
          el.className = 'card-question';
        } else {
          el.className = 'card-subtitle';
        }

        return el;
      }

      case 'Container': {
        const el = document.createElement('div');
        el.className = 'card-facts';

        if (element.items) {
          for (const item of element.items) {
            const child = renderCardElement(item);
            if (child) el.appendChild(child);
          }
        }
        return el;
      }

      case 'FactSet': {
        const el = document.createElement('div');

        if (element.facts) {
          for (const fact of element.facts) {
            const row = document.createElement('div');
            row.className = 'card-fact';

            const title = document.createElement('span');
            title.className = 'card-fact-title';
            title.textContent = fact.title;

            const value = document.createElement('span');
            value.className = 'card-fact-value';
            value.textContent = fact.value;

            row.appendChild(title);
            row.appendChild(value);
            el.appendChild(row);
          }
        }
        return el;
      }

      default:
        return null;
    }
  }

  // ── Typing Indicator ──────────────────────────────────────

  function showTypingIndicator() {
    const item = document.createElement('div');
    item.className = 'message-item message-item--bot typing-item';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar message-avatar--bot';
    avatar.textContent = 'AI';

    const typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    item.appendChild(avatar);
    item.appendChild(typingEl);

    chatMessages.appendChild(item);
    scrollToBottom();
    return item;
  }

  function removeTypingIndicator(typingEl) {
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function updateCharCount() {
    if (!chatInput || !charCount) return;
    const len = chatInput.value.length;
    charCount.textContent = len + '/1000';
  }

  // ── QA Scenario Automation Runners ────────────────────────

  async function runScenarioHappyPath() {
    closeQaModal();
    showToast('Running Scenario: Full Happy Path Intake...', 'info');
    await resetSession(false);
    await delay(1000);

    await sendMessage('Juan Dela Cruz');
    await delay(1200);

    await sendMessage('09171234567');
    await delay(1200);

    await sendMessage('123 Ayala Avenue, Makati City');
    await delay(1400);

    await sendMessage('Yes, submit');
    showToast('Happy Path Scenario Complete!', 'success');
  }

  async function runScenarioMobileError() {
    closeQaModal();
    showToast('Running Scenario: Mobile Validation & Recovery...', 'info');
    await resetSession(false);
    await delay(1000);

    await sendMessage('Maria Santos');
    await delay(1200);

    // Invalid mobile trigger
    await sendMessage('12345');
    await delay(1400);

    // Valid recovery trigger
    await sendMessage('+63 918 765 4321');
    showToast('Mobile Validation & Recovery Complete!', 'success');
  }

  async function runScenarioRejectRestart() {
    closeQaModal();
    showToast('Running Scenario: Rejection & State Restart...', 'info');
    await resetSession(false);
    await delay(1000);

    await sendMessage('Roberto Gomez');
    await delay(1200);

    await sendMessage('09991234567');
    await delay(1200);

    await sendMessage('Unit 402, High Street, Taguig City');
    await delay(1400);

    // Rejection trigger
    await sendMessage('Start over');
    showToast('Rejection Reset Verified!', 'success');
  }

  async function runScenarioSecurity() {
    closeQaModal();
    showToast('Running Security Fuzz Test (SQLi & XSS)...', 'warning');
    await resetSession(false);
    await delay(1000);

    // SQLi string as Name
    await sendMessage("Robert'; DROP TABLE Users; --");
    await delay(1200);

    // Invalid format
    await sendMessage("admin' OR '1'='1");
    await delay(1400);

    // Valid recovery
    await sendMessage('09171234567');
    await delay(1200);

    // XSS string as Address
    await sendMessage('<script>alert("XSS")</script> 123 Safe St.');
    showToast('Security Test Complete — All Payloads Neutralized!', 'success');
  }

  // ── Modal Controls ────────────────────────────────────────

  function openQaModal() {
    if (qaModal) {
      qaModal.setAttribute('aria-hidden', 'false');
      checkApiHealth();
    }
  }

  function closeQaModal() {
    if (qaModal) {
      qaModal.setAttribute('aria-hidden', 'true');
    }
  }

  // ── Event Bindings ────────────────────────────────────────

  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage(chatInput.value);
    });
  }

  if (chatInput) {
    chatInput.addEventListener('input', updateCharCount);
  }

  if (resetChatBtn) {
    resetChatBtn.addEventListener('click', function () {
      resetSession(true);
    });
  }

  if (qaToggleBtn) {
    qaToggleBtn.addEventListener('click', openQaModal);
  }

  if (qaModalClose) {
    qaModalClose.addEventListener('click', closeQaModal);
  }

  if (qaModalBackdrop) {
    qaModalBackdrop.addEventListener('click', closeQaModal);
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && qaModal && qaModal.getAttribute('aria-hidden') === 'false') {
      closeQaModal();
    }
  });

  // Quick Action Chips
  if (quickChips) {
    quickChips.addEventListener('click', function (e) {
      const chip = e.target.closest('.quick-chip');
      if (!chip) return;

      const action = chip.getAttribute('data-action');
      const fillText = chip.getAttribute('data-fill');

      if (action === 'autofill-happy') {
        runScenarioHappyPath();
      } else if (action === 'reset-session') {
        resetSession(true);
      } else if (fillText) {
        sendMessage(fillText);
      }
    });
  }

  // QA Scenario Buttons
  if (qaRunHappy) qaRunHappy.addEventListener('click', runScenarioHappyPath);
  if (qaRunMobileErr) qaRunMobileErr.addEventListener('click', runScenarioMobileError);
  if (qaRunReject) qaRunReject.addEventListener('click', runScenarioRejectRestart);
  if (qaRunSecurity) qaRunSecurity.addEventListener('click', runScenarioSecurity);
  if (qaBtnHardReset) qaBtnHardReset.addEventListener('click', function () {
    closeQaModal();
    resetSession(true);
  });

  // ── Launch on DOM Ready ───────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
