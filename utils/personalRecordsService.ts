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
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Get all personal records for a user
export const getUserPersonalRecords = async (): Promise<PersonalRecord[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', user.id)
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
    .eq('user_id', user.id);

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
    .ilike('exercise_name', `%${searchTerm}%`)
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return data || [];
}; 