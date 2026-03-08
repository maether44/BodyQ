import { ACTIVITY } from '../constants/onBoardingData';

// Parse DD/MM/YYYY → age in years
export function dobToAge(dob) {
  if (!dob || dob.length !== 10) return null;
  const [dd, mm, yyyy] = dob.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;

  const birth = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasBirthdayPassed) age--;
  return age;
}

// Convert DD/MM/YYYY → YYYY-MM-DD for Supabase DATE column
export function dobToISO(dob) {
  if (!dob || dob.length !== 10) return null;
  const [dd, mm, yyyy] = dob.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

export function calcBMR({ gender, weight, height, dob }) {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const a = dobToAge(dob);
  if (!w || !h || !a) return 0;
  return Math.round(
    gender === 'female'
      ? 10 * w + 6.25 * h - 5 * a - 161
      : 10 * w + 6.25 * h - 5 * a + 5
  );
}

export function calcTDEE(bmr, activityId) {
  const mult = ACTIVITY.find(x => x.id === activityId)?.mult || 1.55;
  return bmr ? Math.round(bmr * mult) : 0;
}

export function calcCalTarget(tdee, goal) {
  if (!tdee) return 0;
  if (goal === 'fat_loss') return tdee - 400;
  if (goal === 'muscle')   return tdee + 200;
  return tdee;
}

export function calcProtein(weight) {
  const w = parseFloat(weight);
  return w ? Math.round(w * 2) : 0;
}

export function calcBMI(weight, height) {
  const w = parseFloat(weight), h = parseFloat(height);
  return (w && h) ? (w / ((h / 100) ** 2)).toFixed(1) : null;
}

export function bmiStatus(bmi) {
  if (!bmi) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal weight ✅';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}