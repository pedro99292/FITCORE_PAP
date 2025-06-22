import { supabase } from './supabase';
import { PersonalRecord, NewPersonalRecord, PRSummary, PRStats, RecordType } from '@/types/personalRecords';

// Create a new personal record
export const createPersonalRecord = async (record: NewPersonalRecord): Promise<PersonalRecord> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .insert([{
      ...record,
      user_id: user.id,
      record_category: 'record',
      status: 'achieved',
      achieved_at: record.achieved_at || new Date().toISOString(),
    }])
    .select('*')
    .single();

  if (error) throw error;
  
  // Note: Goal checking is handled in the UI layer via checkAndUpdateGoalsOnNewPR
  return data;
};

// Get all personal records for a user (actual records, not goals)
export const getUserPersonalRecords = async (): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'record')
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get personal records for a specific exercise
export const getExercisePersonalRecords = async (exerciseId: string): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .eq('record_category', 'record')
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get PR summaries grouped by exercise
export const getPRSummaries = async (): Promise<PRSummary[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'record')
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // Group records by exercise and get latest for each record type
  const exerciseMap = new Map<string, PRSummary>();

  data.forEach(record => {
    const key = record.exercise_id;
    
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, {
        exercise_id: record.exercise_id,
        exercise_name: record.exercise_name,
        exercise_body_part: record.exercise_body_part,
        exercise_target: record.exercise_target,
        exercise_equipment: record.exercise_equipment,
        latest_records: {},
        total_records: 0,
      });
    }

    const summary = exerciseMap.get(key)!;
    summary.total_records++;

    // Update latest record for this type if this one is newer
    const currentLatest = summary.latest_records[record.record_type as RecordType];
    if (!currentLatest || new Date(record.achieved_at) > new Date(currentLatest.achieved_at)) {
      summary.latest_records[record.record_type as RecordType] = record;
    }
  });

  return Array.from(exerciseMap.values());
};

// Get PR statistics
export const getPRStats = async (): Promise<PRStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'record');

  if (error) throw error;
  if (!data) return {
    total_prs: 0,
    this_month_prs: 0,
    favorite_body_part: 'Unknown',
    biggest_improvement: {
      exercise_name: 'None',
      improvement_percentage: 0,
      record_type: 'strength' as RecordType,
    },
  };

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count PRs this month
  const thisMonthPRs = data.filter(record => 
    new Date(record.achieved_at) >= thisMonth
  ).length;

  // Find favorite body part
  const bodyPartCounts = data.reduce((acc, record) => {
    const bodyPart = record.exercise_body_part || 'Unknown';
    acc[bodyPart] = (acc[bodyPart] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const favoriteBodyPart = Object.entries(bodyPartCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Unknown';

  // Calculate biggest improvement
  let biggestImprovement = {
    exercise_name: 'None',
    improvement_percentage: 0,
    record_type: 'strength' as RecordType,
  };

  // Group by exercise and record type to find improvements
  const exerciseRecords = data.reduce((acc, record) => {
    const key = `${record.exercise_id}_${record.record_type}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, PersonalRecord[]>);

  Object.keys(exerciseRecords).forEach((key) => {
    const records = exerciseRecords[key];
    if (records.length < 2) return;
    
    // Sort by date
    records.sort((a: PersonalRecord, b: PersonalRecord) => 
      new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime()
    );
    
    const firstRecord = records[0];
    const latestRecord = records[records.length - 1];
    
    const improvement = ((latestRecord.value - firstRecord.value) / firstRecord.value) * 100;
    
    if (improvement > biggestImprovement.improvement_percentage) {
      biggestImprovement = {
        exercise_name: latestRecord.exercise_name,
        improvement_percentage: improvement,
        record_type: latestRecord.record_type as RecordType,
      };
    }
  });

  return {
    total_prs: data.length,
    this_month_prs: thisMonthPRs,
    favorite_body_part: favoriteBodyPart,
    biggest_improvement: biggestImprovement,
  };
};

// Update a personal record
export const updatePersonalRecord = async (id: string, updates: Partial<NewPersonalRecord>): Promise<PersonalRecord> => {
  const { data, error } = await supabase
    .from('personal_records')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Delete a personal record
export const deletePersonalRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('personal_records')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get records for a specific body part
export const getRecordsByBodyPart = async (bodyPart: string): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_body_part', bodyPart)
    .eq('record_category', 'record')
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Search records by exercise name
export const searchRecords = async (searchTerm: string): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'record')
    .ilike('exercise_name', `%${searchTerm}%`)
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============ PERSONAL RECORD GOALS FUNCTIONS ============

// Create a new personal record goal
export const createPersonalRecordGoal = async (goal: NewPersonalRecord): Promise<PersonalRecord> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .insert([{
      ...goal,
      user_id: user.id,
      record_category: 'goal',
      status: 'active',
      value: goal.target_value || goal.value,
      reps: goal.target_reps || goal.reps,
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Get all personal record goals for a user
export const getUserPersonalRecordGoals = async (): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'goal')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get active personal record goals for a user
export const getActivePersonalRecordGoals = async (): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'goal')
    .eq('status', 'active')
    .order('target_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Get personal record goals for a specific exercise
export const getExercisePersonalRecordGoals = async (exerciseId: string): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'goal')
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update a personal record goal
export const updatePersonalRecordGoal = async (id: string, updates: Partial<PersonalRecord>): Promise<PersonalRecord> => {
  const { data, error } = await supabase
    .from('personal_records')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Mark a goal as achieved
export const markGoalAsAchieved = async (goalId: string, achievedValue: number, achievedReps?: number): Promise<PersonalRecord> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, get the goal details
  const { data: goal, error: goalError } = await supabase
    .from('personal_records')
    .select('*')
    .eq('id', goalId)
    .eq('record_category', 'goal')
    .single();

  if (goalError) throw goalError;
  if (!goal) throw new Error('Goal not found');

  // Update the goal status to achieved
  const { data: updatedGoal, error: updateError } = await supabase
    .from('personal_records')
    .update({
      status: 'achieved',
      achieved_at: new Date().toISOString(),
      value: achievedValue,
      reps: achievedReps,
    })
    .eq('id', goalId)
    .select('*')
    .single();

  if (updateError) throw updateError;

  // Create a new personal record entry
  const newRecord: NewPersonalRecord = {
    exercise_id: goal.exercise_id,
    exercise_name: goal.exercise_name,
    exercise_body_part: goal.exercise_body_part,
    exercise_target: goal.exercise_target,
    exercise_equipment: goal.exercise_equipment,
    record_type: goal.record_type,
    value: achievedValue,
    unit: goal.unit,
    reps: achievedReps,
    notes: `Goal achieved: ${goal.notes ? goal.notes + ' - ' : ''}Target was ${goal.target_value || goal.value}${goal.unit}${goal.target_reps ? ` x ${goal.target_reps} reps` : ''}`,
    achieved_at: new Date().toISOString(),
  };

  // Create the personal record
  await createPersonalRecord(newRecord);

  return updatedGoal;
};

// Delete a personal record goal
export const deletePersonalRecordGoal = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('personal_records')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Check if a new PR achieves any goals
export const checkAndUpdateGoalsOnNewPR = async (newPR: PersonalRecord): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get active goals for this exercise and record type
  const { data: activeGoals, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_category', 'goal')
    .eq('exercise_id', newPR.exercise_id)
    .eq('record_type', newPR.record_type)
    .eq('status', 'active');

  if (error) throw error;
  if (!activeGoals || activeGoals.length === 0) return [];

  const achievedGoals: PersonalRecord[] = [];

  for (const goal of activeGoals) {
    let goalAchieved = false;

    // Check if the new PR meets or exceeds the goal
    if (newPR.record_type === 'strength') {
      // For strength, both weight and reps must meet or exceed the target
      if (newPR.value >= (goal.target_value || goal.value) && (newPR.reps || 0) >= (goal.target_reps || goal.reps || 0)) {
        goalAchieved = true;
      }
    } else {
      // For other record types, just check the value
      if (newPR.value >= (goal.target_value || goal.value)) {
        goalAchieved = true;
      }
    }

    if (goalAchieved) {
      const updatedGoal = await markGoalAsAchieved(goal.id, newPR.value, newPR.reps);
      achievedGoals.push(updatedGoal);
    }
  }

  return achievedGoals;
};

// Update overdue goals
export const updateOverdueGoals = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('personal_records')
    .update({ status: 'overdue' })
    .eq('user_id', user.id)
    .eq('record_category', 'goal')
    .eq('status', 'active')
    .lt('target_date', now)
    .not('target_date', 'is', null);

  if (error) throw error;
};

// Get goal statistics
export const getGoalStats = async (): Promise<{
  total_goals: number;
  active_goals: number;
  achieved_goals: number;
  overdue_goals: number;
  goals_achieved_this_month: number;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('status, achieved_at')
    .eq('user_id', user.id)
    .eq('record_category', 'goal');

  if (error) throw error;
  if (!data) return {
    total_goals: 0,
    active_goals: 0,
    achieved_goals: 0,
    overdue_goals: 0,
    goals_achieved_this_month: 0,
  };

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const total_goals = data.length;
  const active_goals = data.filter(goal => goal.status === 'active').length;
  const achieved_goals = data.filter(goal => goal.status === 'achieved').length;
  const overdue_goals = data.filter(goal => goal.status === 'overdue').length;
  const goals_achieved_this_month = data.filter(goal => 
    goal.status === 'achieved' && 
    goal.achieved_at && 
    new Date(goal.achieved_at) >= thisMonth
  ).length;

  return {
    total_goals,
    active_goals,
    achieved_goals,
    overdue_goals,
    goals_achieved_this_month,
  };
}; 