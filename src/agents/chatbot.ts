/**
 * DCBSD Chatbot Agent — Official Microsoft 365 Agents SDK Implementation
 * Author: Malcolm Joaquin L. Cuady
 *
 * Direct subclass of Microsoft Agents SDK ActivityHandler.
 * Utilizes TurnContext, CardFactory, MessageFactory, and Activity from:
 *   - @microsoft/agents-hosting (v1.8.1)
 *   - @microsoft/agents-activity (v1.8.1)
 */

import {
  ActivityHandler,
  CardFactory,
  MessageFactory,
  TurnContext,
  BaseAdapter,
} from '@microsoft/agents-hosting';
import { Activity } from '@microsoft/agents-activity';
import { handleMessage, handleCardAction, BotResponse } from '../conversation/flow';
import { PROMPTS } from '../conversation/prompts';

/**
 * Enterprise Banking Agent subclassing Microsoft Agents SDK ActivityHandler.
 * Fully integrates event-driven turn pipeline with deterministic conversation flow.
 */
export class DCBSDChatbotAgent extends ActivityHandler {
  constructor() {
    super();

    // 1. Message Activity Handler
    this.onMessage(async (context: TurnContext, next: () => Promise<void>) => {
      const conversationId = context.activity.conversation?.id ?? 'default';

      // Handle Adaptive Card action submissions (Action.Submit payload)
      if (context.activity.value && typeof context.activity.value === 'object') {
        const actionData = context.activity.value as Record<string, unknown>;
        if (typeof actionData.action === 'string') {
          const responses = handleCardAction(conversationId, actionData.action);
          await this.dispatchResponses(context, responses);
          await next();
          return;
        }
      }

      // Handle standard text message
      const text = context.activity.text ?? '';
      const responses = handleMessage(conversationId, text);
      await this.dispatchResponses(context, responses);
      await next();
    });

    // 2. Conversation Update / Members Added Handler
    this.onMembersAdded(async (context: TurnContext, next: () => Promise<void>) => {
      const membersAdded = context.activity.membersAdded ?? [];
      const botId = context.activity.recipient?.id;

      for (const member of membersAdded) {
        if (member.id !== botId) {
          for (const promptText of PROMPTS.WELCOME) {
            await context.sendActivity(MessageFactory.text(promptText));
          }
        }
      }
      await next();
    });
  }

  /**
   * Translates internal BotResponse objects into official Microsoft Agents SDK Activities.
   */
  private async dispatchResponses(context: TurnContext, responses: BotResponse[]): Promise<void> {
    for (const response of responses) {
      if (response.adaptiveCard) {
        // Construct official Adaptive Card Attachment using Microsoft CardFactory
        const cardAttachment = CardFactory.adaptiveCard(response.adaptiveCard);
        await context.sendActivity(MessageFactory.attachment(cardAttachment, response.text));
      } else if (response.text) {
        // Construct official Message Activity using Microsoft MessageFactory
        await context.sendActivity(MessageFactory.text(response.text));
      }
    }
  }
}

/**
 * In-memory response capturing adapter implementing BaseAdapter from @microsoft/agents-hosting.
 * Routes TurnContext activities to HTTP response payloads.
 */
export class AgentsResponseAdapter extends BaseAdapter {
  public sentActivities: Activity[] = [];

  async sendActivities(_context: TurnContext, activities: Activity[]) {
    this.sentActivities.push(...activities);
    return activities.map((_a, i) => ({ id: `res-${Date.now()}-${i}` }));
  }

  async updateActivity() {}
  async deleteActivity() {}
  async continueConversation() {}
  async uploadAttachment() { return { id: '' }; }
  async getAttachmentInfo() { return { name: '', type: '', views: [] }; }
  async getAttachment(): Promise<NodeJS.ReadableStream> {
    throw new Error('Not implemented');
  }
}

/**
 * Helper function for processing incoming Bot Framework Activity payloads through
 * the full Microsoft Agents SDK TurnContext and ActivityHandler pipeline.
 */
export async function processAgentActivity(rawActivity: unknown): Promise<Activity[]> {
  const adapter = new AgentsResponseAdapter();
  const agent = new DCBSDChatbotAgent();

  const rawObj = (rawActivity && typeof rawActivity === 'object' ? rawActivity : {}) as Record<string, unknown>;
  const normalizedActivity: Record<string, unknown> = {
    channelId: 'emulator',
    serviceUrl: 'https://dcbsd-chatbot-simulation.vercel.app',
    from: { id: 'default-user', name: 'User' },
    recipient: { id: 'bot-dcbsd', name: 'DCBSD Assistant' },
    conversation: { id: 'default-conversation' },
    ...rawObj,
  };

  if (rawObj.conversation && typeof rawObj.conversation === 'object') {
    normalizedActivity.conversation = {
      id: (rawObj.conversation as { id?: string }).id ?? 'default-conversation',
      ...(rawObj.conversation as object),
    };
  }
  if (rawObj.recipient && typeof rawObj.recipient === 'object') {
    normalizedActivity.recipient = {
      id: (rawObj.recipient as { id?: string }).id ?? 'bot-dcbsd',
      name: (rawObj.recipient as { name?: string }).name ?? 'DCBSD Assistant',
      ...(rawObj.recipient as object),
    };
  }
  if (rawObj.from && typeof rawObj.from === 'object') {
    normalizedActivity.from = {
      id: (rawObj.from as { id?: string }).id ?? 'default-user',
      name: (rawObj.from as { name?: string }).name ?? 'User',
      ...(rawObj.from as object),
    };
  }

  const activity = Activity.fromObject(normalizedActivity);
  const turnContext = new TurnContext(adapter, activity);

  await agent.run(turnContext);
  return adapter.sentActivities;
}

/**
 * Backward compatibility interface for lightweight contexts.
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
  sendActivity: (message: string | { type: string; attachments?: unknown[] }) => Promise<void>;
}

export async function onMessageActivity(context: ActivityContext): Promise<void> {
  const responses = await processAgentActivity(context.activity);
  for (const resp of responses) {
    if (resp.attachments && resp.attachments.length > 0) {
      await context.sendActivity({
        type: 'message',
        attachments: resp.attachments,
      });
    } else if (resp.text) {
      await context.sendActivity(resp.text);
    }
  }
}

export async function onConversationUpdate(context: ActivityContext): Promise<void> {
  const responses = await processAgentActivity(context.activity);
  for (const resp of responses) {
    if (resp.text) {
      await context.sendActivity(resp.text);
    }
  }
}
