import Link from 'next/link'
import { localePath } from '@/lib/i18n/paths'
import type { DisclaimerKind } from '@/lib/site/people'

const TEXT: Record<DisclaimerKind, { lead: string; body: string }> = {
  financial: {
    lead: 'For information and estimates only.',
    body:
      'Results are not tax, accounting, investment or legal advice. Rates, thresholds and rules change, so confirm figures with the relevant tax or regulatory authority or a qualified professional before you file, pay, sign or make a financial decision.',
  },
  health: {
    lead: 'For general information only.',
    body:
      'Results are estimates and are not medical advice, a diagnosis or a treatment plan. Speak to a qualified health professional about your own situation.',
  },
  general: {
    lead: 'For information and estimates only.',
    body:
      'Results depend on the figures you enter and the assumptions shown, so treat them as a guide and check anything important with a qualified professional.',
  },
}

export function ContentDisclaimer({
  locale,
  kind = 'general',
  reportLabel = 'Spotted an error? Tell us',
  className = '',
}: {
  locale: string
  kind?: DisclaimerKind
  reportLabel?: string
  className?: string
}) {
  const t = TEXT[kind]
  return (
    <aside
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ${className}`}
      aria-label="Disclaimer"
    >
      <p>
        <strong className="font-semibold">{t.lead}</strong> {t.body}{' '}
        <Link href={localePath(locale, '/disclaimer')} className="font-medium underline underline-offset-2">
          Full disclaimer
        </Link>
        {' · '}
        <Link href={localePath(locale, '/contact')} className="font-medium underline underline-offset-2">
          {reportLabel}
        </Link>
      </p>
    </aside>
  )
}
