'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function MoroccoVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="MA" />
}
