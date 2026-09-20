/**
 * Centralized bot prompt messages.
 *
 * All user-facing text is defined here so the conversation flow
 * module stays focused on state transitions, and UX copy can be
 * reviewed or localized in one place.
 */

export const PROMPTS = {
  WELCOME: [
    'Hello! I\'m the DCBSD Chatbot Assistant.',
    'I\'ll collect a few details from you.\nLet\'s get started.',
    'What is your name?',
  ],

  ASK_MOBILE: (name: string): string =>
    `Nice to meet you, ${name}!\n\nWhat is your mobile number?`,

  INVALID_MOBILE: [
    'That doesn\'t look like a valid Philippine mobile number.',
    'Please enter an 11-digit mobile number, for example:\n\n09171234567\n\nYou can also use the +63 format.',
  ].join('\n\n'),

  ASK_ADDRESS: 'Thanks! What is your address?',

  INVALID_NAME: 'Please enter a valid name (letters, spaces, hyphens, apostrophes, and periods are allowed).',

  INVALID_ADDRESS: 'Please enter a valid address.',

  CONFIRM: (name: string, mobile: string, address: string): string =>
    [
      'Your information is:',
      `**Name:**\n${name}`,
      `**Mobile:**\n${mobile}`,
      `**Address:**\n${address}`,
      'Is everything correct?',
    ].join('\n\n'),

  CONFIRM_OPTIONS: 'Please choose one of the available options:\n\n• Yes, submit\n• Start over',

  COMPLETE: (name: string): string =>
    `Thank you, ${name}! Your information has been successfully submitted.`,

  RESTART: 'No problem. Let\'s start again.\n\nWhat is your name?',

  UNEXPECTED_CONFIRM: 'Please choose one of the available options:\n\n• Yes, submit\n• Start over',

  ERROR: 'Something went wrong while processing your request.\nPlease try again.',

  INPUT_TOO_LONG: 'Your input is too long. Please keep it within the allowed limit.',
} as const;
