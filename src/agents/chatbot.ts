/**
 * DCBSD Chatbot Agent — Universal Bot Framework & Serverless Messaging Protocol
 * Author: Malcolm Joaquin L. Cuady
 * Role: Principal QA Engineer
 *
 * Provides resilient, zero-dependency Bot Framework Activity dispatching for
 * serverless environments (Vercel) while integrating directly with
 * Microsoft 365 Agents SDK (DCBSDChatbotAgent) in Node runtimes and test runners.
 */

import { handleMessage, handleCardAction, BotResponse } from '../conversation/flow';
import { PROMPTS } from '../conversation/prompts';

// Re-export full Microsoft Agents SDK classes from agentSdk for direct consumer access
export { DCBSDChatbotAgent, AgentsResponseAdapter, processAgentActivity } from './agentSdk';

export interface ActivityContext {
  activity: {
    type: string;
    text?: string;
    conversation?: { id: string };
    membersAdded?: Array<{ id: string }>;
    recipient?: { id: string };
    value?: Record<string, unknown>;
  };
  sendActivity: (message: string | { type: string; text?: string; attachments?: unknown[] }) => Promise<void>;
}

/**
 * Translates BotResponse payloads into standard Bot Framework / Adaptive Card activities.
 */
async function sendResponses(context: ActivityContext, responses: BotResponse[]): Promise<void> {
  for (const response of responses) {
    if (response.adaptiveCard) {
      await context.sendActivity({
        type: 'message',
        text: response.text,
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

function getConversationId(context: ActivityContext): string {
  return context.activity.conversation?.id ?? 'default';
}

/**
 * Handles incoming message activities with support for both text and Adaptive Card Action.Submit.
 */
export async function onMessageActivity(context: ActivityContext): Promise<void> {
  try {
    const conversationId = getConversationId(context);

    // Handle Adaptive Card action submissions (activity.value.action)
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] message_handler_error: ${errorMessage}`);
    await context.sendActivity(PROMPTS.ERROR);
  }
}

/**
 * Handles conversation update events (e.g., user joins the conversation).
 */
export async function onConversationUpdate(context: ActivityContext): Promise<void> {
  try {
    const membersAdded = context.activity.membersAdded ?? [];
    const botId = context.activity.recipient?.id;

    for (const member of membersAdded) {
      if (member.id !== botId) {
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
