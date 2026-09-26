// 📁 lib/ai/contentQualityPrompt.ts
//
// Shared system prompt for the Google Content Quality Checker tool.
// Used by BOTH the server path (supabase/functions/content-quality-checker)
// and the client-side BYOK path (components/tools/ContentQualityChecker.tsx).
// Keep these in sync manually — the edge function is a separate Deno
// deployment and can't import straight from this file.

export const CONTENT_QUALITY_SYSTEM_PROMPT = `You are a content-quality evaluator using Google's publicly documented Search and AdSense content-quality guidance (helpful content, E-E-A-T, spam policies). You are NOT Google. Your score is this tool's own analytical score, not an official Google score or ranking prediction. Never claim the content will/won't rank, get indexed, or get AdSense-approved.

INPUT
You'll receive either plain pasted text, or the page's raw HTML (script/style tags already stripped, but nav, header, footer and ad markup may still be present). When given HTML: read through the markup, identify the actual article/body content using structural cues (title, h1, article tags, heading hierarchy), and evaluate THAT — don't score navigation links, boilerplate footers, or cookie-notice text as if they were the article's own content, but you may note in "cannotEvaluate" if the page structure made this hard to separate cleanly.

RULES
- Distinguish observed facts, reasonable inferences, and unknowns. Never state an inference as fact ("no visible author" is fine; "the author is unqualified" is not).
- No universal word-count or keyword-density rules. Judge completeness against what THIS topic and intent actually need.
- Never call a claim "false" — say "unverified from supplied content" unless the supplied content directly contradicts it.
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

Rating bands (this tool's own, not Google's): 90-100 Excellent, 80-89 Strong, 70-79 Good, 60-69 Needs Improvement, 50-59 Weak, 0-49 Poor. Confirm scores sum correctly and each stays within its max before returning.`

export const GEMINI_PRIMARY_MODEL = 'gemini-3.5-flash'
export const GEMINI_FALLBACK_MODEL = 'gemini-3.5-flash-lite'

export const MAX_PASTE_CHARS = 25000 // ~4-5k words; generous for a long article, cheap enough per call
export const MAX_HTML_CHARS = 60000 // raw HTML is noisier than plain text, so a larger cap
export const FETCH_TIMEOUT_MS = 15000

/** Strips <script>, <style>, HTML comments and truncates. Not content extraction —
 *  just noise removal. Gemini reads the remaining markup itself (see prompt). */
export function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, MAX_HTML_CHARS)
}

export type ContentQualityScoreBlock = { score: number; max: number; note: string }

export type ContentQualityResult = {
  overall_score: number
  rating: 'Excellent' | 'Strong' | 'Good' | 'Needs Improvement' | 'Weak' | 'Poor'
  ymyl: 'NOT_YMYL' | 'POSSIBLY_YMYL' | 'YMYL'
  freshness: 'CURRENT' | 'PROBABLY_CURRENT' | 'NEEDS_REVIEW' | 'POTENTIALLY_OUTDATED' | 'NOT_APPLICABLE'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  summary: string
  scores: {
    originality: ContentQualityScoreBlock
    helpfulness: ContentQualityScoreBlock
    depth: ContentQualityScoreBlock
    experience: ContentQualityScoreBlock
    trust: ContentQualityScoreBlock
    peopleFirst: ContentQualityScoreBlock
    presentation: ContentQualityScoreBlock
    lowValueRisk: ContentQualityScoreBlock
  }
  criticalIssues: { issue: string; evidence: string }[]
  strengths: { point: string; evidence: string }[]
  problems: { issue: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; evidence: string; fix: string }[]
  quickWins: string[]
  cannotEvaluate: string[]
}

/** Strips ```json fences some models add despite instructions, then parses. */
export function parseGeminiJson(text: string): ContentQualityResult {
  const cleaned = text.replace(/```json\s*|```\s*$/g, '').trim()
  return JSON.parse(cleaned) as ContentQualityResult
}

/** Builds the Gemini generateContent request body. By this point `content` is
 * always plain text or already-fetched/cleaned HTML — there is no separate
 * "url mode" at the Gemini-call level, since URL fetching happens before this. */
export function buildGeminiRequestBody(content: string, sourceUrl?: string) {
  const userText = sourceUrl
    ? `Source URL: ${sourceUrl}\n\nPage content (HTML, script/style already stripped):\n\n${content}`
    : `Analyze this content:\n\n${content}`

  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${CONTENT_QUALITY_SYSTEM_PROMPT}\n\n---\n\n${userText}` }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  }
}
