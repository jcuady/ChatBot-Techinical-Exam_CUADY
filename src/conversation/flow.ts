/**
 * Conversation flow engine — the core state machine.
 *
 * Each incoming message is routed through handleMessage(), which:
 * 1. Retrieves (or creates) the conversation state
 * 2. Validates input for the current step
 * 3. Transitions to the next step on success
 * 4. Returns one or more response messages
 *
 * The state machine is explicit: every transition is a deliberate
 * assignment, and the default case always recovers to ASK_NAME.
 */

import { ConversationStep, ConversationState } from './states';
import { PROMPTS } from './prompts';
import { getState, setState, clearState } from '../state/conversationState';
import { validateMobileNumber } from '../validation/mobile';
import { validateName, validateAddress, sanitizeInput } from '../validation/input';
import { createConfirmationCard } from '../cards/confirmationCard';
import { createCompletionCard } from '../cards/completionCard';
import { createIntakeFormCard } from '../cards/intakeCard';

export interface BotResponse {
  text?: string;
  adaptiveCard?: Record<string, unknown>;
}

export interface IntakeFormData {
  name?: string;
  mobile?: string;
  address?: string;
}

/** Structured log for state transitions — never includes PII. */
function logTransition(conversationId: string, from: ConversationStep, to: ConversationStep): void {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.warn(`[${timestamp}] conversation_state_transition conversation=${conversationId} from=${from} to=${to}`);
}

/** Checks if the user wants to restart the conversation. */
function isRestartCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return lower === 'restart' || lower === 'start over' || lower === '/restart';
}

/** Checks if the user wants to open the interactive Adaptive Card intake form. */
function isFormRequestCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return (
    lower === 'form' ||
    lower === 'open form' ||
    lower === 'intake card' ||
    lower === 'card form' ||
    lower === 'fill form' ||
    lower === 'open intake form' ||
    lower === 'fill via interactive form'
  );
}

/**
 * Processes a user message and returns bot response(s).
 *
 * @param conversationId - Unique conversation identifier
 * @param rawText - Raw user input (untrusted)
 * @returns Array of bot responses to send
 */
export function handleMessage(conversationId: string, rawText: string): BotResponse[] {
  const text = sanitizeInput(rawText);
  const state = getState(conversationId);

  // Global restart command from any state
  if (isRestartCommand(text) && state.currentStep !== ConversationStep.ASK_NAME) {
    const previousStep = state.currentStep;
    clearState(conversationId);
    logTransition(conversationId, previousStep, ConversationStep.ASK_NAME);
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] conversation_restarted conversation=${conversationId}`);
    return [{ text: PROMPTS.RESTART }];
  }

  // Interactive Adaptive Card Form command
  if (isFormRequestCommand(text) && state.currentStep !== ConversationStep.COMPLETE) {
    return [
      {
        text: 'Here is the interactive customer intake card. You can submit your details directly using the form below:',
        adaptiveCard: createIntakeFormCard(),
      },
    ];
  }

  switch (state.currentStep) {
    case ConversationStep.ASK_NAME:
      return handleAskName(conversationId, text, state);

    case ConversationStep.ASK_MOBILE:
      return handleAskMobile(conversationId, text, state);

    case ConversationStep.ASK_ADDRESS:
      return handleAskAddress(conversationId, text, state);

    case ConversationStep.CONFIRM:
      return handleConfirm(conversationId, text, state);

    case ConversationStep.COMPLETE:
      // After completion, restart automatically
      clearState(conversationId);
      logTransition(conversationId, ConversationStep.COMPLETE, ConversationStep.ASK_NAME);
      return [
        { text: 'Starting a new conversation.' },
        ...PROMPTS.WELCOME.map(text => ({ text })),
      ];

    default: {
      // Safety net: unknown state → reset to ASK_NAME
      clearState(conversationId);
      return PROMPTS.WELCOME.map(text => ({ text }));
    }
  }
}

function handleAskName(conversationId: string, text: string, state: ConversationState): BotResponse[] {
  const result = validateName(text);

  if (!result.valid) {
    return [{ text: result.message ?? PROMPTS.INVALID_NAME }];
  }

  state.userInformation.name = result.sanitized;
  state.currentStep = ConversationStep.ASK_MOBILE;
  setState(conversationId, state);
  logTransition(conversationId, ConversationStep.ASK_NAME, ConversationStep.ASK_MOBILE);

  return [{ text: PROMPTS.ASK_MOBILE(result.sanitized) }];
}

function handleAskMobile(conversationId: string, text: string, state: ConversationState): BotResponse[] {
  const result = validateMobileNumber(text);

  if (!result.valid) {
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] validation_failed conversation=${conversationId} field=mobile`);
    return [{ text: result.message ?? PROMPTS.INVALID_MOBILE }];
  }

  state.userInformation.mobile = result.normalized;
  state.currentStep = ConversationStep.ASK_ADDRESS;
  setState(conversationId, state);
  logTransition(conversationId, ConversationStep.ASK_MOBILE, ConversationStep.ASK_ADDRESS);

  return [{ text: PROMPTS.ASK_ADDRESS }];
}

function handleAskAddress(conversationId: string, text: string, state: ConversationState): BotResponse[] {
  const result = validateAddress(text);

  if (!result.valid) {
    return [{ text: result.message ?? PROMPTS.INVALID_ADDRESS }];
  }

  state.userInformation.address = result.sanitized;
  state.currentStep = ConversationStep.CONFIRM;
  setState(conversationId, state);
  logTransition(conversationId, ConversationStep.ASK_ADDRESS, ConversationStep.CONFIRM);

  const name = state.userInformation.name ?? '';
  const mobile = state.userInformation.mobile ?? '';
  const address = result.sanitized;

  return [
    {
      text: PROMPTS.CONFIRM(name, mobile, address),
      adaptiveCard: createConfirmationCard(name, mobile, address),
    },
  ];
}

function handleConfirm(conversationId: string, text: string, state: ConversationState): BotResponse[] {
  const lower = text.toLowerCase().trim();

  const isYes = lower === 'yes' || lower === 'yes, submit' || lower === 'y' || lower === 'confirm' || lower === 'submit';
  const isNo = lower === 'no' || lower === 'start over' || lower === 'n' || lower === 'restart';

  if (isYes) {
    const name = state.userInformation.name ?? '';
    state.currentStep = ConversationStep.COMPLETE;
    setState(conversationId, state);
    logTransition(conversationId, ConversationStep.CONFIRM, ConversationStep.COMPLETE);
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] conversation_completed conversation=${conversationId}`);

    return [
      {
        text: PROMPTS.COMPLETE(name),
        adaptiveCard: createCompletionCard(name, state.userInformation.mobile ?? '', state.userInformation.address ?? ''),
      },
    ];
  }

  if (isNo) {
    clearState(conversationId);
    logTransition(conversationId, ConversationStep.CONFIRM, ConversationStep.ASK_NAME);
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] conversation_restarted conversation=${conversationId}`);
    return [{ text: PROMPTS.RESTART }];
  }

  // Unexpected input at confirmation → re-prompt
  return [{ text: PROMPTS.UNEXPECTED_CONFIRM }];
}

/**
 * Handles an interactive Adaptive Card Form submission (Input.Text elements).
 * Validates all fields atomically and updates the conversation state.
 */
export function handleFormSubmission(conversationId: string, formData: IntakeFormData): BotResponse[] {
  const nameInput = sanitizeInput(formData.name ?? '');
  const mobileInput = sanitizeInput(formData.mobile ?? '');
  const addressInput = sanitizeInput(formData.address ?? '');

  const nameResult = validateName(nameInput);
  if (!nameResult.valid) {
    const errorMsg = nameResult.message ?? PROMPTS.INVALID_NAME;
    return [
      {
        text: errorMsg,
        adaptiveCard: createIntakeFormCard(nameInput, mobileInput, addressInput, errorMsg),
      },
    ];
  }

  const mobileResult = validateMobileNumber(mobileInput);
  if (!mobileResult.valid) {
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] validation_failed conversation=${conversationId} field=mobile source=form_card`);
    const errorMsg = mobileResult.message ?? PROMPTS.INVALID_MOBILE;
    return [
      {
        text: errorMsg,
        adaptiveCard: createIntakeFormCard(nameResult.sanitized ?? nameInput, mobileInput, addressInput, errorMsg),
      },
    ];
  }

  const addressResult = validateAddress(addressInput);
  if (!addressResult.valid) {
    const errorMsg = addressResult.message ?? PROMPTS.INVALID_ADDRESS;
    return [
      {
        text: errorMsg,
        adaptiveCard: createIntakeFormCard(nameResult.sanitized ?? nameInput, mobileResult.normalized ?? mobileInput, addressInput, errorMsg),
      },
    ];
  }

  // All fields valid: transition state to CONFIRM
  const state = getState(conversationId);
  const previousStep = state.currentStep;
  state.userInformation.name = nameResult.sanitized;
  state.userInformation.mobile = mobileResult.normalized;
  state.userInformation.address = addressResult.sanitized;
  state.currentStep = ConversationStep.CONFIRM;
  setState(conversationId, state);
  logTransition(conversationId, previousStep, ConversationStep.CONFIRM);

  const name = nameResult.sanitized ?? '';
  const mobile = mobileResult.normalized ?? '';
  const address = addressResult.sanitized ?? '';

  return [
    {
      text: PROMPTS.CONFIRM(name, mobile, address),
      adaptiveCard: createConfirmationCard(name, mobile, address),
    },
  ];
}

/**
 * Handles an Adaptive Card action submission.
 * Used when the user clicks a button on a card.
 */
export function handleCardAction(
  conversationId: string,
  action: string,
  formData?: IntakeFormData,
): BotResponse[] {
  if (action === 'submit_intake_form' && formData) {
    return handleFormSubmission(conversationId, formData);
  }
  return handleMessage(conversationId, action);
}

