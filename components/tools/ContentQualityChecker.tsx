'use client'

import { useState } from 'react'
import { createSupabasePublicClient } from '@/lib/supabase/client'
import {
  buildGeminiRequestBody,
  parseGeminiJson,
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  MAX_PASTE_CHARS,
  type ContentQualityResult,
} from '@/lib/ai/contentQualityPrompt'

type Mode = 'paste' | 'url'

const CATEGORY_LABELS: Record<keyof ContentQualityResult['scores'], string> = {
  originality: 'Originality & Added Value',
  helpfulness: 'Helpfulness & User Intent',
  depth: 'Depth & Completeness',
  experience: 'Experience & Expertise',
  trust: 'Trust, Accuracy & Evidence',
  peopleFirst: 'People-First Quality',
  presentation: 'Writing & Presentation',
  lowValueRisk: 'Low-Value / Manipulation Risk',
}

const RATING_COLOR: Record<string, string> = {
  Excellent: 'text-green-700 bg-green-50',
  Strong: 'text-green-700 bg-green-50',
  Good: 'text-amber-700 bg-amber-50',
  'Needs Improvement': 'text-orange-700 bg-orange-50',
  Weak: 'text-red-700 bg-red-50',
  Poor: 'text-red-700 bg-red-50',
}

async function callGeminiDirect(apiKey: string, mode: Mode, content: string, url: string) {
  const body = buildGeminiRequestBody(mode === 'url' ? { mode, url } : { mode, content })

  async function attempt(model: string) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? `Gemini request failed (${res.status})`)
    return data
  }

  let data
  try {
    data = await attempt(GEMINI_PRIMARY_MODEL)
  } catch {
    data = await attempt(GEMINI_FALLBACK_MODEL)
  }

  if (mode === 'url') {
    const urlMeta = data?.candidates?.[0]?.url_context_metadata?.url_metadata ?? []
    const succeeded = urlMeta.some(
      (m: { url_retrieval_status?: string }) => m.url_retrieval_status === 'URL_RETRIEVAL_STATUS_SUCCESS'
    )
    if (urlMeta.length > 0 && !succeeded) {
      throw new Error("We couldn't retrieve that page's content. Please paste the article text instead.")
    }
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('The analysis returned no result. Please try again.')
  return parseGeminiJson(rawText)
}

export default function ContentQualityChecker() {
  const [mode, setMode] = useState<Mode>('paste')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [useOwnKey, setUseOwnKey] = useState(false)
  const [ownKey, setOwnKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ContentQualityResult | null>(null)

  const canSubmit =
    !loading &&
    ((mode === 'paste' && content.trim().length >= 50) ||
      (mode === 'url' && /^https?:\/\//i.test(url.trim()))) &&
    (!useOwnKey || ownKey.trim().length > 0)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      if (useOwnKey) {
        const data = await callGeminiDirect(ownKey.trim(), mode, content, url.trim())
        setResult(data)
      } else {
        const supabase = createSupabasePublicClient()
        const { data, error: fnError } = await supabase.functions.invoke('content-quality-checker', {
          body: mode === 'url' ? { mode, url: url.trim() } : { mode, content },
        })
        if (fnError) throw new Error(fnError.message ?? 'Analysis failed. Please try again.')
        if (data?.error) throw new Error(data.error)
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* ── Mode toggle ── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('paste')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Paste Content
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'url' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Analyze URL
        </button>
      </div>

      {mode === 'paste' ? (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_PASTE_CHARS))}
            placeholder="Paste your article, blog post, or guide here..."
            rows={10}
            className="w-full rounded-xl border border-gray-300 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {content.length.toLocaleString()} / {MAX_PASTE_CHARS.toLocaleString()} characters
          </p>
        </div>
      ) : (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {/* ── BYOK ── */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={useOwnKey}
            onChange={(e) => setUseOwnKey(e.target.checked)}
            className="rounded border-gray-300"
          />
          Use my own Gemini API key
        </label>
        {useOwnKey && (
          <div className="mt-2">
            <input
              type="password"
              value={ownKey}
              onChange={(e) => setOwnKey(e.target.value)}
              placeholder="Paste your Gemini API key"
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Sent directly from your browser to Google&apos;s Gemini API. It never touches our servers and
              isn&apos;t stored — you&apos;ll need to re-enter it next time.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!canSubmit}
        className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing…' : 'Analyze Content'}
      </button>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">Content Quality Score</p>
            <p className="text-5xl font-black text-gray-900 mt-1">{result.overall_score}/100</p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                RATING_COLOR[result.rating] ?? 'bg-gray-50 text-gray-700'
              }`}
            >
              {result.rating}
            </span>
            <p className="text-gray-600 mt-3">{result.summary}</p>
            <p className="text-xs text-gray-400 mt-3">
              This is our own analytical score based on Google&apos;s published content guidance — not an
              official Google score. YMYL: {result.ymyl.replace('_', ' ')} · Freshness:{' '}
              {result.freshness.replace(/_/g, ' ')} · Confidence: {result.confidence}
            </p>
          </div>

          {result.criticalIssues.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800 mb-2">🔴 Critical issues</p>
              <ul className="space-y-2">
                {result.criticalIssues.map((c, i) => (
                  <li key={i} className="text-sm text-red-700">
                    <span className="font-medium">{c.issue}</span> — {c.evidence}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-2">
                The overall score above should not be read as overriding these issues.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 p-5">
            <p className="font-semibold text-gray-900 mb-3">Score breakdown</p>
            <div className="space-y-2">
              {(Object.keys(result.scores) as (keyof ContentQualityResult['scores'])[]).map((key) => {
                const s = result.scores[key]
                const pct = Math.round((s.score / s.max) * 100)
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>{CATEGORY_LABELS[key]}</span>
                      <span className="font-medium">
                        {s.score}/{s.max}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full mt-1">
                      <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{s.note}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {result.strengths.length > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-green-800 mb-2">🟢 What this content does well</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-800">
                    <span className="font-medium">{s.point}</span> — {s.evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.problems.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-900 mb-3">🛠 Improvements</p>
              <div className="space-y-3">
                {result.problems.map((p, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium text-gray-800">
                      {p.issue}{' '}
                      <span className="text-xs uppercase text-gray-400 ml-1">{p.severity}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{p.evidence}</p>
                    <p className="text-sm text-indigo-700 mt-0.5">Fix: {p.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.quickWins.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-900 mb-2">Quick wins</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {result.quickWins.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {result.cannotEvaluate.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-700 mb-2">⚠️ What this analysis couldn&apos;t evaluate</p>
              <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                {result.cannotEvaluate.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
