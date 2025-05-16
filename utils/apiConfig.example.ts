// API Configuration - Example file
// Copy this file to apiConfig.ts and add your API keys

// Add your ExerciseDB RapidAPI key here
export const EXERCISE_DB_API_KEY = 'd42e7256d0msh7e45f6be8f2079ep1d4113jsnc924baf6ed7e';

// API base URLs
export const EXERCISE_DB_API_URL = 'https://exercisedb.p.rapidapi.com/exercises';
export const WGER_API_BASE_URL = 'https://wger.de/api/v2';

// RapidAPI headers for ExerciseDB
export const getExerciseDBHeaders = () => ({
  'X-RapidAPI-Key': 'd42e7256d0msh7e45f6be8f2079ep1d4113jsnc924baf6ed7e',
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
}); 