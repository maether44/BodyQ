const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY!;

function buildPrompt(answers) {
  const {
    goal,
    gender,
    age,
    height,
    weight,
    targetW,
    activity,
    experience,
    injuries,
    days,
    duration,
    timeOfDay,
    equipment,
    focus,
    sleep,
    stress,
    diet,
    calTarget,
    protein,
  } = answers;

  const injList = injuries?.filter((x) => x !== "none").join(", ") || "none";
  const focusList = focus?.join(", ") || "balanced";
  const goalLabel = {
    fat_loss: "lose body fat",
    muscle: "build muscle",
    maintain: "stay healthy",
    athletic: "athletic performance",
  }[goal];

  return `You are an expert fitness coach. Create a highly personalised ${days}-day training plan for this user.

USER PROFILE:
- Goal: ${goal} (${goalLabel})
- Gender: ${gender}, Age: ${age}, Height: ${height}cm, Weight: ${weight}kg${targetW ? `, Target: ${targetW}kg` : ""}
- Experience: ${experience}
- Equipment: ${equipment}
- Training: ${days} days/week, ${duration} min per session, ${timeOfDay} time preferred
- Focus areas: ${focusList}
- Injuries/limitations: ${injList}
- Sleep: ${sleep}, Stress: ${stress}, Diet: ${diet}
- Daily calorie target: ${calTarget} kcal, Protein: ${protein}g/day
- Activity level: ${activity}

Generate a ${days}-day weekly training split. For each day provide:
1. Session name (e.g. "Push Day", "Full Body A", "Legs & Glutes")
2. Exactly 5 exercises suited to their equipment, injuries, and focus areas
3. Sets × reps and rest time for each exercise — appropriate for their experience level and goal
4. One personalised coaching tip for that day

Also provide:
- A 2-sentence nutrition note based on their goal and diet preference
- One recovery tip based on their sleep and stress level
- One motivational note personalised to their specific situation

Be specific, practical, and genuinely tailored. Do NOT give generic advice. Reference their actual stats.

CRITICAL: Respond with ONLY a JSON object. No markdown. No code fences. No explanation. Start your response with { and end with }.
Use this exact structure:
{"intro":"string","days":[{"name":"string","focus":"string","exercises":[{"name":"string","sets":3,"reps":"string","rest":"string"}],"coachTip":"string"}],"nutritionNote":"string","recoveryNote":"string","motivationNote":"string"}`;
}

function parseGroqResponse(text) {
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  let clean = jsonMatch[0];
  try {
    return JSON.parse(clean);
  } catch (e) {}

  clean = clean
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, " ");

  const opens = (clean.match(/{/g) || []).length;
  const closes = (clean.match(/}/g) || []).length;
  for (let i = 0; i < opens - closes; i++) clean += "}";

  const aOpens = (clean.match(/\[/g) || []).length;
  const aCloses = (clean.match(/\]/g) || []).length;
  for (let i = 0; i < aOpens - aCloses; i++) clean += "]";

  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error("Could not parse AI response. Please retry.");
  }
}

export async function generateAIPlan(answers) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 4096,
      temperature: 0.4,
      messages: [{ role: "user", content: buildPrompt(answers) }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data?.error));

  const text = data.choices?.[0]?.message?.content ?? "";
  return parseGroqResponse(text);
}
