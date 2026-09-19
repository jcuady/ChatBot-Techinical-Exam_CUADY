/**
 * Adaptive Card for interactive form intake.
 *
 * Provides Input.Text elements for Full Name, Philippine Mobile Number,
 * and Residential Address, matching the exact Input.Text designer sample
 * featured in the DCBSD technical exam specification.
 *
 * @see https://adaptivecards.io/designer/
 */

export function createIntakeFormCard(
  prefillName = '',
  prefillMobile = '',
  prefillAddress = '',
  errorMessage?: string,
): Record<string, unknown> {
  const body: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: 'DCBSD Customer Intake Form',
      weight: 'Bolder',
      size: 'Medium',
      color: 'Accent',
    },
    {
      type: 'TextBlock',
      text: 'Fill out your customer information below to register your account:',
      wrap: true,
      spacing: 'Small',
    },
  ];

  if (errorMessage) {
    body.push({
      type: 'TextBlock',
      text: `⚠ ${errorMessage}`,
      wrap: true,
      color: 'Attention',
      weight: 'Bolder',
      spacing: 'Small',
    });
  }

  body.push(
    {
      type: 'Container',
      style: 'emphasis',
      items: [
        {
          type: 'TextBlock',
          text: 'Full Name *',
          weight: 'Bolder',
          spacing: 'Medium',
        },
        {
          type: 'Input.Text',
          id: 'name',
          placeholder: 'Enter your full name (e.g. Juan Dela Cruz)',
          value: prefillName,
          isRequired: true,
        },
        {
          type: 'TextBlock',
          text: 'Philippine Mobile Number *',
          weight: 'Bolder',
          spacing: 'Medium',
        },
        {
          type: 'Input.Text',
          id: 'mobile',
          placeholder: 'e.g. 09171234567 or +639171234567',
          value: prefillMobile,
          isRequired: true,
        },
        {
          type: 'TextBlock',
          text: 'Residential Address *',
          weight: 'Bolder',
          spacing: 'Medium',
        },
        {
          type: 'Input.Text',
          id: 'address',
          placeholder: 'Enter your complete residential address',
          value: prefillAddress,
          isMultiline: true,
          isRequired: true,
        },
      ],
    },
    {
      type: 'TextBlock',
      text: 'Bank-Grade 256-Bit SSL Encrypted • Session Isolated',
      size: 'Small',
      isSubtle: true,
      spacing: 'Small',
    },
  );

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body,
    actions: [
      {
        type: 'Action.Submit',
        title: 'Submit Intake Details',
        style: 'positive',
        data: { action: 'submit_intake_form' },
      },
      {
        type: 'Action.Submit',
        title: 'Cancel / Start Over',
        style: 'destructive',
        data: { action: 'start over' },
      },
    ],
  };
}
