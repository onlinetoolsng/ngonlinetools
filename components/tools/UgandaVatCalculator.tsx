'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function UgandaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="UG" />
}
