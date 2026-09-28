// 📁 supabase/functions/fetch-url-content/index.ts
//
// Fetches a page's raw HTML server-side and returns it after stripping
// <script>/<style>/comments — no content extraction, no readability
// heuristics, just noise removal. This is NOT a scraper: we don't parse out
// "the article" or guess at structure, we hand back the page's own markup
// and let Gemini read it.
//
// Why this exists as its own public function (no API key required): a
// browser can't fetch arbitrary third-party sites directly (the target
// site's own CORS policy blocks it, not ours) — only a server can. This
// lets the BYOK client-side path get page HTML without ever routing the
// user's Gemini key through our backend.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_HTML_CHARS = 200000;
const FETCH_TIMEOUT_MS = 15000;
const MAX_RESPONSE_BYTES = 5_000_000; // 5MB cap before we even start cleaning

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanHtml(html: string): { html: string; truncated: boolean } {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  if (cleaned.length <= MAX_HTML_CHARS) return { html: cleaned, truncated: false };
  return { html: cleaned.slice(0, MAX_HTML_CHARS), truncated: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let payload: { url?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  if (!payload.url || !/^https?:\/\//i.test(payload.url)) {
    return jsonResponse({ error: "Please enter a valid URL starting with http:// or https://" }, 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(payload.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ContentQualityCheckerBot/1.0; +https://onlinetools.com.ng)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return jsonResponse(
        {
          error: `We couldn't retrieve that page (server responded with ${res.status}). Please paste the article text instead.`,
        },
        422,
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      return jsonResponse(
        { error: "That URL doesn't appear to be a web page. Please paste the article text instead." },
        422,
      );
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_RESPONSE_BYTES) {
      return jsonResponse(
        { error: "That page is too large to analyze. Please paste the relevant article text instead." },
        422,
      );
    }

    const html = new TextDecoder("utf-8").decode(buf);
    const { html: cleaned, truncated } = cleanHtml(html);

    if (cleaned.trim().length < 100) {
      return jsonResponse(
        {
          error:
            "We couldn't find readable content on that page (it may be rendered by JavaScript). Please paste the article text instead.",
        },
        422,
      );
    }

    return jsonResponse({ html: cleaned, finalUrl: res.url, truncated });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return jsonResponse(
      {
        error: timedOut
          ? "That page took too long to respond. Please paste the article text instead."
          : "We couldn't retrieve that page. Please paste the article text instead.",
      },
      422,
    );
  } finally {
    clearTimeout(timeout);
  }
});
