/**
 * DCBSD Chatbot Agent — Microsoft 365 Agents SDK integration.
 *
 * This module connects the conversation flow engine to the Microsoft
 * Agents SDK infrastructure. The SDK provides the agent/conversational
 * infrastructure; the business workflow itself is intentionally
 * deterministic because the examination requirement is deterministic.
 *
 * The agent handles:
 * - Incoming text messages → routed to conversation flow engine
 * - Adaptive Card action submissions → routed to card action handler
 * - Conversation update events → welcome message on member added
 * - Error handling → safe user-facing messages, diagnostic-only logging
 */

import { handleMessage, handleCardAction, BotResponse } from '../conversation/flow';
import { PROMPTS } from '../conversation/prompts';

/**
 * Activity handler interface compatible with Microsoft Agents SDK.
 * Processes incoming activities and produces responses.
 */
export interface ActivityContext {
  activity: {
    type: string;
    text?: string;
    conversation?: { id: string };
    membersAdded?: Array<{ id: string }>;
    recipient?: { id: string };
    value?: Record<string, unknown>;
  };
  sendActivity: (text: string | { type: string; attachments?: unknown[] }) => Promise<void>;
}

/** Sends bot responses (text and/or Adaptive Cards) to the user. */
async function sendResponses(context: ActivityContext, responses: BotResponse[]): Promise<void> {
  for (const response of responses) {
    if (response.adaptiveCard) {
      await context.sendActivity({
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: response.adaptiveCard,
          },
        ],
      });
    } else if (response.text) {
      await context.sendActivity(response.text);
    }
  }
}

/** Extracts a stable conversation ID from the activity context. */
function getConversationId(context: ActivityContext): string {
  return context.activity.conversation?.id ?? 'default';
}

/**
 * Handles an incoming message activity.
 * Routes text messages and card action submissions to the flow engine.
 */
export async function onMessageActivity(context: ActivityContext): Promise<void> {
  try {
    const conversationId = getConversationId(context);

    // Handle Adaptive Card action submissions
    if (context.activity.value && typeof context.activity.value === 'object') {
      const actionData = context.activity.value as Record<string, unknown>;
      if (typeof actionData.action === 'string') {
        const responses = handleCardAction(conversationId, actionData.action);
        await sendResponses(context, responses);
        return;
      }
    }

    // Handle regular text messages
    const text = context.activity.text ?? '';
    const responses = handleMessage(conversationId, text);
    await sendResponses(context, responses);
  } catch (error: unknown) {
    // Safe error message to user — no internals exposed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] message_handler_error: ${errorMessage}`);
    await context.sendActivity(PROMPTS.ERROR);
  }
}

/**
 * Handles conversation update events (e.g., user joins the conversation).
 * Sends the welcome message sequence.
 */
export async function onConversationUpdate(context: ActivityContext): Promise<void> {
  try {
    const membersAdded = context.activity.membersAdded ?? [];
    const botId = context.activity.recipient?.id;

    for (const member of membersAdded) {
      // Only greet non-bot members
      if (member.id !== botId) {
        const conversationId = getConversationId(context);
        // eslint-disable-next-line no-console
        console.warn(`[${new Date().toISOString()}] conversation_started conversation=${conversationId}`);

        for (const text of PROMPTS.WELCOME) {
          await context.sendActivity(text);
        }
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] conversation_update_error: ${errorMessage}`);
  }
}
