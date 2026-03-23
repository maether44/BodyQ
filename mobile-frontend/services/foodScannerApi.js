/**
 * src/services/foodScannerApi.js
 * Barcode  → OpenFoodFacts (free, no key needed)
 * AI Photo → Google Gemini Vision
 *
 * Keys live in app.json > extra:
 *   "geminiApiKey": "AIza..."
 */
import Constants from 'expo-constants';

const GEMINI_KEY = Constants.expoConfig?.extra?.geminiApiKey ?? '';

function clamp(v) { return Math.max(0, parseFloat(v) || 0); }

function healthScore(n) {
  let s = 50;
  s -= clamp(n['fat_100g']) > 20 ? 15 : clamp(n['fat_100g']) > 10 ? 7 : 0;
  s -= clamp(n['saturated-fat_100g']) > 10 ? 10 : clamp(n['saturated-fat_100g']) > 5 ? 5 : 0;
  s -= clamp(n['sugars_100g']) > 20 ? 15 : clamp(n['sugars_100g']) > 10 ? 7 : 0;
  s += clamp(n['fiber_100g']) > 6 ? 15 : clamp(n['fiber_100g']) > 3 ? 8 : 0;
  s += clamp(n['proteins_100g']) > 20 ? 15 : clamp(n['proteins_100g']) > 10 ? 8 : 0;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function buildSuggestions({ protein, carbs, fat, calories }) {
  const tips = [];
  if (protein < 10) tips.push('Low in protein — pair with eggs, Greek yoghurt, or chicken.');
  if (carbs > 50) tips.push('High in carbs — ideal before a workout or pair with veggies.');
  if (fat > 15) tips.push('Contains fats — monitor your remaining daily fat budget.');
  if (calories > 500) tips.push('Calorie-dense — consider a lighter snack next meal.');
  if (!tips.length) tips.push('Well-balanced serving! Keep logging to stay on track.');
  tips.push('Drink water with this meal to support digestion and satiety.');
  return tips;
}

// ── 1. Barcode via OpenFoodFacts ──────────────────────────────────────────────
export async function lookupBarcode(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  );
  if (!res.ok) throw new Error('Network error — check your connection');
  const json = await res.json();
  if (json.status !== 1 || !json.product) throw new Error('Product not found in database');

  const p = json.product;
  const n = p.nutriments ?? {};
  const serving = parseFloat(p.serving_size) || 100;
  const scale = serving / 100;

  const data = {
    name: p.product_name || p.product_name_en || 'Unknown product',
    brand: p.brands || '',
    calories: Math.round(clamp(n['energy-kcal_serving'] || n['energy-kcal_100g'] * scale)),
    protein: Math.round(clamp(n['proteins_serving'] || n['proteins_100g'] * scale)),
    carbs: Math.round(clamp(n['carbohydrates_serving'] || n['carbohydrates_100g'] * scale)),
    fat: Math.round(clamp(n['fat_serving'] || n['fat_100g'] * scale)),
    fiber: Math.round(clamp(n['fiber_serving'] || n['fiber_100g'] * scale)),
    servingSize: Math.round(serving),
    servingUnit: 'g',
    barcode,
    healthScore: healthScore(n),
    source: 'barcode',
    confidence: 0.98,
  };
  data.suggestions = buildSuggestions(data);
  return data;
}

// Normalize base64: Gemini expects raw base64, not "data:image/...;base64,..."
function normalizeBase64(input) {
  if (typeof input !== 'string' || !input) return '';
  const base64 = input.replace(/^data:image\/\w+;base64,/, '');
  return base64.trim();
}

// When API fails (rate limit, network, etc.) we always return this so the app still works
function getAlwaysWorksFallback() {
  return {
    name: 'Meal (from photo)',
    brand: '',
    calories: 350,
    protein: 18,
    carbs: 38,
    fat: 14,
    fiber: 4,
    servingSize: 200,
    servingUnit: 'g',
    barcode: null,
    healthScore: 65,
    source: 'estimate',
    confidence: 0.5,
    suggestions: [
      'AI was unavailable — values are estimates. You can edit this entry in your diary.',
      'Adjust calories and macros in Nutrition if needed.',
      'Use barcode scan next time for precise values when the API is busy.',
    ],
  };
}

// Cache same photo for 3 min so double-tap / retry doesn't hit the API again
const CACHE_TTL_MS = 3 * 60 * 1000;
let photoCache = { key: '', result: null, ts: 0 };
function cacheKey(base64) {
  const len = base64?.length ?? 0;
  const head = (base64 || '').slice(0, 80);
  return `${len}-${head}`;
}

// ── 2. AI Photo via Gemini Vision (fallback to estimate so it always works) ───
export async function analysePhotoWithAI(base64Image) {
  const rawBase64 = normalizeBase64(base64Image);
  if (!rawBase64) throw new Error('No image data — try taking the photo again');

  const key = cacheKey(rawBase64);
  if (photoCache.key === key && Date.now() - photoCache.ts < CACHE_TTL_MS && photoCache.result) {
    return photoCache.result;
  }

  if (!GEMINI_KEY) {
    const demo = demoFoodResult();
    const out = { ...demo, source: demo.source ?? 'demo', confidence: demo.confidence ?? 0.75 };
    photoCache = { key, result: out, ts: Date.now() };
    return out;
  }

  const prompt = `You are a nutrition expert AI.
Analyse this food photo and respond ONLY with valid JSON — no markdown, no explanation.
Schema:
{
  "name": string,
  "brand": "",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "servingSize": number,
  "servingUnit": "g",
  "healthScore": number (0-100),
  "suggestions": [string, string, string],
  "confidence": number
}
Base values on a typical visible serving. Be realistic.`;

  const modelIds = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
  let lastError = null;

  for (const modelId of modelIds) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: rawBase64 } },
              ],
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404) {
          lastError = new Error(`Model ${modelId} not available`);
          continue;
        }
        if (res.status === 403) {
          lastError = new Error('Invalid API key or access denied. Check app.json extra.geminiApiKey.');
          break;
        }
        lastError = new Error(json?.error?.message || `HTTP ${res.status}`);
        if (res.status === 429) break;
        continue;
      }

      const candidate = json.candidates?.[0];
      const blockReason = candidate?.finishReason;
      if (blockReason && blockReason !== 'STOP' && blockReason !== 'MAX_TOKENS') {
        lastError = new Error('Image could not be analysed.');
        continue;
      }

      const text = candidate?.content?.parts?.[0]?.text ?? '';
      if (!text) {
        lastError = new Error('No response from AI');
        continue;
      }

      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      const out = {
        ...parsed,
        source: parsed.source ?? 'photo_ai',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      };
      photoCache = { key, result: out, ts: Date.now() };
      return out;
    } catch (e) {
      lastError = e;
      if (e.message?.includes('API key')) break;
    }
  }

  const fallback = getAlwaysWorksFallback();
  photoCache = { key, result: fallback, ts: Date.now() };
  return fallback;
}

// ── Demo fallback (shown when no Gemini key is set) ───────────────────────────
export function demoFoodResult() {
  return {
    name: 'Avocado Toast',
    brand: '',
    calories: 320,
    protein: 9,
    carbs: 28,
    fat: 19,
    fiber: 7,
    servingSize: 180,
    servingUnit: 'g',
    barcode: null,
    healthScore: 84,
    source: 'demo',
    confidence: 0.75,
    suggestions: [
      'Add a poached egg for 6g extra protein and a more satisfying meal.',
      'Use whole-grain bread to boost fibre — aim for 25g+ daily.',
      'Great post-workout choice; healthy fats support muscle recovery.',
    ],
  };
}