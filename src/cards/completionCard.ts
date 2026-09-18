/**
 * Adaptive Card for the completion step.
 *
 * Displays a success message with the submitted information summary.
 */

export function createCompletionCard(
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
        text: '✓ Submission Successful',
        weight: 'Bolder',
        size: 'Medium',
        color: 'Good',
      },
      {
        type: 'TextBlock',
        text: `Thank you, ${name}! Your information has been successfully submitted.`,
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
    ],
  };
}
