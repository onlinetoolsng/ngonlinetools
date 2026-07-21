-- seed/documents/offer-letter-ng.sql
-- Fills the 'offer-letter' / 'ng' row already defined in lib/documents/document-types.ts
-- (DOCUMENT_TYPES) but not yet present in the document_templates table.
--
-- Run in the Supabase SQL editor once the project is connected.
--
-- Status is intentionally 'draft' on insert — per the caution in
-- supabase/migrations/0002_create_document_templates.sql ("Every row should
-- be reviewed before status is set to 'published' — especially anything
-- touching tenancy, employment, or other higher-risk legal terms"). Review
-- the clauses below, then either edit this file's status to 'published'
-- before running it, or run the UPDATE at the bottom afterwards.
--
-- Uses dollar-quoting throughout so apostrophes in the copy never need
-- manual escaping.

insert into document_templates (
  document_type, country, title, intro, sections, signatures, fields,
  legal_note, seo_intro, status
) values (
  'offer-letter',
  'ng',
  'OFFER OF EMPLOYMENT',
$intro${{company_name}}
{{company_address}}

Dear {{candidate_name}},

We are pleased to offer you employment with {{company_name}} in the position of {{job_title}}, subject to the terms set out below. Please read this letter carefully, and let us know if you have any questions before signing.$intro$,
$sections$[
    {
      "heading": "1. Position and Nature of Employment",
      "body": "You are offered the position of {{job_title}} in the {{department}} department, reporting to {{reporting_to}}. Your employment will be {{employment_type}} and will be based at {{work_location}}. Your employment is expected to commence on {{start_date}}. In accordance with Section 7 of the Labour Act (Cap L1, Laws of the Federation of Nigeria 2004), a full written statement of the particulars of your employment will be issued to you not later than three months after your start date."
    },
    {
      "heading": "2. Probationary Period",
      "body": "Your employment will be subject to a probationary period of {{probation_period}}, during which either party may terminate the employment relationship on shorter notice than stated below. Your confirmation in the role will be communicated to you in writing at the end of this period, subject to satisfactory performance."
    },
    {
      "heading": "3. Hours of Work",
      "body": "Normal working hours are 8 hours per day, 40 hours per week, Monday to Friday, exclusive of a daily lunch break, unless otherwise agreed in writing. Any requirement to work beyond normal hours will be discussed and compensated in line with company policy."
    },
    {
      "heading": "4. Remuneration",
      "body": "Your basic salary will be {{basic_salary}} per month, and your gross monthly salary, inclusive of allowances, will be {{gross_monthly_salary}}. Salary is payable monthly by bank transfer, subject to statutory deductions described below. Housing and transport allowances, where applicable, form part of the pensionable base under the Pension Reform Act 2014 and will be itemized separately on your monthly payslip."
    },
    {
      "heading": "5. Leave Entitlements",
      "body": "Following the completion of twelve months of continuous service, you will be entitled to a minimum of 6 working days of annual leave with full pay, in line with Section 18 of the Labour Act. You will also be entitled to paid sick leave of up to 12 working days per year on production of a valid medical certificate, and, where applicable, maternity leave of up to 12 weeks as provided under the Labour Act. Public holidays observed in Nigeria will be granted in addition to annual leave."
    },
    {
      "heading": "6. Pension, Tax, and Other Statutory Deductions",
      "body": "You will be enrolled in a Retirement Savings Account with a Pension Fund Administrator of your choice, in accordance with the Pension Reform Act 2014. A minimum of 8% of your pensionable emoluments (basic salary plus housing and transport allowances) will be deducted from your pay as your contribution, matched by a minimum employer contribution of 10%. Pay-As-You-Earn (PAYE) tax will be deducted at source in accordance with the Nigeria Tax Act 2025 and remitted to the relevant tax authority on your behalf. Other statutory deductions, such as the National Housing Fund, will apply where you are enrolled or where participation is mandatory."
    },
    {
      "heading": "7. Termination and Notice",
      "body": "After the probationary period, this employment may be terminated by either party giving {{notice_period}} written notice, or payment in lieu of notice, subject to the minimum notice periods prescribed by Section 11 of the Labour Act based on length of service. {{company_name}} reserves the right to terminate your employment summarily for gross misconduct."
    },
    {
      "heading": "8. Conditions Precedent and Confidentiality",
      "body": "This offer is conditional upon the satisfactory completion of reference checks, verification of your qualifications, and any medical examination that {{company_name}} may reasonably require. During and after your employment, you agree to keep confidential all proprietary and confidential information belonging to {{company_name}} and its clients, and to assign to {{company_name}} any intellectual property created in the course of your employment."
    },
    {
      "heading": "9. Governing Law",
      "body": "This offer and any resulting contract of employment shall be governed by the laws of the Federal Republic of Nigeria."
    },
    {
      "heading": "10. Acceptance",
      "body": "Please indicate your acceptance of this offer by signing and returning a copy of this letter to {{signatory_name}}, {{signatory_title}}, on or before {{acceptance_deadline}}. We look forward to welcoming you to {{company_name}}."
    }
  ]$sections$::jsonb,
$signatures$[
    { "role": "For and on behalf of the Employer" },
    { "role": "Candidate (Acceptance)" }
  ]$signatures$::jsonb,
$fields$[
    { "id": "company_name", "label": "Company legal name", "type": "text", "placeholder": "e.g. Acme Nigeria Ltd", "required": true },
    { "id": "company_address", "label": "Company address", "type": "textarea", "placeholder": "e.g. 12 Adeola Odeku St, Victoria Island, Lagos", "required": true },
    { "id": "candidate_name", "label": "Candidate full name", "type": "text", "placeholder": "e.g. Chiamaka Okafor", "required": true },
    { "id": "job_title", "label": "Job title", "type": "text", "placeholder": "e.g. Marketing Executive", "required": true },
    { "id": "department", "label": "Department", "type": "text", "placeholder": "e.g. Marketing", "required": false },
    { "id": "reporting_to", "label": "Reports to", "type": "text", "placeholder": "e.g. Head of Marketing", "required": false },
    { "id": "work_location", "label": "Work location", "type": "text", "placeholder": "e.g. Lagos, Abuja, Remote", "required": true },
    { "id": "employment_type", "label": "Employment type", "type": "text", "placeholder": "e.g. Permanent, Fixed-term, Contract, Probationary", "required": true },
    { "id": "start_date", "label": "Start date", "type": "date", "placeholder": "", "required": true },
    { "id": "probation_period", "label": "Probation period", "type": "text", "placeholder": "e.g. 3 months", "required": false },
    { "id": "basic_salary", "label": "Basic salary (monthly)", "type": "text", "placeholder": "e.g. \u20a6300,000", "required": true },
    { "id": "gross_monthly_salary", "label": "Gross monthly salary", "type": "text", "placeholder": "e.g. \u20a6450,000", "required": true },
    { "id": "notice_period", "label": "Notice period", "type": "text", "placeholder": "e.g. 1 month", "required": false },
    { "id": "acceptance_deadline", "label": "Acceptance deadline", "type": "date", "placeholder": "", "required": false },
    { "id": "signatory_name", "label": "Authorized signatory name", "type": "text", "placeholder": "e.g. Tunde Bakare", "required": true },
    { "id": "signatory_title", "label": "Signatory title", "type": "text", "placeholder": "e.g. HR Manager", "required": false }
  ]$fields$::jsonb,
$legal_note$This offer letter template reflects Section 7 of the Labour Act (Cap L1, LFN 2004), which requires employers to give workers a written statement of employment particulars within three months of their start date, plus the Pension Reform Act 2014 and Nigeria Tax Act 2025 for statutory deductions. An offer letter is a preliminary document, not a full contract of employment -- issue a complete employment contract covering all Section 7 particulars within that three-month window.$legal_note$,
$seo$A job offer letter is the first written document a new hire in Nigeria receives, and getting it right matters both for compliance and for setting the right tone with a candidate. This free template covers the details Nigerian employers are expected to put in writing under the Labour Act (Cap L1, LFN 2004) -- the nature of the role, work location, working hours, remuneration, leave entitlements, and notice periods -- alongside the pension and tax deductions required under the Pension Reform Act 2014 and the Nigeria Tax Act 2025. Fill in your company and candidate details, download the letter as a PDF or Word document, and have it signed by both parties. Remember that an offer letter is a preliminary document: Section 7 of the Labour Act still requires you to issue a full written contract of employment, covering the same particulars in more detail, within three months of the employee's start date.$seo$,
  'draft'
)
on conflict (document_type, country) do update set
  title = excluded.title,
  intro = excluded.intro,
  sections = excluded.sections,
  signatures = excluded.signatures,
  fields = excluded.fields,
  legal_note = excluded.legal_note,
  seo_intro = excluded.seo_intro,
  status = excluded.status;

-- Once reviewed, publish it with:
-- update document_templates set status = 'published' where document_type = 'offer-letter' and country = 'ng';
