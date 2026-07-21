'use client'

import { useMemo, useState } from 'react'

type Direction = 'employee' | 'contractor'
type Category = 'Control' | 'Integration' | 'Economic Reality' | 'Other'
type Answer = 'yes' | 'no' | 'unsure' | null

interface Question {
  id: string
  category: Category
  text: string
  hint: string
  direction: Direction // what a "Yes" answer leans toward
  weight: number
}

const QUESTIONS: Question[] = [
  // Control — the primary test in Nigerian case law (Shena Security v Afropak)
  {
    id: 'q1',
    category: 'Control',
    text: 'Does the engager set fixed working hours or a fixed schedule?',
    hint: 'E.g. "resume 8am, close 5pm, Mon–Fri" vs. the worker choosing when to work.',
    direction: 'employee',
    weight: 3,
  },
  {
    id: 'q2',
    category: 'Control',
    text: 'Does the engager dictate exactly how the work should be done, not just what result is expected?',
    hint: 'Step-by-step instructions and required procedures point to control; being judged only on the finished deliverable does not.',
    direction: 'employee',
    weight: 3,
  },
  {
    id: 'q3',
    category: 'Control',
    text: "Must the work be performed at the engager's premises?",
    hint: 'A fixed desk in the office vs. working from anywhere, including a personal or client-choice location.',
    direction: 'employee',
    weight: 2,
  },
  {
    id: 'q4',
    category: 'Control',
    text: 'Does the engager supply the main tools, equipment, or software used for the work?',
    hint: 'Company laptop, uniform, or licensed software vs. the worker using their own equipment.',
    direction: 'employee',
    weight: 2,
  },
  {
    id: 'q5',
    category: 'Control',
    text: 'Is the worker directly and regularly supervised by engager staff?',
    hint: 'A line manager reviewing day-to-day work vs. only a final handover or milestone check.',
    direction: 'employee',
    weight: 2,
  },
  // Integration — is the worker part of the core business
  {
    id: 'q6',
    category: 'Integration',
    text: "Does the worker appear on the company's org chart or carry a company job title?",
    hint: 'E.g. "Marketing Officer, Acme Ltd" on a business card or LinkedIn.',
    direction: 'employee',
    weight: 2,
  },
  {
    id: 'q7',
    category: 'Integration',
    text: 'Does the worker perform core, ongoing business functions rather than a one-off, specialist task?',
    hint: 'A cashier at a retail shop is core to the business; an external auditor engaged once a year is not.',
    direction: 'employee',
    weight: 2,
  },
  {
    id: 'q8',
    category: 'Integration',
    text: "Does the worker use a company email address, staff ID, or represent the company externally?",
    hint: 'Signing off as "@company.com" vs. invoicing from a personal or separate business identity.',
    direction: 'employee',
    weight: 1.5,
  },
  {
    id: 'q9',
    category: 'Integration',
    text: 'Is the worker required to work exclusively for this engager, with no other clients allowed?',
    hint: 'A non-compete or exclusivity clause points to employment; freedom to take other clients points to contracting.',
    direction: 'employee',
    weight: 2,
  },
  // Economic reality — who bears the risk
  {
    id: 'q10',
    category: 'Economic Reality',
    text: 'Is the worker paid a fixed salary or wage regardless of output, sales, or results?',
    hint: 'Same amount every month vs. pay that rises and falls with deliverables invoiced.',
    direction: 'employee',
    weight: 2.5,
  },
  {
    id: 'q11',
    category: 'Economic Reality',
    text: 'Does the worker bear real financial risk — could they lose money on this engagement?',
    hint: 'A contractor who under-quotes a job absorbs the loss; an employee is paid regardless of whether the employer profits.',
    direction: 'contractor',
    weight: 2.5,
  },
  {
    id: 'q12',
    category: 'Economic Reality',
    text: 'Can the worker take on other clients or run this alongside other paid work?',
    hint: 'Operating like an independent business serving several customers points to contracting.',
    direction: 'contractor',
    weight: 2,
  },
  {
    id: 'q13',
    category: 'Economic Reality',
    text: 'Does the worker invoice for specific deliverables or milestones, rather than receiving regular periodic pay?',
    hint: 'A per-project invoice vs. a recurring payroll credit on a fixed date.',
    direction: 'contractor',
    weight: 2,
  },
  // Other factors
  {
    id: 'q14',
    category: 'Other',
    text: 'Can the worker send a qualified substitute or delegate to do the work instead of them personally?',
    hint: 'A genuine right of substitution is a strong contractor signal; a requirement of personal service points to employment.',
    direction: 'contractor',
    weight: 2,
  },
  {
    id: 'q15',
    category: 'Other',
    text: 'Is the engagement open-ended or indefinite, rather than tied to a specific project or fixed term?',
    hint: 'No end date, ongoing relationship vs. a defined project with a clear completion point.',
    direction: 'employee',
    weight: 1.5,
  },
]

const TOTAL_WEIGHT = QUESTIONS.reduce((sum, q) => sum + q.weight, 0)

function scoreFor(q: Question, answer: Answer): { employee: number; contractor: number } {
  if (!answer || answer === 'unsure') return { employee: 0, contractor: 0 }
  const answeredYes = answer === 'yes'
  const leansEmployee = (q.direction === 'employee') === answeredYes
  return leansEmployee
    ? { employee: q.weight, contractor: 0 }
    : { employee: 0, contractor: q.weight }
}

export function ContractorVsEmployeeClassifier({ locale }: { locale: string }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [role, setRole] = useState('')
  const [payment, setPayment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const answeredCount = Object.values(answers).filter((a) => a && a !== 'unsure').length

  const result = useMemo(() => {
    let employeeScore = 0
    let contractorScore = 0
    let answeredWeight = 0
    const contributions: { q: Question; leans: Direction }[] = []

    for (const q of QUESTIONS) {
      const a = answers[q.id] ?? null
      if (a && a !== 'unsure') answeredWeight += q.weight
      const s = scoreFor(q, a)
      employeeScore += s.employee
      contractorScore += s.contractor
      if (s.employee > 0) contributions.push({ q, leans: 'employee' })
      if (s.contractor > 0) contributions.push({ q, leans: 'contractor' })
    }

    const scored = employeeScore + contractorScore
    const employeePercent = scored > 0 ? Math.round((employeeScore / scored) * 100) : 0

    // Edge case: if every Control question leans strongly employee, don't let a
    // scattering of "Other" answers pull the overall lean below "Strong Employee".
    const controlQs = QUESTIONS.filter((q) => q.category === 'Control')
    const controlAnswered = controlQs.filter((q) => answers[q.id] && answers[q.id] !== 'unsure')
    const controlEmployeeWeight = controlQs.reduce((sum, q) => {
      const s = scoreFor(q, answers[q.id] ?? null)
      return sum + s.employee
    }, 0)
    const controlTotalWeight = controlQs.reduce((sum, q) => sum + q.weight, 0)
    const strongControlOverride =
      controlAnswered.length === controlQs.length && controlEmployeeWeight / controlTotalWeight >= 0.8

    let label: string
    let tone: 'employee' | 'contractor' | 'mixed'
    if (strongControlOverride || employeePercent >= 65) {
      label = 'Strong Employee Indicators'
      tone = 'employee'
    } else if (employeePercent <= 35 && scored > 0) {
      label = 'Strong Contractor Indicators'
      tone = 'contractor'
    } else if (scored === 0) {
      label = 'Not enough information yet'
      tone = 'mixed'
    } else {
      label = 'Mixed — Grey Area, Review Closely'
      tone = 'mixed'
    }

    const topReasons = contributions
      .sort((a, b) => b.q.weight - a.q.weight)
      .filter((c) => c.leans === (tone === 'contractor' ? 'contractor' : 'employee'))
      .slice(0, 4)

    return {
      employeePercent: scored > 0 ? employeePercent : null,
      label,
      tone,
      topReasons,
      completeness: Math.round((answeredWeight / TOTAL_WEIGHT) * 100),
    }
  }, [answers])

  const setAnswer = (id: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleReset = () => {
    setAnswers({})
    setRole('')
    setPayment('')
    setSubmitted(false)
  }

  const categories: Category[] = ['Control', 'Integration', 'Economic Reality', 'Other']

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Intro / disclaimer */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Contractor vs Employee Classifier (Nigeria)
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Nigerian law separates a <strong>contract of service</strong> (employee, covered by the
          Labour Act) from a <strong>contract for services</strong> (independent contractor).
          Courts and tax authorities look past the label in a written agreement and apply a
          &quot;totality of circumstances&quot; test — control, integration into the business, and
          economic reality all matter. Answer the questions below to see which way a working
          relationship likely leans.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          This tool gives an indicative assessment only, not legal advice. Final classification is
          decided by the National Industrial Court or the relevant tax authority based on the full
          facts. Consult a labour lawyer or tax professional before acting on the result.
        </p>
      </div>

      {/* Optional context fields */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Role description (optional)</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Social media manager"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Payment structure (optional)</label>
          <input
            type="text"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            placeholder="e.g. Monthly salary, or per-invoice"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Questionnaire */}
      {categories.map((cat) => (
        <div key={cat} className="rounded-2xl bg-white border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-3">
            {cat}
          </h3>
          <div className="space-y-4">
            {QUESTIONS.filter((q) => q.category === cat).map((q) => (
              <div key={q.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm text-gray-800" title={q.hint}>
                  {q.text}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{q.hint}</p>
                <div className="mt-2 flex gap-2">
                  {(['yes', 'no', 'unsure'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.id, opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        answers[q.id] === opt
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not sure'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          See classification ({answeredCount}/{QUESTIONS.length} answered)
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl bg-white border border-gray-300 text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
        {submitted && (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-white border border-gray-300 text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Print / Save summary
          </button>
        )}
      </div>

      {/* Results */}
      {submitted && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6 space-y-5">
          <div>
            <p className="text-xs text-gray-500">
              {answeredCount < QUESTIONS.length
                ? `Based on ${answeredCount} of ${QUESTIONS.length} questions answered — answer more for a fuller picture.`
                : 'Based on all questions answered.'}
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">{result.label}</h3>
            {result.employeePercent !== null && (
              <div className="mt-3">
                <div className="h-3 w-full rounded-full bg-white overflow-hidden border border-gray-200">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${result.employeePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Employee lean {result.employeePercent}%</span>
                  <span>Contractor lean {100 - result.employeePercent}%</span>
                </div>
              </div>
            )}
            {(role || payment) && (
              <p className="text-xs text-gray-500 mt-2">
                {role && <>Role: {role}. </>}
                {payment && <>Payment: {payment}.</>}
              </p>
            )}
          </div>

          {result.topReasons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Key reasons</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {result.topReasons.map((r) => (
                  <li key={r.q.id}>{r.q.text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Implications */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">If treated as Employee</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>Covered by the Labour Act: leave, notice period, and other worker protections apply.</li>
                <li>Employer withholds PAYE on a graduated scale — 0% on the first ₦800,000 of annual chargeable income, then 15%–25% on income above that (Nigeria Tax Act 2025, effective 1 Jan 2026).</li>
                <li>Employer and employee make pension contributions (minimum 10% employer / 8% employee) on qualifying pensionable pay.</li>
                <li>NSITF and NHF contributions typically apply.</li>
                <li>PAYE is due to the relevant tax authority by the 10th of the month following deduction.</li>
              </ul>
            </div>
            <div className="rounded-xl bg-white p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">If treated as Contractor</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>No Labour Act entitlements from the engager — the relationship is governed by the service agreement.</li>
                <li>Payer applies Withholding Tax at source on professional/consultancy fees, generally 5%, remitted to the tax authority by the 21st of the following month.</li>
                <li>For resident individuals this WHT is usually a final tax on that income; companies still file and self-assess.</li>
                <li>Businesses below the small-company turnover threshold may be exempt from having WHT deducted on transactions of ₦2 million or less in a month, if a valid Tax ID is provided.</li>
                <li>Contractor is responsible for their own income tax self-assessment and remittance.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Misclassification risk</h4>
            <p className="text-sm text-gray-600">
              If an engagement labelled &quot;contractor&quot; is later found to be a contract of
              service in substance, the engager can be assessed for unremitted PAYE, pension, and
              other statutory deductions going back over the relationship, plus penalties and
              interest, in addition to Labour Act obligations such as unpaid leave or notice.
              Regulated sectors (e.g. oil and gas outsourcing) and platform/gig work face added
              scrutiny on this point.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Suggested next step</h4>
            <p className="text-sm text-gray-600">
              {result.tone === 'employee' &&
                'The indicators point toward an employment relationship. Consider formalising a written employment contract and registering the required statutory deductions.'}
              {result.tone === 'contractor' &&
                'The indicators point toward independent contracting. Make sure a proper service agreement is in place and that Withholding Tax is deducted and remitted correctly.'}
              {result.tone === 'mixed' &&
                'The factors are mixed. Review the specific terms with a labour lawyer or tax adviser before finalising how the relationship is documented and taxed.'}
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Indicative only, not legal or tax advice. Rates and thresholds reflect the Nigeria Tax
            Act 2025 (effective 1 January 2026) and related Withholding Tax Regulations, current as
            of publication — confirm current figures with the Nigeria Revenue Service before relying
            on them for compliance decisions.
          </p>
        </div>
      )}
    </div>
  )
}
