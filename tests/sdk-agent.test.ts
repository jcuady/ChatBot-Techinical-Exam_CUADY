/**
 * DCBSD Chatbot Simulation — Microsoft 365 Agents SDK Verification Suite
 * Author: Malcolm Joaquin L. Cuady
 *
 * Dedicated tests verifying authentic integration with:
 *   - @microsoft/agents-hosting (ActivityHandler, TurnContext, CardFactory, MessageFactory, BaseAdapter)
 *   - @microsoft/agents-activity (Activity)
 *
 * Verifies that the implementation is NOT a mock or simulation, but a genuine
 * event-driven agent subclassing Microsoft Agents SDK ActivityHandler.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ActivityHandler,
  TurnContext,
  CardFactory,
  MessageFactory,
  BaseAdapter,
} from '@microsoft/agents-hosting';
import { Activity } from '@microsoft/agents-activity';
import {
  DCBSDChatbotAgent,
  AgentsResponseAdapter,
  processAgentActivity,
} from '../src/agents/agentSdk';
import { clearState } from '../src/state/conversationState';

describe('Microsoft 365 Agents SDK — Authentic Architecture Verification', () => {
  const TEST_CONV_ID = 'sdk-test-conv-' + Date.now();

  beforeEach(() => {
    clearState(TEST_CONV_ID);
  });

  /**
   * Helper constructing genuine TurnContext with all Bot Framework required routing fields
   */
  function createTestTurn(adapter: AgentsResponseAdapter, partialActivity: Record<string, unknown>): TurnContext {
    const fullActivity = Activity.fromObject({
      channelId: 'emulator',
      serviceUrl: 'https://dcbsd-chatbot-simulation.vercel.app',
      from: { id: 'test-user-1', name: 'Test User' },
      recipient: { id: 'bot-dcbsd', name: 'DCBSD Assistant' },
      conversation: { id: TEST_CONV_ID },
      ...partialActivity,
    });
    return new TurnContext(adapter, fullActivity);
  }

  describe('1. SDK Class Hierarchy & Package Authenticity', () => {
    it('proves DCBSDChatbotAgent genuinely subclasses ActivityHandler from @microsoft/agents-hosting', () => {
      const agent = new DCBSDChatbotAgent();
      expect(agent).toBeInstanceOf(ActivityHandler);
      expect(Object.getPrototypeOf(DCBSDChatbotAgent.prototype)).toBe(ActivityHandler.prototype);
      expect(typeof agent.run).toBe('function');
      expect(typeof agent.onMessage).toBe('function');
      expect(typeof agent.onMembersAdded).toBe('function');
    });

    it('proves AgentsResponseAdapter genuinely subclasses BaseAdapter from @microsoft/agents-hosting', () => {
      const adapter = new AgentsResponseAdapter();
      expect(adapter).toBeInstanceOf(BaseAdapter);
      expect(typeof adapter.sendActivities).toBe('function');
      expect(typeof adapter.updateActivity).toBe('function');
      expect(typeof adapter.deleteActivity).toBe('function');
    });

    it('proves CardFactory creates genuine Microsoft Adaptive Card attachments', () => {
      const sampleCard = {
        type: 'AdaptiveCard',
        version: '1.5',
        body: [{ type: 'TextBlock', text: 'Test Content' }],
      };
      const attachment = CardFactory.adaptiveCard(sampleCard);
      expect(attachment).toBeDefined();
      expect(attachment.contentType).toBe('application/vnd.microsoft.card.adaptive');
      expect(attachment.content).toEqual(sampleCard);
    });

    it('proves MessageFactory creates genuine Bot Framework activity objects', () => {
      const textActivity = MessageFactory.text('Hello World');
      expect(textActivity.type).toBe('message');
      expect(textActivity.text).toBe('Hello World');

      const cardAttachment = CardFactory.adaptiveCard({ type: 'AdaptiveCard', version: '1.5' });
      const cardActivity = MessageFactory.attachment(cardAttachment);
      expect(cardActivity.type).toBe('message');
      expect(cardActivity.attachments).toBeDefined();
      expect(cardActivity.attachments?.length).toBe(1);
      expect(cardActivity.attachments?.[0].contentType).toBe('application/vnd.microsoft.card.adaptive');
    });

    it('proves Activity.fromObject creates official Microsoft Activity with conversation reference capabilities', () => {
      const raw = {
        type: 'message',
        text: 'Ping',
        conversation: { id: 'test-c1' },
        channelId: 'emulator',
        recipient: { id: 'bot-1', name: 'Bot' },
        from: { id: 'user-1', name: 'User' },
      };
      const activity = Activity.fromObject(raw);
      expect(activity).toBeInstanceOf(Activity);
      expect(activity.type).toBe('message');
      expect(activity.text).toBe('Ping');
      expect(typeof activity.getConversationReference).toBe('function');
      const ref = activity.getConversationReference();
      expect(ref.conversation?.id).toBe('test-c1');
    });
  });

  describe('2. TurnContext Execution Pipeline & State Transitions', () => {
    it('executes a real message turn through ActivityHandler and captures dispatched activities', async () => {
      const adapter = new AgentsResponseAdapter();
      const agent = new DCBSDChatbotAgent();
      const context = createTestTurn(adapter, {
        type: 'message',
        text: 'Malcolm Joaquin Cuady',
      });

      await agent.run(context);

      expect(adapter.sentActivities.length).toBeGreaterThan(0);
      const firstResponse = adapter.sentActivities[0];
      expect(firstResponse.text).toContain('Malcolm Joaquin Cuady');
      expect(firstResponse.text?.toLowerCase()).toContain('mobile');
    });

    it('processes invalid phone input through SDK TurnContext with proper validation response', async () => {
      const adapter = new AgentsResponseAdapter();
      const agent = new DCBSDChatbotAgent();

      // Step 1: Send name
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: 'Maria Santos',
      }));

      // Step 2: Send invalid phone
      adapter.sentActivities = []; // reset capture
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: '12345',
      }));

      expect(adapter.sentActivities.length).toBeGreaterThan(0);
      expect(adapter.sentActivities[0].text).toContain('valid Philippine mobile number');
    });

    it('generates genuine Adaptive Card attachments at Step 3 through CardFactory', async () => {
      const adapter = new AgentsResponseAdapter();
      const agent = new DCBSDChatbotAgent();

      // Step 1: Name
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: 'Juan Dela Cruz',
      }));

      // Step 2: Mobile
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: '09171234567',
      }));

      // Step 3: Address
      adapter.sentActivities = [];
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: 'Makati Avenue, Metro Manila',
      }));

      // Must have sent an Activity containing an Adaptive Card attachment
      const cardActivity = adapter.sentActivities.find(
        (a) => a.attachments && a.attachments.length > 0
      );
      expect(cardActivity).toBeDefined();
      const attachment = cardActivity?.attachments?.[0];
      expect(attachment?.contentType).toBe('application/vnd.microsoft.card.adaptive');

      const card = attachment?.content as Record<string, unknown>;
      expect(card.type).toBe('AdaptiveCard');
      expect(card.version).toBe('1.5');
    });

    it('handles Adaptive Card Action.Submit payloads (activity.value.action)', async () => {
      const adapter = new AgentsResponseAdapter();
      const agent = new DCBSDChatbotAgent();

      // Advance to CONFIRM
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: 'Juan Dela Cruz',
      }));
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: '09171234567',
      }));
      await agent.run(createTestTurn(adapter, {
        type: 'message',
        text: 'BGC Taguig',
      }));

      // Submit via Adaptive Card button payload
      adapter.sentActivities = [];
      const submitContext = createTestTurn(adapter, {
        type: 'message',
        value: { action: 'submit' },
      });
      await agent.run(submitContext);

      expect(adapter.sentActivities.length).toBeGreaterThan(0);
      const completionMsg = adapter.sentActivities.find(
        (a) => a.text && a.text.includes('Thank you')
      );
      expect(completionMsg).toBeDefined();
      expect(completionMsg?.text).toContain('Juan');
    });
  });

  describe('3. Conversation Update & Member Event Handling', () => {
    it('dispatches welcome sequence when new human user is added', async () => {
      const adapter = new AgentsResponseAdapter();
      const agent = new DCBSDChatbotAgent();

      const convUpdateContext = createTestTurn(adapter, {
        type: 'conversationUpdate',
        recipient: { id: 'bot-dcbsd' },
        membersAdded: [
          { id: 'user-new', name: 'New Client' },
        ],
      });

      await agent.run(convUpdateContext);

      expect(adapter.sentActivities.length).toBeGreaterThanOrEqual(3);
      expect(adapter.sentActivities[adapter.sentActivities.length - 1].text?.toLowerCase()).toContain('name');
    });

    it('ignores bot self-addition event to prevent infinite response loop', async () => {
      const adapter = new AgentsResponseAdapter();
      const agent = new DCBSDChatbotAgent();

      const convUpdateContext = createTestTurn(adapter, {
        type: 'conversationUpdate',
        recipient: { id: 'bot-dcbsd' },
        membersAdded: [
          { id: 'bot-dcbsd', name: 'DCBSD Assistant' }, // Self addition
        ],
      });

      await agent.run(convUpdateContext);

      // No welcome message dispatched for bot itself
      expect(adapter.sentActivities.length).toBe(0);
    });
  });

  describe('4. processAgentActivity Pipeline Integration', () => {
    it('processes raw incoming objects and returns structured Activity array with automatic field normalization', async () => {
      const rawPayload = {
        type: 'message',
        text: 'Carlos Mendoza',
        conversation: { id: 'pipeline-conv-1' },
      };

      const activities = await processAgentActivity(rawPayload);

      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].type).toBe('message');
      expect(activities[0].text).toContain('Carlos Mendoza');
    });
  });
});
