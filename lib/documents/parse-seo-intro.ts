// lib/documents/parse-seo-intro.ts
//
// document_templates.seo_intro is plain text, not markdown or HTML:
// paragraphs and bare section headings separated by blank lines,
// ending in a "Frequently Asked Questions" block of alternating
// question/answer paragraphs. This has been true across every template
// checked (tenancy-agreement/ng, performance-appraisal/ng,
// employment-contract/gh, nda/ng, ...), so it's parsed generically here
// rather than requiring each of the ~85 rows to be rewritten.
//
// Pure, framework-agnostic, safe to import from both a Server Component
// (page.tsx, to build FAQPage schema) and a Client Component (client.tsx,
// to render the structured article).

export interface SeoIntroSection {
  /** null for a leading intro section with no heading of its own. */
  heading: string | null
  paragraphs: string[]
}

export interface SeoIntroFaq {
  question: string
  answer: string
}

export interface ParsedSeoIntro {
  sections: SeoIntroSection[]
  faqs: SeoIntroFaq[]
}

const FAQ_HEADING_RE = /^frequently asked questions$/i

// A block is a heading, not a paragraph, if it's short, single-line, and
// doesn't end like a sentence. Every heading seen so far ("Legal
// Framework and Governing Laws in Nigeria") fits this; every paragraph
// is longer and ends in normal sentence punctuation.
function looksLikeHeading(block: string): boolean {
  if (block.length > 80) return false
  if (block.includes('\n')) return false
  return !/[.!?]$/.test(block.trim())
}

// A block is FAQ-shaped ("Question? Answer text.") if it contains a '?'
// within a plausible question length, with real content after it. Some
// templates label the FAQ block with an explicit "Frequently Asked
// Questions" heading; others (e.g. tenancy-agreement/ng) just start the
// Q&A pairs directly after the last regular paragraph with no heading at
// all, so this fallback is what actually catches those.
function looksLikeFaqBlock(block: string): boolean {
  const qMarkIndex = block.indexOf('?')
  if (qMarkIndex < 10 || qMarkIndex > 100) return false
  return block.slice(qMarkIndex + 1).trim().length > 0
}

function splitFaqBlock(block: string): SeoIntroFaq {
  const qMarkIndex = block.indexOf('?')
  return {
    question: block.slice(0, qMarkIndex + 1).trim(),
    answer: block.slice(qMarkIndex + 1).trim(),
  }
}

export function parseSeoIntro(raw: string | null | undefined): ParsedSeoIntro {
  if (!raw || !raw.trim()) return { sections: [], faqs: [] }

  const blocks = raw
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean)

  // Pass 1: does an explicit "Frequently Asked Questions" heading exist?
  const faqHeadingIndex = blocks.findIndex(b => FAQ_HEADING_RE.test(b))

  let bodyBlocks: string[]
  let faqBlocks: string[]

  if (faqHeadingIndex !== -1) {
    bodyBlocks = blocks.slice(0, faqHeadingIndex)
    faqBlocks = blocks.slice(faqHeadingIndex + 1)
  } else {
    // Fallback: no heading -- walk back from the end and peel off any
    // trailing run of FAQ-shaped blocks. Stop at the first block (from
    // the end) that doesn't look like a Q&A pair.
    let splitAt = blocks.length
    while (splitAt > 0 && looksLikeFaqBlock(blocks[splitAt - 1])) {
      splitAt--
    }
    bodyBlocks = blocks.slice(0, splitAt)
    faqBlocks = blocks.slice(splitAt)
  }

  const faqs: SeoIntroFaq[] = faqBlocks.map(splitFaqBlock)

  const sections: SeoIntroSection[] = []
  let current: SeoIntroSection = { heading: null, paragraphs: [] }
  const flush = () => {
    if (current.heading || current.paragraphs.length > 0) sections.push(current)
  }

  for (const block of bodyBlocks) {
    if (looksLikeHeading(block)) {
      flush()
      current = { heading: block, paragraphs: [] }
    } else {
      current.paragraphs.push(block)
    }
  }
  flush()

  return { sections, faqs }
}
