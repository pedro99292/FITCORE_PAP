// Exercise safety warnings and tips organized by category and experience level

export interface SafetyWarning {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  targetAudience: ('all' | 'beginner' | 'intermediate' | 'advanced' | 'senior')[];
  category: 'form' | 'equipment' | 'medical' | 'environment' | 'recovery';
}

export const SAFETY_WARNINGS: SafetyWarning[] = [
  // Critical safety warnings (must be shown)
  {
    id: 'form-over-weight',
    title: 'Form Always Comes First',
    description: 'Never sacrifice proper form for heavier weights. Poor form leads to injuries and reduces exercise effectiveness. Focus on controlled movements.',
    icon: 'warning',
    priority: 'critical',
    targetAudience: ['all'],
    category: 'form'
  },
  {
    id: 'pain-vs-discomfort',
    title: 'Know Pain vs. Discomfort',
    description: 'Muscle fatigue and burning sensation are normal. Sharp, shooting, or joint pain means STOP IMMEDIATELY. Never push through pain.',
    icon: 'medical',
    priority: 'critical',
    targetAudience: ['all'],
    category: 'medical'
  },
  {
    id: 'medical-clearance',
    title: 'Get Medical Clearance',
    description: 'If you have heart conditions, high blood pressure, diabetes, joint problems, or take medications, consult your doctor before exercising.',
    icon: 'heart',
    priority: 'critical',
    targetAudience: ['all'],
    category: 'medical'
  },
  {
    id: 'emergency-protocol',
    title: 'Know Emergency Procedures',
    description: 'If you feel chest pain, extreme dizziness, shortness of breath, or nausea, stop immediately and seek medical help.',
    icon: 'alert-circle',
    priority: 'critical',
    targetAudience: ['all'],
    category: 'medical'
  },

  // High priority warnings
  {
    id: 'warm-up-required',
    title: 'Always Warm Up',
    description: 'Start with 5-10 minutes of light cardio and dynamic stretching. Cold muscles are more prone to injury.',
    icon: 'thermometer',
    priority: 'high',
    targetAudience: ['all'],
    category: 'form'
  },
  {
    id: 'progressive-overload',
    title: 'Progress Gradually',
    description: 'Increase weight, reps, or intensity by only 5-10% per week. Rapid progression leads to overuse injuries.',
    icon: 'trending-up',
    priority: 'high',
    targetAudience: ['beginner', 'intermediate'],
    category: 'form'
  },
  {
    id: 'spotter-needed',
    title: 'Use a Spotter for Heavy Lifts',
    description: 'For bench press, squats with free weights, or attempting new maxes, always have a qualified spotter present.',
    icon: 'people',
    priority: 'high',
    targetAudience: ['intermediate', 'advanced'],
    category: 'equipment'
  },
  {
    id: 'equipment-inspection',
    title: 'Inspect Equipment First',
    description: 'Check for loose bolts, frayed cables, or damaged equipment before use. Report any issues to gym staff immediately.',
    icon: 'construct',
    priority: 'high',
    targetAudience: ['all'],
    category: 'equipment'
  },

  // Senior-specific warnings
  {
    id: 'heart-rate-monitoring',
    title: 'Monitor Your Heart Rate',
    description: 'Stay within your target heart rate zone. If you can\'t hold a conversation during exercise, you may be working too hard.',
    icon: 'pulse',
    priority: 'high',
    targetAudience: ['senior'],
    category: 'medical'
  },
  {
    id: 'balance-stability',
    title: 'Prioritize Balance & Stability',
    description: 'Use machines with back support when possible. Always have something stable to hold onto during standing exercises.',
    icon: 'accessibility',
    priority: 'high',
    targetAudience: ['senior'],
    category: 'form'
  },
  {
    id: 'medication-exercise',
    title: 'Consider Medication Effects',
    description: 'Some medications affect heart rate, blood pressure, or balance during exercise. Discuss your routine with your healthcare provider.',
    icon: 'medical-outline',
    priority: 'high',
    targetAudience: ['senior'],
    category: 'medical'
  },

  // Medium priority tips
  {
    id: 'hydration',
    title: 'Stay Properly Hydrated',
    description: 'Drink water before, during, and after your workout. Dehydration affects performance and increases injury risk.',
    icon: 'water',
    priority: 'medium',
    targetAudience: ['all'],
    category: 'environment'
  },
  {
    id: 'rest-recovery',
    title: 'Rest Days Are Essential',
    description: 'Muscles grow during rest, not during workouts. Allow 48-72 hours between training the same muscle groups.',
    icon: 'bed',
    priority: 'medium',
    targetAudience: ['all'],
    category: 'recovery'
  },
  {
    id: 'proper-breathing',
    title: 'Breathe Properly',
    description: 'Never hold your breath during exercises. Exhale during the exertion phase, inhale during the relaxation phase.',
    icon: 'fitness',
    priority: 'medium',
    targetAudience: ['beginner'],
    category: 'form'
  },
  {
    id: 'gym-etiquette',
    title: 'Follow Gym Safety Etiquette',
    description: 'Rerack weights, wipe down equipment, and don\'t drop weights unnecessarily. This keeps everyone safe.',
    icon: 'people-circle',
    priority: 'medium',
    targetAudience: ['all'],
    category: 'equipment'
  },
  {
    id: 'listen-to-body',
    title: 'Listen to Your Body',
    description: 'If you feel unusually tired, sick, or sore, consider taking a rest day. Overtraining leads to injuries and burnout.',
    icon: 'body',
    priority: 'medium',
    targetAudience: ['all'],
    category: 'recovery'
  }
];

// Quick access functions
export const getCriticalWarnings = (): SafetyWarning[] => 
  SAFETY_WARNINGS.filter(warning => warning.priority === 'critical');

export const getWarningsForAudience = (audience: string): SafetyWarning[] =>
  SAFETY_WARNINGS.filter(warning => 
    warning.targetAudience.includes('all') || warning.targetAudience.includes(audience as any)
  );

export const getWarningsByCategory = (category: string): SafetyWarning[] =>
  SAFETY_WARNINGS.filter(warning => warning.category === category);

export const getTopPriorityWarnings = (audience: string, limit: number = 5): SafetyWarning[] => {
  const audienceWarnings = getWarningsForAudience(audience);
  const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
  
  return audienceWarnings
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, limit);
};

// Exercise-specific warnings
export const EXERCISE_SPECIFIC_WARNINGS = {
  'bench press': [
    'Always use a spotter or safety bars',
    'Keep your feet planted firmly on the ground',
    'Don\'t bounce the bar off your chest'
  ],
  'squat': [
    'Keep knees aligned with toes',
    'Don\'t let knees cave inward',
    'Maintain a neutral spine throughout'
  ],
  'deadlift': [
    'Keep the bar close to your body',
    'Don\'t round your back',
    'Engage your core before lifting'
  ],
  'overhead press': [
    'Don\'t arch your back excessively',
    'Keep core engaged throughout',
    'Use a spotter for heavy weights'
  ]
};

// Environment-specific warnings
export const ENVIRONMENT_WARNINGS = {
  'hot_weather': [
    'Exercise during cooler parts of the day',
    'Increase hydration significantly',
    'Watch for signs of heat exhaustion'
  ],
  'cold_weather': [
    'Extend your warm-up period',
    'Layer clothing appropriately',
    'Be extra careful on slippery surfaces'
  ],
  'high_altitude': [
    'Reduce intensity initially',
    'Increase hydration',
    'Allow time for acclimatization'
  ]
}; 