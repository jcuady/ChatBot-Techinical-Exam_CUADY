/**
 * DCBSD Chatbot — Client-Side Chat Logic
 *
 * Handles message send/receive with the server, renders bot and user
 * messages safely (no innerHTML with raw input), supports Adaptive
 * Card rendering, and provides a responsive, accessible experience.
 *
 * Security: All user-provided text is rendered via textContent, never
 * innerHTML, to prevent XSS. Adaptive Cards are rendered from
 * server-controlled JSON only.
 */

(function () {
  'use strict';

  // ── DOM Elements ──────────────────────────────────────────

  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  // ── State ─────────────────────────────────────────────────

  const conversationId = 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  let isProcessing = false;

  // ── Initialization ────────────────────────────────────────

  async function initialize() {
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

    chatInput.focus();
  }

  // ── Message Sending ───────────────────────────────────────

  async function sendMessage(text) {
    if (!text.trim() || isProcessing) return;

    isProcessing = true;
    sendButton.disabled = true;

    addUserMessage(text);
    chatInput.value = '';

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
      addBotMessage('Something went wrong. Please try again.', null);
    } finally {
      isProcessing = false;
      sendButton.disabled = false;
      chatInput.focus();
    }
  }

  // ── Message Rendering ─────────────────────────────────────

  function addUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message message--user';
    wrapper.setAttribute('role', 'listitem');

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    // Safe rendering: textContent, never innerHTML
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date());

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  async function addBotMessage(text, adaptiveCard) {
    // Small delay between multiple bot messages for natural feel
    await delay(300);

    const wrapper = document.createElement('div');
    wrapper.className = 'message message--bot';
    wrapper.setAttribute('role', 'listitem');

    if (text) {
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      // Render markdown-like bold text safely
      bubble.innerHTML = renderSafeMarkdown(text);
      wrapper.appendChild(bubble);
    }

    if (adaptiveCard) {
      const cardEl = renderAdaptiveCard(adaptiveCard);
      wrapper.appendChild(cardEl);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(new Date());

    wrapper.appendChild(time);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
  }

  /**
   * Renders limited markdown (bold only) safely.
   * Does NOT use innerHTML with user input — only server-controlled text.
   */
  function renderSafeMarkdown(text) {
    // Escape HTML entities first
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Convert **bold** to <strong>
    return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // ── Adaptive Card Rendering ───────────────────────────────

  function renderAdaptiveCard(card) {
    const container = document.createElement('div');
    container.className = 'adaptive-card-container';

    // Parse the card JSON and render manually
    // (avoids heavy Adaptive Cards JS library dependency)
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
          // Disable all card buttons after click
          const buttons = container.querySelectorAll('.card-action-btn');
          buttons.forEach(function (b) { b.disabled = true; b.style.opacity = '0.5'; });
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
        // Safe rendering of server-controlled card text
        el.textContent = element.text;

        if (element.weight === 'Bolder') el.style.fontWeight = '700';
        if (element.size === 'Medium') el.style.fontSize = '1.125rem';

        if (element.color === 'Accent') {
          el.className = 'card-title';
        } else if (element.color === 'Good') {
          el.className = 'card-title';
          el.style.color = '#38a169';
        } else if (element.weight === 'Bolder' && !element.color) {
          el.className = 'card-question';
        } else {
          el.className = 'card-subtitle';
        }

        if (element.spacing === 'Small') el.style.marginTop = '4px';
        if (element.spacing === 'Medium') el.style.marginTop = '16px';

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
    const wrapper = document.createElement('div');
    wrapper.className = 'message message--bot';
    wrapper.id = 'typing-indicator';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.setAttribute('aria-label', 'Bot is typing');

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'typing-dot';
      indicator.appendChild(dot);
    }

    wrapper.appendChild(indicator);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  function removeTypingIndicator(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // ── Utilities ─────────────────────────────────────────────

  function scrollToBottom() {
    requestAnimationFrame(function () {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  // ── Event Listeners ───────────────────────────────────────

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = chatInput.value;
    if (text.trim()) {
      sendMessage(text);
    }
  });

  // Enter to send (without shift)
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // ── Start ─────────────────────────────────────────────────

  initialize();
})();
