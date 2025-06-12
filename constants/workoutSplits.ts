import { 
  upperATemplate, 
  upperBTemplate, 
  lowerATemplate, 
  lowerBTemplate,
  pushATemplate,
  pushBTemplate,
  pullATemplate,
  pullBTemplate,
  legsATemplate,
  legsBTemplate,
  fullBodyATemplate,
  fullBodyBTemplate
} from './workoutTemplates';

// Workout splits based on days per week
export const splitTemplates: Record<number, Array<string[]>> = {
  3: [
    ['Upper A', 'Lower A', 'Full Body A'], // Upper/Lower/Full Body
    ['Push A', 'Pull A', 'Legs A'], // Push/Pull/Legs
    ['Full Body A', 'Full Body B', 'Full Body A'], // 3x Full Body
    ['Upper A', 'Lower A', 'Upper B'] // Upper/Lower/Upper
  ],
  4: [
    ['Upper A', 'Lower A', 'Upper B', 'Full Body A'], // Upper/Lower/Upper/Full Body
    ['Push A', 'Pull A', 'Legs A', 'Full Body A'], // Push/Pull/Legs/Full Body
    ['Full Body A', 'Full Body B', 'Full Body A', 'Full Body B'], // 4x Full Body
    ['Upper A', 'Lower A', 'Upper B', 'Lower B'], // 2x Upper/Lower
    ['Push A', 'Legs A', 'Pull A', 'Legs B'] // Push/Legs/Pull/Legs
  ],
  5: [
    ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Full Body A'], // Upper/Lower/Upper/Lower/Full Body
    ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Upper A'], // Upper/Lower/Upper/Lower/Upper
    ['Full Body A', 'Full Body B', 'Full Body A', 'Full Body B', 'Full Body A'], // 5x Full Body
    ['Push A', 'Pull A', 'Legs A', 'Upper A', 'Lower A'] // Push/Pull/Legs/Upper/Lower
  ],
  6: [
    ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Upper A', 'Lower A'], // 3x Upper/Lower
    ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'], // 2x Push/Pull/Legs
    ['Full Body A', 'Full Body B', 'Full Body A', 'Full Body B', 'Full Body A', 'Full Body B'], // 6x Full Body
    ['Upper A', 'Lower A', 'Full Body A', 'Upper B', 'Lower B', 'Full Body B'], // 2x Upper/Lower/Full Body
    ['Push A', 'Pull A', 'Legs A', 'Upper A', 'Lower A', 'Full Body A'] // Push/Pull/Legs/Upper/Lower/Full Body
  ]
};

// Split recommendations based on goal
export const recommendedSplitsByGoal: Record<string, Record<number, number>> = {
  'Lose weight': {
    3: 0, // Upper/Lower/Full Body for 3 days
    4: 0, // Upper/Lower/Upper/Full Body for 4 days
    5: 0, // Upper/Lower/Upper/Lower/Full Body for 5 days
    6: 3  // 2x Upper/Lower/Full Body for 6 days
  },
  'Gain muscle': {
    3: 1, // Push/Pull/Legs for 3 days
    4: 3, // 2x Upper/Lower for 4 days
    5: 3, // Push/Pull/Legs/Upper/Lower for 5 days
    6: 1  // 2x Push/Pull/Legs for 6 days
  },
  'Gain strength': {
    3: 0, // Upper/Lower/Full Body for 3 days
    4: 3, // 2x Upper/Lower for 4 days
    5: 1, // Upper/Lower/Upper/Lower/Upper for 5 days
    6: 0  // 3x Upper/Lower for 6 days
  },
  'Maintain muscle': {
    3: 2, // 3x Full Body for 3 days
    4: 2, // 4x Full Body for 4 days
    5: 0, // Upper/Lower/Upper/Lower/Full Body for 5 days
    6: 3  // 2x Upper/Lower/Full Body for 6 days
  }
};

// Map template names to actual template objects
export const templateMap: Record<string, any> = {
  'Upper A': upperATemplate,
  'Upper B': upperBTemplate,
  'Lower A': lowerATemplate,
  'Lower B': lowerBTemplate,
  'Push A': pushATemplate,
  'Push B': pushBTemplate,
  'Pull A': pullATemplate,
  'Pull B': pullBTemplate,
  'Legs A': legsATemplate,
  'Legs B': legsBTemplate,
  'Full Body A': fullBodyATemplate,
  'Full Body B': fullBodyBTemplate
}; 