/**
 * In-memory conversation state store.
 *
 * This implementation intentionally uses transient state for the
 * technical examination. A production deployment would use an
 * approved persistent state mechanism with defined retention,
 * encryption, access control, and data lifecycle policies.
 */

import { ConversationState, createInitialState } from '../conversation/states';

const stateStore = new Map<string, ConversationState>();

/** Retrieves conversation state, creating a fresh one if none exists. */
export function getState(conversationId: string): ConversationState {
  const existing = stateStore.get(conversationId);
  if (existing) return existing;

  const initial = createInitialState();
  stateStore.set(conversationId, initial);
  return initial;
}

/** Persists updated conversation state. */
export function setState(conversationId: string, state: ConversationState): void {
  stateStore.set(conversationId, state);
}

/** Clears all PII from a conversation and resets to initial state. */
export function clearState(conversationId: string): void {
  stateStore.set(conversationId, createInitialState());
}
