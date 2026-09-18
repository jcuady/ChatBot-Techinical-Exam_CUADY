/**
 * Conversation step definitions for the DCBSD Chatbot state machine.
 *
 * The chatbot follows a deterministic workflow:
 * ASK_NAME → ASK_MOBILE → ASK_ADDRESS → CONFIRM → COMPLETE
 *
 * Invalid input keeps the conversation in the current step.
 * "Start over" or rejection at CONFIRM returns to ASK_NAME.
 */

export enum ConversationStep {
  ASK_NAME = 'ASK_NAME',
  ASK_MOBILE = 'ASK_MOBILE',
  ASK_ADDRESS = 'ASK_ADDRESS',
  CONFIRM = 'CONFIRM',
  COMPLETE = 'COMPLETE',
}

export interface UserInformation {
  name: string;
  mobile: string;
  address: string;
}

export interface ConversationState {
  currentStep: ConversationStep;
  userInformation: Partial<UserInformation>;
}

/** Creates a fresh conversation state starting at ASK_NAME. */
export function createInitialState(): ConversationState {
  return {
    currentStep: ConversationStep.ASK_NAME,
    userInformation: {},
  };
}
