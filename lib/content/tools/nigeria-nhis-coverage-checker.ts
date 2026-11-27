// 📁 lib/content/tools/nigeria-nhis-coverage-checker.ts
// Sources: NHIA benefit package descriptions in Nigerian press (2026), Commonwealth Fund country profile, NHIS handbook excerpts.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Does NHIS Cover It? Nigeria NHIA Coverage Checker (Dental, Surgery, Maternity)',
  description:
    'Search the standard NHIA benefit package to see whether a service such as dental care, caesarean section, dialysis or IVF is generally covered, partly covered or excluded.',
  meta_description:
    'What does NHIS cover in Nigeria? Search dental, eye care, surgery, maternity, dialysis and more to see what is covered, partly covered or excluded.',
  article_title: 'What the NHIS (NHIA) Covers and Excludes in Nigeria',
  last_updated: '2026-11-27',
  article_body: `The National Health Insurance Authority (NHIA) runs Nigeria's social health insurance. Its standard benefit package covers primary and secondary care. Cover differs between plans and HMOs, so use this checker as a starting point and confirm with your HMO.

## What is generally covered

- Outpatient consultations and specialist consultations on referral
- Laboratory tests and diagnostics on the approved list
- Essential prescription drugs, with a co-payment reported at 10%
- Emergency care and hospital admission
- Maternity care: antenatal care, normal delivery, caesarean section, and neonatal and postnatal care
- Basic dental care: consultation, preventive care, fillings and simple extractions
- Eye examination and low-priced spectacles (not contact lenses)
- An annual medical check-up and preventive care
- Prostheses made in Nigeria

## Partly covered

Some services get only partial support under cost-sharing arrangements. Reports mention CT scans and MRI (co-payment), kidney dialysis, physiotherapy, optical services and cancer treatment.

## What is generally excluded

Cosmetic surgery, in-vitro fertilisation, family planning commodities, home visits, dental implants, complex surgeries such as cardiac surgery and renal transplants, contact lenses, patient evacuation and work-related injuries (covered through workers' compensation).

## Surgery

Selected surgical procedures are covered, but not every operation is. For a specific operation such as fibroid, hernia or appendix surgery, ask your HMO whether it is on the approved list and whether pre-authorisation is needed.

## Always confirm

Benefit packages vary by scheme (formal sector, informal sector, vulnerable groups and state schemes), and they are revised. Your HMO's current list is the authority.`,
  faq: [
    {
      q: 'Does NHIS cover dental treatment in Nigeria?',
      a: 'Basic dental care is covered: consultation, preventive care, fillings and simple extractions. Dental implants are excluded.',
    },
    {
      q: 'Does NHIS cover caesarean section?',
      a: 'Maternity care, including antenatal care, normal delivery and caesarean section when medically needed, is part of the standard package. Confirm details with your HMO.',
    },
    {
      q: 'Does NHIS cover surgery?',
      a: 'Selected surgical procedures are covered, but complex surgeries such as cardiac surgery and renal transplants are reported as excluded. Ask your HMO about your specific operation.',
    },
    {
      q: 'Does NHIS cover fibroid surgery?',
      a: 'It depends on your plan and the HMO\'s approved procedure list. Ask your HMO and check whether pre-authorisation is required.',
    },
    {
      q: 'Does NHIS cover IVF?',
      a: 'No. In-vitro fertilisation is reported as excluded from the benefit package.',
    },
    {
      q: 'Does NHIS cover dialysis?',
      a: 'Partial support is reported for kidney dialysis under cost-sharing. The amount and number of sessions depend on your plan.',
    },
    {
      q: 'Does NHIS cover glasses?',
      a: 'Eye examination and low-priced spectacles are covered. Contact lenses are not.',
    },
    {
      q: 'Who do I ask to confirm my cover?',
      a: 'Your HMO or the NHIA. Benefits differ between plans, so ask them for your plan\'s current benefit list.',
    },
  ],
}

export default content
