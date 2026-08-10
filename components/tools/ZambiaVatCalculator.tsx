'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function ZambiaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="ZM" />
}
