/**
 * Adaptive Card for the confirmation step.
 *
 * Displays the collected Name, Mobile, and Address in a professional
 * card layout with "Yes, submit" and "Start over" action buttons.
 *
 * This fulfills the bonus requirement from the DCBSD technical exam
 * to integrate Microsoft Adaptive Cards.
 *
 * @see https://adaptivecards.io/designer/
 */

export function createConfirmationCard(
  name: string,
  mobile: string,
  address: string,
): Record<string, unknown> {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: 'Information Summary',
        weight: 'Bolder',
        size: 'Medium',
        color: 'Accent',
      },
      {
        type: 'TextBlock',
        text: 'Please review the details you provided:',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'FactSet',
            facts: [
              { title: 'Name', value: name },
              { title: 'Mobile', value: mobile },
              { title: 'Address', value: address },
            ],
          },
        ],
      },
      {
        type: 'TextBlock',
        text: 'Is everything correct?',
        wrap: true,
        weight: 'Bolder',
        spacing: 'Medium',
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Yes, submit',
        style: 'positive',
        data: { action: 'yes, submit' },
      },
      {
        type: 'Action.Submit',
        title: 'Start over',
        style: 'destructive',
        data: { action: 'start over' },
      },
    ],
  };
}
