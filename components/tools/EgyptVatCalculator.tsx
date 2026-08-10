'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function EgyptVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="EG" />
}
