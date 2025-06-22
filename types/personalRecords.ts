export type RecordType = 'strength' | 'endurance' | 'weight' | 'reps' | 'time' | 'distance';

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_body_part?: string;
  exercise_target?: string;
  exercise_equipment?: string;
  record_type: RecordType;
  value: number;
  unit: string;
  reps?: number;
  notes?: string;
  achieved_at: string;
  created_at: string;
  updated_at: string;
  // New fields for goals support
  record_category: 'record' | 'goal';
  target_date?: string;
  status: 'active' | 'achieved' | 'overdue' | 'cancelled';
  target_value?: number;
  target_reps?: number;
}

export interface NewPersonalRecord {
  exercise_id: string;
  exercise_name: string;
  exercise_body_part?: string;
  exercise_target?: string;
  exercise_equipment?: string;
  record_type: RecordType;
  value: number;
  unit: string;
  reps?: number;
  notes?: string;
  achieved_at?: string;
  // New fields for goals support
  record_category?: 'record' | 'goal';
  target_date?: string;
  status?: 'active' | 'achieved' | 'overdue' | 'cancelled';
  target_value?: number;
  target_reps?: number;
}

// Type aliases for clarity when working with goals
export type PersonalRecordGoal = PersonalRecord;
export type NewPersonalRecordGoal = NewPersonalRecord;

export interface PRSummary {
  exercise_id: string;
  exercise_name: string;
  exercise_body_part?: string;
  exercise_target?: string;
  exercise_equipment?: string;
  latest_records: {
    strength?: PersonalRecord;
    endurance?: PersonalRecord;
    weight?: PersonalRecord;
    reps?: PersonalRecord;
    time?: PersonalRecord;
    distance?: PersonalRecord;
  };
  total_records: number;
  improvement_percentage?: number;
  // Add goals info to PR summaries
  active_goals?: PersonalRecord[];
  achieved_goals?: PersonalRecord[];
}

export interface PRStats {
  total_prs: number;
  this_month_prs: number;
  favorite_body_part: string;
  biggest_improvement: {
    exercise_name: string;
    improvement_percentage: number;
    record_type: RecordType;
  };
  // Add goal stats
  total_goals?: number;
  active_goals?: number;
  achieved_goals?: number;
  goals_achieved_this_month?: number;
} 