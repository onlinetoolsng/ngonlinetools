'use client'

import { AfricaVatCalculator } from './AfricaVatCalculator'

export default function KenyaVatCalculator(props: { locale: string }) {
  return <AfricaVatCalculator {...props} defaultCountry="KE" />
}
