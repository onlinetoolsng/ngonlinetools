// lib/documents/document-types.ts
//
// Dropdown/grouping source for the free Document Templates feature.
// Ported from naira.autos's lib/document-types.ts, adapted from vehicle
// documents to general Nigerian business/legal documents.
//
// `tier` is kept for parity with naira.autos even though this site only
// ships the 'template' tier — it marks which future documents would be
// good template-tier candidates (low variability) vs. AI-tier candidates
// (too much per-deal variation), in case an AI tier is added later.
//
// `category` is the display-grouping label used on the /documents index
// page ("Property & Tenancy", "Employment & HR", etc). `categorySlug` is
// separate: it maps each document type onto the SAME category taxonomy
// tools and blog articles use (lib/registry/categories.ts — 'finance',
// 'tax', 'hr-payroll', ...). Templates didn't have any notion of category
// before; this is what lets the related-content sections on tool, blog,
// and template pages cross-link to each other within a shared category
// instead of only linking within their own content type.

import type { Category } from '@/lib/registry/categories';

export interface DocumentTypeDef {
  slug: string;
  label: string;
  description: string;
  tier: 'template' | 'ai';
  category: string;
  categorySlug: Category['slug'] | (string & {});
  popular: boolean;
}

export const DOCUMENT_TYPES: DocumentTypeDef[] = [
  // ── Property & Tenancy ──────────────────────────────────────────────────
  { slug: 'tenancy-agreement', label: 'Tenancy Agreement', description: 'Terms between a landlord and tenant for a residential rental.', tier: 'template', category: 'Property & Tenancy', categorySlug: 'real-estate', popular: true },
  { slug: 'rent-receipt', label: 'Rent Receipt', description: 'Confirms a rent payment received from a tenant.', tier: 'template', category: 'Property & Tenancy', categorySlug: 'real-estate', popular: true },
  { slug: 'quit-notice', label: 'Notice to Quit', description: 'A landlord\u2019s formal notice for a tenant to vacate a property.', tier: 'template', category: 'Property & Tenancy', categorySlug: 'real-estate', popular: false },
  { slug: 'land-sale-agreement', label: 'Land Sale Agreement', description: 'Records the sale and transfer of land between two parties.', tier: 'ai', category: 'Property & Tenancy', categorySlug: 'real-estate', popular: false },
  { slug: 'caretaker-agreement', label: 'Property Caretaker Agreement', description: 'Terms for someone looking after a property on the owner\u2019s behalf.', tier: 'template', category: 'Property & Tenancy', categorySlug: 'real-estate', popular: false },

  // ── Employment & HR ──────────────────────────────────────────────────────
  { slug: 'employment-contract', label: 'Employment Contract', description: 'Terms of employment between an employer and employee.', tier: 'template', category: 'Employment & HR', categorySlug: 'hr-payroll', popular: true },
  { slug: 'offer-letter', label: 'Job Offer Letter', description: 'Formally offers a candidate a position and its terms.', tier: 'template', category: 'Employment & HR', categorySlug: 'hr-payroll', popular: true },
  { slug: 'termination-letter', label: 'Termination of Employment Letter', description: 'Formally notifies an employee that their employment is ending.', tier: 'template', category: 'Employment & HR', categorySlug: 'hr-payroll', popular: false },
  { slug: 'employee-nda', label: 'Employee Non-Disclosure Agreement', description: 'Protects confidential company information shared with an employee.', tier: 'template', category: 'Employment & HR', categorySlug: 'hr-payroll', popular: false },
  { slug: 'salary-increment-letter', label: 'Salary Increment Letter', description: 'Confirms a change to an employee\u2019s salary.', tier: 'template', category: 'Employment & HR', categorySlug: 'hr-payroll', popular: false },
  { slug: 'employment-reference-letter', label: 'Employment Reference Letter', description: 'Confirms a former employee\u2019s role, dates, and conduct.', tier: 'template', category: 'Employment & HR', categorySlug: 'hr-payroll', popular: false },

  // ── Business & Partnership ────────────────────────────────────────────────
  { slug: 'partnership-agreement', label: 'Business Partnership Agreement', description: 'Terms between two or more people going into business together.', tier: 'ai', category: 'Business & Partnership', categorySlug: 'business', popular: true },
  { slug: 'mutual-nda', label: 'Mutual Non-Disclosure Agreement', description: 'Protects confidential information shared between two businesses.', tier: 'template', category: 'Business & Partnership', categorySlug: 'business', popular: true },
  { slug: 'service-agreement', label: 'Service Agreement', description: 'Terms for a business providing a service to a client.', tier: 'template', category: 'Business & Partnership', categorySlug: 'business', popular: true },
  { slug: 'freelance-contract', label: 'Freelance/Independent Contractor Agreement', description: 'Terms for engaging a freelancer or contractor for a project.', tier: 'template', category: 'Business & Partnership', categorySlug: 'business', popular: true },
  { slug: 'memorandum-of-understanding', label: 'Memorandum of Understanding (MOU)', description: 'Records a non-binding understanding between two parties before a formal contract.', tier: 'template', category: 'Business & Partnership', categorySlug: 'business', popular: false },
  { slug: 'business-proposal-cover-letter', label: 'Business Proposal Cover Letter', description: 'Introduces a business proposal being submitted to a client or partner.', tier: 'template', category: 'Business & Partnership', categorySlug: 'business', popular: false },

  // ── Loans & Money ────────────────────────────────────────────────────────
  { slug: 'loan-agreement', label: 'Personal Loan Agreement', description: 'Records a loan between two individuals and its repayment terms.', tier: 'template', category: 'Loans & Money', categorySlug: 'finance', popular: true },
  { slug: 'iou-acknowledgment-of-debt', label: 'IOU / Acknowledgment of Debt', description: 'A short written acknowledgment that money is owed.', tier: 'template', category: 'Loans & Money', categorySlug: 'finance', popular: true },
  { slug: 'promissory-note', label: 'Promissory Note', description: 'A written promise to pay a specific sum by a set date.', tier: 'template', category: 'Loans & Money', categorySlug: 'finance', popular: false },
  { slug: 'debt-repayment-plan', label: 'Debt Repayment Plan', description: 'Sets out an installment schedule for repaying a debt.', tier: 'template', category: 'Loans & Money', categorySlug: 'finance', popular: false },

  // ── Personal & Family ────────────────────────────────────────────────────
  { slug: 'power-of-attorney', label: 'Power of Attorney', description: 'Authorizes someone to act on your behalf in specified matters.', tier: 'ai', category: 'Personal & Family', categorySlug: 'everyday', popular: true },
  { slug: 'affidavit-of-name-change', label: 'Affidavit of Name Change', description: 'A sworn statement declaring a change of name.', tier: 'template', category: 'Personal & Family', categorySlug: 'everyday', popular: true },
  { slug: 'affidavit-of-loss', label: 'Affidavit of Loss', description: 'A sworn statement declaring an item or document as lost.', tier: 'template', category: 'Personal & Family', categorySlug: 'everyday', popular: true },
  { slug: 'consent-letter-for-minor-travel', label: 'Consent Letter for Minor Travel', description: 'A parent/guardian\u2019s consent for a minor to travel without them.', tier: 'template', category: 'Personal & Family', categorySlug: 'everyday', popular: false },
  { slug: 'guarantor-form', label: 'Guarantor Form', description: 'A guarantor\u2019s undertaking to vouch for someone, commonly used for tenancy or employment.', tier: 'template', category: 'Personal & Family', categorySlug: 'everyday', popular: true },

  // ── Letters & Notices ────────────────────────────────────────────────────
  { slug: 'demand-letter', label: 'Demand Letter', description: 'Formally demands payment or action before further steps are taken.', tier: 'template', category: 'Letters & Notices', categorySlug: 'finance', popular: false },
  { slug: 'authorization-letter', label: 'General Authorization Letter', description: 'Authorizes another person to act or collect something on your behalf.', tier: 'template', category: 'Letters & Notices', categorySlug: 'everyday', popular: true },
  { slug: 'resignation-letter', label: 'Resignation Letter', description: 'Formally notifies an employer of an employee\u2019s resignation.', tier: 'template', category: 'Letters & Notices', categorySlug: 'hr-payroll', popular: true },
];

export function getDocumentType(slug: string): DocumentTypeDef | undefined {
  return DOCUMENT_TYPES.find(d => d.slug === slug);
}

export function getDocumentTypesByCategorySlug(categorySlug: string): DocumentTypeDef[] {
  return DOCUMENT_TYPES.filter(d => d.categorySlug === categorySlug);
}

// Flat, ungrouped ordering: popular first (alphabetical among themselves),
// then everything else alphabetically.
export const DOCUMENT_TYPES_SORTED: DocumentTypeDef[] = [
  ...DOCUMENT_TYPES.filter(d => d.popular).sort((a, b) => a.label.localeCompare(b.label)),
  ...DOCUMENT_TYPES.filter(d => !d.popular).sort((a, b) => a.label.localeCompare(b.label)),
];

// ── Country/jurisdiction dimension ──────────────────────────────────────
// Kept (rather than dropped) so the schema and routing stay identical to
// naira.autos's /documents/[type]/[country] shape.

export interface DocumentCountryDef {
  code: string;
  name: string;
  flag: string;
  popular: boolean;
}

export const DOCUMENT_COUNTRIES: DocumentCountryDef[] = [
  { code: 'ng', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}', popular: true },
  { code: 'gh', name: 'Ghana', flag: '\u{1F1EC}\u{1F1ED}', popular: true },
  { code: 'ke', name: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}', popular: true },
  { code: 'sa', name: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}', popular: true },
  { code: 'bw', name: 'Botswana', flag: '\u{1F1E7}\u{1F1FC}', popular: false },
  { code: 'rw', name: 'Rwanda', flag: '\u{1F1F7}\u{1F1FC}', popular: false },
  { code: 'ug', name: 'Uganda', flag: '\u{1F1FA}\u{1F1EC}', popular: false },
];

export function getDocumentCountry(code: string): DocumentCountryDef | undefined {
  return DOCUMENT_COUNTRIES.find(c => c.code === code);
}

// Document types flagged as higher legal risk — shown with a stronger
// warning since even a well-drafted template can't substitute for local
// legal review on these.
export const HIGH_RISK_DOCUMENT_TYPES = new Set([
  'power-of-attorney',
  'land-sale-agreement',
  'partnership-agreement',
  'loan-agreement',
]);
