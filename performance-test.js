// Performance testing script for workout loading
// Run this in your browser console while on the workout-select page

async function testWorkoutPerformance() {
  console.log('🚀 Starting workout performance test...');
  
  // Test 1: Basic workouts (should be very fast)
  console.time('Basic workouts');
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: basicData } = await supabase
        .from('workouts')
        .select('workout_id, title, created_at')
        .eq('user_id', userData.user.id)
        .limit(10);
      console.timeEnd('Basic workouts');
      console.log(`📊 Found ${basicData?.length || 0} basic workouts`);
    }
  } catch (error) {
    console.error('Basic test failed:', error);
  }
  
  // Test 2: Network latency test
  console.time('Network ping');
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('workouts').select('workout_id').limit(1);
    }
    console.timeEnd('Network ping');
  } catch (error) {
    console.error('Network test failed:', error);
  }
  
  // Test 3: Count total workout_sets
  console.time('Count workout_sets');
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { count } = await supabase
        .from('workout_sets')
        .select('*', { count: 'exact' })
        .limit(0);
      console.timeEnd('Count workout_sets');
      console.log(`📊 Total workout_sets in database: ${count}`);
    }
  } catch (error) {
    console.error('Count test failed:', error);
  }
  
  console.log('✅ Performance test completed. Check the timing results above.');
}

// Run the test
testWorkoutPerformance(); 