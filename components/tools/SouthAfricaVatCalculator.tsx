'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function SouthAfricaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="ZA" />
}
