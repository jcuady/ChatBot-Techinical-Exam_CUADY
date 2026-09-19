/**
 * EastWest Bank — DCBSD Chatbot Client Controller
 * Author: Malcolm Joaquin L. Cuady (Principal Full-Stack & UI/UX Design Engineer)
 * Standards: UI/UX Pro Max • Bank-Grade Security • WCAG 2.1 AA Compliant
 *
 * Handles chat communication, deterministic state interaction,
 * dynamic contextual quick-suggestions, and safe Adaptive Card rendering.
 *
 * Security: Strict XSS neutralization via textContent, zero client-exposed SDK internals.
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
  const toastContainer = document.getElementById('toast-container');
  const quickChips = document.getElementById('quick-chips');

  // ── State ─────────────────────────────────────────────────

  let conversationId = generateConversationId();
  let isProcessing = false;
  let isInitializing = false;

  function generateConversationId() {
    return 'ew-sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
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
    }, 2600);
  }

  // ── Session Initialization & Reset ────────────────────────

  async function initialize() {
    if (isInitializing) return;
    isInitializing = true;
    if (chatMessages) chatMessages.innerHTML = '';

    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const data = await response.json();
      if (data.responses) {
        let lastText = '';
        let hasCard = false;
        for (const msg of data.responses) {
          if (msg.text) lastText = msg.text;
          if (msg.adaptiveCard) hasCard = true;
          await addBotMessage(msg.text, msg.adaptiveCard);
        }
        updateQuickChips(lastText, hasCard);
      }
    } catch (err) {
      addBotMessage('Unable to connect to the secure banking assistant. Please refresh the page.', null);
    } finally {
      isInitializing = false;
    }

    if (chatInput) chatInput.focus();
  }

  async function resetSession(notify) {
    if (isProcessing) return;
    conversationId = generateConversationId();
    if (chatMessages) chatMessages.innerHTML = '';
    isInitializing = false;
    if (notify !== false) {
      showToast('Starting a new intake session.', 'info');
    }
    await initialize();
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
        let lastText = '';
        let hasCard = false;
        for (const msg of data.responses) {
          if (msg.text) lastText = msg.text;
          if (msg.adaptiveCard) hasCard = true;
          await addBotMessage(msg.text, msg.adaptiveCard);
        }
        updateQuickChips(lastText, hasCard);
      }
    } catch (err) {
      removeTypingIndicator(typingEl);
      addBotMessage('We are temporarily unable to process your request securely. Please try again.', null);
    } finally {
      isProcessing = false;
      if (sendButton) sendButton.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  async function sendCardSubmission(actionText, formData) {
    if (isProcessing) return;

    isProcessing = true;
    if (sendButton) sendButton.disabled = true;

    const summaryText = `Submitted Details:\n• Name: ${formData.name || '—'}\n• Mobile: ${formData.mobile || '—'}\n• Address: ${formData.address || '—'}`;
    addUserMessage(summaryText);

    const typingEl = showTypingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, action: actionText, formData }),
      });

      removeTypingIndicator(typingEl);

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      if (data.responses) {
        let lastText = '';
        let hasCard = false;
        for (const msg of data.responses) {
          if (msg.text) lastText = msg.text;
          if (msg.adaptiveCard) hasCard = true;
          await addBotMessage(msg.text, msg.adaptiveCard);
        }
        updateQuickChips(lastText, hasCard);
      }
    } catch (err) {
      removeTypingIndicator(typingEl);
      addBotMessage('We are temporarily unable to process your card submission. Please try again.', null);
    } finally {
      isProcessing = false;
      if (sendButton) sendButton.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  // ── Message DOM Rendering ─────────────────────────────────

  function addUserMessage(text) {
    if (!chatMessages) return;
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
    if (!chatMessages) return;
    await delay(240);

    const item = document.createElement('div');
    item.className = 'message-item message-item--bot';
    item.setAttribute('role', 'listitem');

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar message-avatar--bot';
    avatar.setAttribute('aria-hidden', 'true');
    const avatarImg = document.createElement('img');
    avatarImg.src = 'assets/eastwest-icon.png';
    avatarImg.alt = 'EastWest';
    avatarImg.className = 'avatar-brand-img';
    avatar.appendChild(avatarImg);

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
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Convert **bold** to <strong> and newlines to <br>
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
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
          const inputFields = container.querySelectorAll('.card-input-field');

          if (inputFields.length > 0 && action.data?.action === 'submit_intake_form') {
            const formData = {};
            inputFields.forEach(function (input) {
              formData[input.name] = input.value.trim();
            });
            sendCardSubmission(actionText, formData);
          } else {
            sendMessage(actionText);
          }

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
        } else if (element.color === 'Attention') {
          el.className = 'card-title card-title--error';
        } else if (element.weight === 'Bolder' && !element.color) {
          el.className = 'card-question';
        } else if (element.isSubtle) {
          el.className = 'card-subtle-text';
        } else {
          el.className = 'card-subtitle';
        }

        return el;
      }

      case 'Input.Text': {
        const group = document.createElement('div');
        group.className = 'card-input-group';

        const isMultiline = Boolean(element.isMultiline);
        const field = isMultiline
          ? document.createElement('textarea')
          : document.createElement('input');

        if (!isMultiline) {
          field.type = element.id === 'mobile' ? 'tel' : 'text';
        } else {
          field.rows = 2;
        }

        field.className = 'card-input-field' + (isMultiline ? ' card-input-field--multiline' : '');
        field.name = element.id;
        field.id = 'card-field-' + element.id;
        if (element.placeholder) field.placeholder = element.placeholder;
        if (element.value) field.value = element.value;
        if (element.isRequired) field.required = true;

        group.appendChild(field);
        return group;
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
    if (!chatMessages) return null;
    const item = document.createElement('div');
    item.className = 'message-item message-item--bot typing-item';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar message-avatar--bot';
    avatar.setAttribute('aria-hidden', 'true');
    const avatarImg = document.createElement('img');
    avatarImg.src = 'assets/eastwest-icon.png';
    avatarImg.alt = 'EastWest';
    avatarImg.className = 'avatar-brand-img';
    avatar.appendChild(avatarImg);

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

  // ── Dynamic Context-Aware Quick Response Suggestions ─────

  function updateQuickChips(promptText, hasCard) {
    if (!quickChips) return;
    const lower = (promptText || '').toLowerCase();

    let suggestions = [];

    if (hasCard || lower.includes('confirm') || lower.includes('submit') || lower.includes('look correct') || lower.includes('collected')) {
      suggestions = [
        { label: 'Yes, submit', icon: '✓', fill: 'Yes, submit', primary: true },
        { label: 'Start over', icon: '↺', fill: 'Start over', secondary: true },
      ];
    } else if (lower.includes('name') || lower.includes('what is your name')) {
      suggestions = [
        { label: 'Juan Dela Cruz', icon: '👤', fill: 'Juan Dela Cruz' },
        { label: 'Maria Santos', icon: '👤', fill: 'Maria Santos' },
        { label: 'Fill Form Card', icon: '📋', fill: 'Open Intake Form', primary: true },
        { label: 'Restart Flow', icon: '↺', action: 'reset-session' },
      ];
    } else if (lower.includes('mobile') || lower.includes('phone') || lower.includes('contact number') || lower.includes('09')) {
      suggestions = [
        { label: '0917 123 4567', icon: '📱', fill: '09171234567' },
        { label: '0918 765 4321', icon: '📱', fill: '09187654321' },
        { label: '+63 917 123 4567', icon: '🌐', fill: '+63 917 123 4567' },
        { label: 'Start over', icon: '↺', action: 'reset-session' },
      ];
    } else if (lower.includes('address') || lower.includes('residential') || lower.includes('where')) {
      suggestions = [
        { label: '123 Ayala Avenue, Makati City', icon: '📍', fill: '123 Ayala Avenue, Makati City' },
        { label: 'Unit 502, BGC, Taguig City', icon: '📍', fill: 'Unit 502, BGC, Taguig City' },
        { label: 'Ortigas Center, Pasig City', icon: '📍', fill: 'Ortigas Center, Pasig City' },
        { label: 'Start over', icon: '↺', action: 'reset-session' },
      ];
    } else if (lower.includes('successfully submitted') || lower.includes('thank you') || lower.includes('completed')) {
      suggestions = [
        { label: 'New Application', icon: '🔄', action: 'reset-session', primary: true },
      ];
    } else {
      suggestions = [
        { label: 'Juan Dela Cruz', icon: '👤', fill: 'Juan Dela Cruz' },
        { label: 'Fill Form Card', icon: '📋', fill: 'Open Intake Form', primary: true },
        { label: 'Start over', icon: '↺', action: 'reset-session' },
      ];
    }

    quickChips.innerHTML = '';
    for (const item of suggestions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-chip';
      if (item.primary) btn.classList.add('quick-chip--primary');
      if (item.secondary) btn.classList.add('quick-chip--secondary');

      if (item.action) btn.setAttribute('data-action', item.action);
      if (item.fill) btn.setAttribute('data-fill', item.fill);

      const iconSpan = document.createElement('span');
      iconSpan.className = 'chip-icon';
      iconSpan.textContent = item.icon;

      btn.appendChild(iconSpan);
      btn.appendChild(document.createTextNode(' ' + item.label));
      quickChips.appendChild(btn);
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function updateCharCount() {
    if (!chatInput || !charCount) return;
    const len = chatInput.value.length;
    charCount.textContent = len + '/1000';
  }

  // ── Event Bindings ────────────────────────────────────────

  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (chatInput) sendMessage(chatInput.value);
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

  // Quick Action Chips Delegation
  if (quickChips) {
    quickChips.addEventListener('click', function (e) {
      const chip = e.target.closest('.quick-chip');
      if (!chip) return;

      const action = chip.getAttribute('data-action');
      const fillText = chip.getAttribute('data-fill');

      if (action === 'reset-session') {
        resetSession(true);
      } else if (fillText) {
        sendMessage(fillText);
      }
    });
  }

  // ── Launch on DOM Ready ───────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
