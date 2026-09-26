// 📁 supabase/functions/content-quality-checker/index.ts
//
// Server-side path for the Google Content Quality Checker tool.
// - Keeps GEMINI_API_KEY secret (set via `supabase secrets set GEMINI_API_KEY=...`).
// - Paste mode sends the text straight to Gemini.
// - URL mode uses Gemini's built-in `url_context` tool so Gemini's own
//   infrastructure fetches the page — we never scrape HTML ourselves, so
//   there's no CORS/blocking concern on our end.
// - Logs a lightweight row per request (no page content, just metadata) for
//   basic abuse visibility and analytics — not used for caching or blocking
//   reruns, since users are expected to re-run after editing their content.
// - Applies a generous per-IP daily ceiling purely to stop unattended
//   scripted abuse from draining the Gemini quota; normal iterative use by
//   a real person never comes close to it.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_PRIMARY_MODEL = "gemini-3.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const MAX_PASTE_CHARS = 25000;
const DAILY_IP_LIMIT = 60;

const SYSTEM_PROMPT = `You are a content-quality evaluator using Google's publicly documented Search and AdSense content-quality guidance (helpful content, E-E-A-T, spam policies). You are NOT Google. Your score is this tool's own analytical score, not an official Google score or ranking prediction. Never claim the content will/won't rank, get indexed, or get AdSense-approved.

INPUT
Either raw pasted content, or a URL (use url_context to retrieve it). If a URL fails retrieval, say so plainly in "cannotEvaluate" — do not guess at its content.

RULES
- Distinguish observed facts, reasonable inferences, and unknowns. Never state an inference as fact ("no visible author" is fine; "the author is unqualified" is not).
- No universal word-count or keyword-density rules. Judge completeness against what THIS topic and intent actually need.
- Never call a claim "false" — say "unverified from supplied content" unless url_context contradicts it directly.
- A single page cannot prove site-wide patterns (duplication, doorway abuse, scaled content). Say "cannot be determined from this page alone."
- Don't treat AI-generated writing as automatically low quality; flag only the actual generic/formulaic characteristics you observe.

SCORING (100 pts total, do not change weights)
1. Originality & added value — 18
2. Helpfulness & user intent — 16
3. Depth & completeness — 14
4. Experience & expertise — 12
5. Trust, accuracy & evidence — 16
6. People-first quality — 10
7. Writing & presentation — 7
8. Low-value / manipulation risk — 7

Score each holistically against its point max (don't force sub-rubric arithmetic) but justify with 1-2 concrete pieces of evidence per category.

ALSO DETERMINE
- ymyl: NOT_YMYL | POSSIBLY_YMYL | YMYL (health/finance/legal/safety topics get stricter scrutiny of evidence & currency)
- freshness: CURRENT | PROBABLY_CURRENT | NEEDS_REVIEW | POTENTIALLY_OUTDATED | NOT_APPLICABLE
- confidence: HIGH | MEDIUM | LOW (based on how much usable content/context you actually had)
- criticalIssues: serious problems (e.g. unsupported high-stakes claims) that a high total score must not hide. Empty array if none.

OUTPUT — return ONLY this JSON, no markdown, no commentary outside it:
{
  "overall_score": number,
  "rating": "Excellent"|"Strong"|"Good"|"Needs Improvement"|"Weak"|"Poor",
  "ymyl": "NOT_YMYL"|"POSSIBLY_YMYL"|"YMYL",
  "freshness": "CURRENT"|"PROBABLY_CURRENT"|"NEEDS_REVIEW"|"POTENTIALLY_OUTDATED"|"NOT_APPLICABLE",
  "confidence": "HIGH"|"MEDIUM"|"LOW",
  "summary": string,
  "scores": {
    "originality": {"score": number, "max": 18, "note": string},
    "helpfulness": {"score": number, "max": 16, "note": string},
    "depth": {"score": number, "max": 14, "note": string},
    "experience": {"score": number, "max": 12, "note": string},
    "trust": {"score": number, "max": 16, "note": string},
    "peopleFirst": {"score": number, "max": 10, "note": string},
    "presentation": {"score": number, "max": 7, "note": string},
    "lowValueRisk": {"score": number, "max": 7, "note": string}
  },
  "criticalIssues": [{"issue": string, "evidence": string}],
  "strengths": [{"point": string, "evidence": string}],
  "problems": [{"issue": string, "severity": "HIGH"|"MEDIUM"|"LOW", "evidence": string, "fix": string}],
  "quickWins": [string],
  "cannotEvaluate": [string]
}

Rating bands (this tool's own, not Google's): 90-100 Excellent, 80-89 Strong, 70-79 Good, 60-69 Needs Improvement, 50-59 Weak, 0-49 Poor. Confirm scores sum correctly and each stays within its max before returning.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(model: string, body: unknown, apiKey: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Gemini request failed (${res.status})`);
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: { mode?: string; content?: string; url?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const mode = payload.mode === "url" ? "url" : "paste";

  if (mode === "paste") {
    if (!payload.content || payload.content.trim().length < 50) {
      return jsonResponse(
        { error: "Please paste at least a few sentences of content to analyze." },
        400,
      );
    }
    if (payload.content.length > MAX_PASTE_CHARS) {
      return jsonResponse(
        { error: `Content is too long. Please keep it under ${MAX_PASTE_CHARS.toLocaleString()} characters.` },
        400,
      );
    }
  } else {
    if (!payload.url || !/^https?:\/\//i.test(payload.url)) {
      return jsonResponse({ error: "Please enter a valid URL starting with http:// or https://" }, 400);
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiKey) {
    return jsonResponse({ error: "Server is not configured with a Gemini API key." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // ── Rate limit: generous, IP-based, resets daily. Best-effort — if the
  // count query fails we fail open rather than block a legitimate user.
  try {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("content_quality_checks")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ip)
      .gte("created_at", since.toISOString());

    if ((count ?? 0) >= DAILY_IP_LIMIT) {
      return jsonResponse(
        { error: "Daily analysis limit reached for your connection. Please try again tomorrow." },
        429,
      );
    }
  } catch {
    // fail open
  }

  const userText =
    mode === "url"
      ? `Analyze the content at this URL: ${payload.url}`
      : `Analyze this content:\n\n${payload.content}`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\n${userText}` }] }],
    ...(mode === "url" ? { tools: [{ url_context: {} }] } : {}),
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  };

  let data;
  try {
    data = await callGemini(GEMINI_PRIMARY_MODEL, requestBody, geminiKey);
  } catch {
    try {
      data = await callGemini(GEMINI_FALLBACK_MODEL, requestBody, geminiKey);
    } catch (err) {
      return jsonResponse(
        { error: "Analysis failed. Please try again in a moment.", detail: String(err) },
        502,
      );
    }
  }

  // If URL mode, check retrieval actually succeeded before trusting the result.
  if (mode === "url") {
    const urlMeta = data?.candidates?.[0]?.url_context_metadata?.url_metadata ?? [];
    const succeeded = urlMeta.some(
      (m: { url_retrieval_status?: string }) =>
        m.url_retrieval_status === "URL_RETRIEVAL_STATUS_SUCCESS",
    );
    if (urlMeta.length > 0 && !succeeded) {
      return jsonResponse(
        {
          error:
            "We couldn't retrieve that page's content. Please paste the article text instead.",
        },
        422,
      );
    }
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return jsonResponse({ error: "The analysis returned no result. Please try again." }, 502);
  }

  let result;
  try {
    const cleaned = rawText.replace(/```json\s*|```\s*$/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    return jsonResponse({ error: "Couldn't parse the analysis result. Please try again." }, 502);
  }

  // Best-effort logging — never let this fail the response to the user.
  try {
    await supabase.from("content_quality_checks").insert({
      ip_hash: ip,
      mode,
      source_url: mode === "url" ? payload.url : null,
      overall_score: result?.overall_score ?? null,
      ymyl: result?.ymyl ?? null,
    });
  } catch {
    // ignore
  }

  return jsonResponse(result);
});
