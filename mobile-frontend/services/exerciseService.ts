const EXERCISES_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

export const BASE_IMG =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export const fetchExercises = async () => {
  const res = await fetch(EXERCISES_URL);
  if (!res.ok) throw new Error('Failed to fetch exercises');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};