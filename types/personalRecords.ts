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
}

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
} 