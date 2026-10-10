export type SurveyItem = { id: string; teen: string; parent: string };

/** Likert scale 1-5 */
export const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
] as const;

export const SURVEY_ITEMS: SurveyItem[] = [
  {
    id: 'merge-i40',
    teen: 'I feel confident merging onto I-40.',
    parent: 'I feel confident my teen can merge onto I-40.',
  },
  {
    id: 'roundabout',
    teen: 'I feel confident navigating a roundabout.',
    parent: 'I feel confident my teen can navigate a roundabout.',
  },
  {
    id: 'night',
    teen: 'I feel confident driving at night.',
    parent: 'I feel confident my teen can drive at night.',
  },
  {
    id: 'rush-hour-arterial',
    teen: 'I feel confident driving on N. Mt. Juliet Rd at rush hour.',
    parent: 'I feel confident my teen can drive on N. Mt. Juliet Rd at rush hour.',
  },
  {
    id: 'left-turns',
    teen: 'I feel confident making left turns across traffic.',
    parent: 'I feel confident my teen can make left turns across traffic.',
  },
  {
    id: 'bad-weather',
    teen: 'I feel confident driving in rain or other poor weather.',
    parent: 'I feel confident my teen can drive in rain or other poor weather.',
  },
];
