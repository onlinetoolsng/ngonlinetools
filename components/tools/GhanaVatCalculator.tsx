'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function GhanaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="GH" />
}
