import { supabase } from "../lib/supabase";

const USER_PREFIX = "[USER]";
const ASSISTANT_PREFIX = "[ASSISTANT]";
const INSIGHT_TYPE_CANDIDATES = [
  "general",
  "habit",
  "workout",
  "nutrition",
  "recovery",
];

const encodeMessage = (role, content) => {
  const safeContent = String(content ?? "");
  return role === "user"
    ? `${USER_PREFIX} ${safeContent}`
    : `${ASSISTANT_PREFIX} ${safeContent}`;
};

const decodeMessage = (insightType, message) => {
  const text = String(message ?? "");
  if (text.startsWith(`${USER_PREFIX} `)) {
    return { role: "user", content: text.slice(USER_PREFIX.length + 1) };
  }
  if (text.startsWith(`${ASSISTANT_PREFIX} `)) {
    return {
      role: "assistant",
      content: text.slice(ASSISTANT_PREFIX.length + 1),
    };
  }

  // Backward compatibility for legacy rows that may have stored role in insight_type.
  const fallbackRole = insightType === "user" ? "user" : "assistant";
  return { role: fallbackRole, content: text };
};

const isCheckConstraintError = (error) => {
  if (!error) return false;
  return (
    error.code === "23514" ||
    /check constraint/i.test(String(error.message || ""))
  );
};

export const getChatHistory = async (userId) => {
  const { data, error } = await supabase
    .from("ai_insights")
    .select("insight_type, message")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    decodeMessage(row.insight_type, row.message),
  );
};

export const saveMessage = async (userId, role, content) => {
  const message = encodeMessage(role, content);

  let lastError = null;
  for (const insightType of INSIGHT_TYPE_CANDIDATES) {
    const { error } = await supabase
      .from("ai_insights")
      .insert({ user_id: userId, insight_type: insightType, message });

    if (!error) return;
    if (isCheckConstraintError(error)) {
      lastError = error;
      continue;
    }

    throw new Error(error.message);
  }

  if (lastError) throw new Error(lastError.message);
  throw new Error("Failed to save chat message.");
};
