/**
 * services/foodScannerApi.js
 * Barcode  → OpenFoodFacts (free, no key needed)
 * AI Photo → Google Gemini Vision (optional)
 *
 * Set a key via:
 * - `.env`: EXPO_PUBLIC_GEMINI_API_KEY="..."
 * or
 * - `app.json` → expo.extra.geminiApiKey
 */
import Constants from "expo-constants";

const GEMINI_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  Constants.expoConfig?.extra?.geminiApiKey ||
  "";

function clamp(v) {
  return Math.max(0, parseFloat(v) || 0);
}

function healthScore(n) {
  let s = 50;
  s -= clamp(n["fat_100g"]) > 20 ? 15 : clamp(n["fat_100g"]) > 10 ? 7 : 0;
  s -=
    clamp(n["saturated-fat_100g"]) > 10
      ? 10
      : clamp(n["saturated-fat_100g"]) > 5
        ? 5
        : 0;
  s -=
    clamp(n["sugars_100g"]) > 20 ? 15 : clamp(n["sugars_100g"]) > 10 ? 7 : 0;
  s += clamp(n["fiber_100g"]) > 6 ? 15 : clamp(n["fiber_100g"]) > 3 ? 8 : 0;
  s +=
    clamp(n["proteins_100g"]) > 20
      ? 15
      : clamp(n["proteins_100g"]) > 10
        ? 8
        : 0;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function buildSuggestions({ protein, carbs, fat, calories }) {
  const tips = [];
  if (protein < 10)
    tips.push("Low in protein — pair with eggs, Greek yoghurt, or chicken.");
  if (carbs > 50)
    tips.push("High in carbs — ideal before a workout or pair with veggies.");
  if (fat > 15) tips.push("Contains fats — monitor your remaining daily fat budget.");
  if (calories > 500) tips.push("Calorie-dense — consider a lighter snack next meal.");
  if (!tips.length) tips.push("Well-balanced serving! Keep logging to stay on track.");
  tips.push("Drink water with this meal to support digestion and satiety.");
  return tips;
}

export async function lookupBarcode(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
  );
  if (!res.ok) throw new Error("Network error — check your connection");
  const json = await res.json();
  if (json.status !== 1 || !json.product)
    throw new Error("Product not found in database");

  const p = json.product;
  const n = p.nutriments ?? {};
  const serving = parseFloat(p.serving_size) || 100;
  const scale = serving / 100;

  const data = {
    name: p.product_name || p.product_name_en || "Unknown product",
    brand: p.brands || "",
    calories: Math.round(
      clamp(n["energy-kcal_serving"] || n["energy-kcal_100g"] * scale),
    ),
    protein: Math.round(clamp(n["proteins_serving"] || n["proteins_100g"] * scale)),
    carbs: Math.round(
      clamp(n["carbohydrates_serving"] || n["carbohydrates_100g"] * scale),
    ),
    fat: Math.round(clamp(n["fat_serving"] || n["fat_100g"] * scale)),
    fiber: Math.round(clamp(n["fiber_serving"] || n["fiber_100g"] * scale)),
    servingSize: Math.round(serving),
    servingUnit: "g",
    barcode,
    healthScore: healthScore(n),
    source: "barcode",
    confidence: 1,
  };
  data.suggestions = buildSuggestions(data);
  return data;
}

export async function analysePhotoWithAI(base64Image) {
  if (!GEMINI_KEY) return demoFoodResult();

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
  "suggestions": [string, string, string]
}
Base values on a typical visible serving. Be realistic.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } },
            ],
          },
        ],
      }),
    },
  );

  if (!res.ok) throw new Error("Gemini AI analysis failed");

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...parsed, source: "photo_ai", confidence: 0.9 };
  } catch {
    throw new Error("Could not read AI response — try again");
  }
}

export function demoFoodResult() {
  return {
    name: "Avocado Toast",
    brand: "",
    calories: 320,
    protein: 9,
    carbs: 28,
    fat: 19,
    fiber: 7,
    servingSize: 180,
    servingUnit: "g",
    barcode: null,
    healthScore: 84,
    suggestions: [
      "Add a poached egg for 6g extra protein and a more satisfying meal.",
      "Use whole-grain bread to boost fibre — aim for 25g+ daily.",
      "Great post-workout choice; healthy fats support muscle recovery.",
    ],
    source: "demo",
    confidence: 0.75,
  };
}

